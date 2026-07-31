require('dotenv').config();
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const sharp = require('sharp');
const template = require('./baba-manual-template.js');

const app = express();
const port = Number(process.env.PORT || 3000);
const maxImageBytes = Number(process.env.BABA_MANUAL_OCR_MAX_BYTES || 15 * 1024 * 1024);
const allowedOrigins = String(process.env.BABA_MANUAL_OCR_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origem nao autorizada para o OCR.'));
  },
}));
app.use(express.json({ limit: '22mb' }));
app.use(express.static(__dirname, { extensions: ['html'] }));

function apiKeyAuthorized(request) {
  const configured = String(process.env.BABA_MANUAL_OCR_API_KEY || '').trim();
  if (!configured) return true;
  return request.get('x-baba-ocr-key') === configured;
}

function decodeImageDataUrl(value) {
  const match = String(value || '').match(/^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=\s]+)$/i);
  if (!match) throw Object.assign(new Error('Envie uma imagem PNG, JPG ou WEBP normalizada.'), { status: 400, code: 'INVALID_IMAGE_DATA' });
  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!buffer.length || buffer.length > maxImageBytes) {
    throw Object.assign(new Error(`A imagem deve ter no maximo ${Math.round(maxImageBytes / 1024 / 1024)} MB.`), { status: 413, code: 'IMAGE_TOO_LARGE' });
  }
  const png = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const webp = buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (!png && !jpeg && !webp) throw Object.assign(new Error('O conteudo do arquivo nao corresponde a uma imagem aceita.'), { status: 400, code: 'INVALID_MAGIC_BYTES' });
  return buffer;
}

function scaledRegion(region, width, height) {
  return {
    left: Math.max(0, Math.round((region.x / template.sourceWidth) * width)),
    top: Math.max(0, Math.round((region.y / template.sourceHeight) * height)),
    width: Math.max(1, Math.round((region.width / template.sourceWidth) * width)),
    height: Math.max(1, Math.round((region.height / template.sourceHeight) * height)),
  };
}

function wordText(word) {
  return (word.symbols || []).map((symbol) => symbol.text || '').join('').trim();
}

function flattenVisionWords(annotation) {
  const words = [];
  (annotation?.pages || []).forEach((page) => {
    (page.blocks || []).forEach((block) => {
      (block.paragraphs || []).forEach((paragraph) => {
        (paragraph.words || []).forEach((word) => {
          const vertices = word.boundingBox?.vertices || [];
          const xs = vertices.map((vertex) => Number(vertex.x || 0));
          const ys = vertices.map((vertex) => Number(vertex.y || 0));
          const left = Math.min(...xs);
          const right = Math.max(...xs);
          const top = Math.min(...ys);
          const bottom = Math.max(...ys);
          words.push({
            text: wordText(word),
            confidence: Number(word.confidence || paragraph.confidence || block.confidence || 0),
            left,
            right,
            top,
            bottom,
            centerX: (left + right) / 2,
            centerY: (top + bottom) / 2,
          });
        });
      });
    });
  });
  return words.filter((word) => word.text);
}

function wordsInsideRegion(words, region) {
  const selected = words.filter((word) => (
    word.centerX >= region.left
    && word.centerX <= region.left + region.width
    && word.centerY >= region.top
    && word.centerY <= region.top + region.height
  )).sort((left, right) => left.centerY - right.centerY || left.left - right.left);
  return {
    text: selected.map((word) => word.text).join(' ').replace(/\s+/g, ' ').trim(),
    confidence: selected.length
      ? selected.reduce((sum, word) => sum + Number(word.confidence || 0), 0) / selected.length
      : 0,
  };
}

async function recognizeWithGoogleVision(imageBuffer, width, height) {
  if (String(process.env.BABA_MANUAL_OCR_PROVIDER || 'auto').toLowerCase() === 'tesseract') return null;
  const credentialsConfigured = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || process.env.GOOGLE_CLOUD_PROJECT
    || process.env.GCLOUD_PROJECT;
  if (!credentialsConfigured && String(process.env.BABA_MANUAL_GOOGLE_VISION || '').toLowerCase() !== 'true') return null;
  const vision = require('@google-cloud/vision');
  const client = new vision.ImageAnnotatorClient();
  const [result] = await client.documentTextDetection({ image: { content: imageBuffer } });
  if (result.error?.message) throw new Error(result.error.message);
  const words = flattenVisionWords(result.fullTextAnnotation);
  const header = Object.fromEntries(Object.entries(template.headerRegions).map(([key, region]) => [
    key,
    wordsInsideRegion(words, scaledRegion(region, width, height)),
  ]));
  const teams = template.teams.map((team) => ({
    jogadores: team.jogadores.map((player) => wordsInsideRegion(words, scaledRegion(player.nameRegion, width, height))),
  }));
  const confidences = [
    ...Object.values(header).map((item) => item.confidence),
    ...teams.flatMap((team) => team.jogadores.map((player) => player.confidence)),
  ].filter((value) => value > 0);
  return {
    engine: 'google-vision-document-text',
    confidence: confidences.length ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length : 0,
    data: header.data.text,
    local: header.local.text,
    responsavel: header.responsavel.text,
    teams: teams.map((team) => ({
      jogadores: team.jogadores.map((player) => ({ nome: player.text, confidence: player.confidence })),
    })),
  };
}

let tesseractWorkerPromise = null;

async function tesseractWorker() {
  if (!tesseractWorkerPromise) {
    const { createWorker, PSM } = require('tesseract.js');
    tesseractWorkerPromise = createWorker('por', 1, {
      langPath: process.env.TESSERACT_LANG_PATH || 'https://tessdata.projectnaptha.com/4.0.0',
      cachePath: path.join(__dirname, '.tesseract-cache'),
      logger: process.env.BABA_MANUAL_OCR_DEBUG === 'true' ? (message) => console.log('[tesseract]', message) : undefined,
    }).then(async (worker) => {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
        preserve_interword_spaces: '1',
        user_defined_dpi: '300',
      });
      return worker;
    });
  }
  return tesseractWorkerPromise;
}

async function recognizeCrop(imageBuffer, region) {
  const crop = await sharp(imageBuffer)
    .extract(region)
    .resize({ width: Math.max(900, region.width * 3), withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toBuffer();
  const worker = await tesseractWorker();
  const result = await worker.recognize(crop);
  return {
    text: String(result.data.text || '').replace(/\s+/g, ' ').trim(),
    confidence: Math.max(0, Math.min(1, Number(result.data.confidence || 0) / 100)),
  };
}

async function recognizeWithTesseract(imageBuffer, width, height) {
  const header = {};
  for (const [key, sourceRegion] of Object.entries(template.headerRegions)) {
    header[key] = await recognizeCrop(imageBuffer, scaledRegion(sourceRegion, width, height));
  }
  const teams = [];
  for (const team of template.teams) {
    const jogadores = [];
    for (const player of team.jogadores) {
      jogadores.push(await recognizeCrop(imageBuffer, scaledRegion(player.nameRegion, width, height)));
    }
    teams.push({ jogadores });
  }
  const confidences = [
    ...Object.values(header).map((item) => item.confidence),
    ...teams.flatMap((team) => team.jogadores.map((player) => player.confidence)),
  ].filter((value) => value > 0);
  return {
    engine: 'tesseract-por-fallback',
    confidence: confidences.length ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length : 0,
    data: header.data.text,
    local: header.local.text,
    responsavel: header.responsavel.text,
    teams: teams.map((team) => ({
      jogadores: team.jogadores.map((player) => ({ nome: player.text, confidence: player.confidence })),
    })),
  };
}

async function analyzeScoreSheet(imageBuffer) {
  const metadata = await sharp(imageBuffer).metadata();
  if (!metadata.width || !metadata.height) throw Object.assign(new Error('Nao foi possivel ler as dimensoes da imagem.'), { status: 400, code: 'INVALID_IMAGE' });
  try {
    const visionResult = await recognizeWithGoogleVision(imageBuffer, metadata.width, metadata.height);
    if (visionResult) return visionResult;
  } catch (error) {
    console.warn('Google Vision indisponivel; usando Tesseract:', error.message);
  }
  return recognizeWithTesseract(imageBuffer, metadata.width, metadata.height);
}

app.get('/health', (request, response) => {
  response.status(200).json({
    ok: true,
    service: 'sitey-caixa',
    manualOcr: true,
    provider: process.env.BABA_MANUAL_OCR_PROVIDER || 'auto',
  });
});

app.post('/api/manual-score-sheet/analyze', async (request, response) => {
  if (!apiKeyAuthorized(request)) return response.status(401).json({ ok: false, code: 'UNAUTHORIZED', message: 'Chave do OCR invalida.' });
  try {
    const imageBuffer = decodeImageDataUrl(request.body?.image);
    const result = await analyzeScoreSheet(imageBuffer);
    return response.status(200).json({ ok: true, templateId: template.id, ...result });
  } catch (error) {
    console.error('Falha no OCR da sumula manual:', error);
    return response.status(Number(error.status || 500)).json({
      ok: false,
      code: error.code || 'OCR_FAILED',
      message: error.status ? error.message : 'Nao foi possivel executar o OCR. Revise os nomes manualmente.',
    });
  }
});

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  return response.status(400).json({ ok: false, code: 'REQUEST_REJECTED', message: error.message || 'Requisicao invalida.' });
});

const server = app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

async function shutdown() {
  server.close();
  if (tesseractWorkerPromise) {
    try {
      const worker = await tesseractWorkerPromise;
      await worker.terminate();
    } catch (error) {
      console.warn('Nao foi possivel encerrar o Tesseract:', error.message);
    }
  }
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);

module.exports = { app, analyzeScoreSheet, decodeImageDataUrl, scaledRegion };
