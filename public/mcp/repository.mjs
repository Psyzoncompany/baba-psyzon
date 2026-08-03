import { createHash, randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';

const ROOT_PATHS = Object.freeze({
  meta: [],
  babas: ['participants', 'teams', 'games', 'goals', 'payments', 'stats'],
  players: [],
  purchase_goals: [],
  player_stats: [],
  months: ['payments', 'stats'],
  imports: ['audit_logs', 'warnings'],
  aliases: [],
  import_keys: [],
  player_name_keys: [],
  player_status_history: [],
  migrations: ['legacy_chunks'],
  schema_migrations: [],
  mcp_audit: [],
});

const WRITABLE_ROOTS = new Set([
  'meta', 'babas', 'players', 'purchase_goals', 'player_stats', 'months',
  'aliases', 'player_status_history',
]);

const MAX_DOCUMENT_BYTES = 256_000;
const MAX_LIST_LIMIT = 250;

function normalizePath(value) {
  const path = String(value || '').trim().replace(/^\/+|\/+$/g, '');
  if (!path || path.length > 700 || path.includes('\\') || path.includes('//')) {
    throw new Error('Caminho relativo inválido.');
  }
  const segments = path.split('/');
  if (segments.length > 4 || segments.some((segment) => !segment || segment === '.' || segment === '..' || segment.length > 180)) {
    throw new Error('O caminho contém um segmento inválido.');
  }
  return { path, segments };
}

function validateKnownPath(value, expectedType, { write = false } = {}) {
  const normalized = normalizePath(value);
  const isDocument = normalized.segments.length % 2 === 0;
  if ((expectedType === 'document' && !isDocument) || (expectedType === 'collection' && isDocument)) {
    throw new Error(`O caminho precisa apontar para ${expectedType === 'document' ? 'um documento' : 'uma coleção'}.`);
  }
  const [root] = normalized.segments;
  if (!Object.hasOwn(ROOT_PATHS, root)) throw new Error(`Coleção raiz não permitida: ${root}.`);
  if (write && !WRITABLE_ROOTS.has(root)) throw new Error(`A coleção ${root} é somente leitura pelo MCP.`);

  for (let index = 2; index < normalized.segments.length; index += 2) {
    const nestedCollection = normalized.segments[index];
    if (!ROOT_PATHS[root].includes(nestedCollection)) {
      throw new Error(`Subcoleção não permitida em ${root}: ${nestedCollection}.`);
    }
  }
  return normalized.path;
}

function validateOrderField(value) {
  const field = String(value || '').trim();
  if (!field) return '';
  if (!/^[a-zA-Z_][a-zA-Z0-9_.]{0,127}$/.test(field) || field.includes('__')) {
    throw new Error('Campo de ordenação inválido.');
  }
  return field;
}

function jsonSafe(value) {
  if (value == null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (typeof value?.latitude === 'number' && typeof value?.longitude === 'number') {
    return { latitude: value.latitude, longitude: value.longitude };
  }
  if (typeof value?.path === 'string' && value.firestore) return { referencePath: value.path };
  if (typeof value === 'object') {
    return Object.entries(value).reduce((result, [key, item]) => {
      result[key] = jsonSafe(item);
      return result;
    }, {});
  }
  return String(value);
}

function validateDocumentData(data) {
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    throw new Error('dados deve ser um objeto JSON.');
  }
  const raw = JSON.stringify(data);
  if (Buffer.byteLength(raw, 'utf8') > MAX_DOCUMENT_BYTES) {
    throw new Error(`Documento acima do limite MCP de ${MAX_DOCUMENT_BYTES} bytes.`);
  }
  const hasReservedField = (value) => value && typeof value === 'object' && Object.entries(value).some(([key, item]) => (
    key.includes('__') || hasReservedField(item)
  ));
  if (hasReservedField(data)) throw new Error('Campos reservados não são permitidos.');
  return JSON.parse(raw);
}

function snapshotData(snapshot) {
  if (!snapshot.exists) return null;
  return jsonSafe({ id: snapshot.id, path: snapshot.ref.path, ...snapshot.data() });
}

function asLimit(value, fallback = 50) {
  return Math.min(MAX_LIST_LIMIT, Math.max(1, Number(value || fallback)));
}

export function createBabaRepository({ db, accountId, accountAlias = 'principal' }) {
  const accountRef = db.collection('baba_accounts').doc(accountId);

  function documentRef(path, options) {
    return accountRef.collection(path.split('/')[0]).doc(path.split('/').slice(1).join('/'));
  }

  function checkedDocumentRef(path, options) {
    return documentRef(validateKnownPath(path, 'document', options));
  }

  function collectionRef(path) {
    const normalized = validateKnownPath(path, 'collection');
    const segments = normalized.split('/');
    let reference = accountRef.collection(segments[0]);
    for (let index = 1; index < segments.length; index += 2) {
      reference = reference.doc(segments[index]).collection(segments[index + 1]);
    }
    return reference;
  }

  async function getDocument(path) {
    const snapshot = await checkedDocumentRef(path).get();
    return snapshotData(snapshot);
  }

  async function listCollection(path, options = {}) {
    const normalizedPath = validateKnownPath(path, 'collection');
    const limitValue = asLimit(options.limit);
    let query = collectionRef(normalizedPath);
    const orderField = validateOrderField(options.orderBy);
    if (orderField) query = query.orderBy(orderField, options.direction === 'asc' ? 'asc' : 'desc');
    if (options.cursorId) {
      const cursor = await checkedDocumentRef(`${normalizedPath}/${String(options.cursorId).trim()}`).get();
      if (!cursor.exists) throw new Error('Documento de cursor não encontrado.');
      query = query.startAfter(cursor);
    }
    const snapshot = await query.limit(limitValue).get();
    let documents = snapshot.docs.map(snapshotData);
    if (!options.includeDeleted) documents = documents.filter((item) => item.deleted !== true);
    return {
      collection: normalizedPath,
      documents,
      returned: documents.length,
      nextCursorId: snapshot.size === limitValue ? snapshot.docs.at(-1)?.id || null : null,
    };
  }

  async function listPlayers(options = {}) {
    const result = await listCollection('players', { limit: options.limit || 200, includeDeleted: false });
    const search = String(options.search || '').trim().toLocaleLowerCase('pt-BR');
    result.documents = result.documents.filter((player) => {
      if (!options.includeInactive && (player.ativo === false || player.active === false || player.deleted === true)) return false;
      if (!search) return true;
      return [player.nome, player.name, player.apelido, player.id]
        .some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(search));
    });
    result.returned = result.documents.length;
    return result;
  }

  async function listBabas(options = {}) {
    const result = await listCollection('babas', {
      limit: options.limit || 50,
      includeDeleted: false,
      orderBy: 'criadoEm',
      direction: 'desc',
    });
    if (options.status) result.documents = result.documents.filter((item) => item.status === options.status);
    result.returned = result.documents.length;
    return result;
  }

  async function getBaba(babaId, include = []) {
    const safeBabaId = String(babaId || '').trim();
    if (!/^[a-zA-Z0-9_-]{1,180}$/.test(safeBabaId)) throw new Error('ID do Baba inválido.');
    const baba = await getDocument(`babas/${safeBabaId}`);
    if (!baba || baba.deleted === true) return null;
    const allowed = new Set(ROOT_PATHS.babas);
    const requested = [...new Set(include)].filter((name) => allowed.has(name));
    const details = await Promise.all(requested.map(async (name) => [
      name,
      (await listCollection(`babas/${safeBabaId}/${name}`, { limit: name === 'goals' ? 250 : 100 })).documents,
    ]));
    return { ...baba, details: Object.fromEntries(details) };
  }

  async function countCollection(path) {
    const result = await collectionRef(path).count().get();
    return Number(result.data().count || 0);
  }

  async function summary() {
    const [live, playerCount, babaCount, monthCount, recent] = await Promise.all([
      getDocument('meta/live'),
      countCollection('players'),
      countCollection('babas'),
      countCollection('months'),
      listBabas({ limit: 5 }),
    ]);
    return {
      accountId,
      accountAlias,
      schemaVersion: Number(live?.schemaVersion || 2),
      live,
      totals: { players: playerCount, babas: babaCount, months: monthCount },
      recentBabas: recent.documents,
    };
  }

  async function previewChange({ path, data, mode = 'mesclar', reason = '' }) {
    const normalizedPath = validateKnownPath(path, 'document', { write: true });
    const normalizedData = validateDocumentData(data);
    const before = await getDocument(normalizedPath);
    return {
      change: { path: normalizedPath, data: normalizedData, mode: mode === 'substituir' ? 'substituir' : 'mesclar', reason: String(reason || '').slice(0, 500) },
      preview: { before, submittedData: normalizedData, createsDocument: before == null },
    };
  }

  async function saveChange(change) {
    const path = validateKnownPath(change.path, 'document', { write: true });
    const data = validateDocumentData(change.data);
    const before = await getDocument(path);
    const timestamp = Date.now();
    const payload = {
      ...data,
      updatedAtMs: timestamp,
      mcpUpdatedAt: FieldValue.serverTimestamp(),
      mcpSource: 'sitey-caixa-mcp',
    };
    const auditId = `${timestamp}_${randomUUID()}`;
    const digest = createHash('sha256').update(JSON.stringify(data)).digest('hex');
    const batch = db.batch();
    batch.set(checkedDocumentRef(path, { write: true }), payload, { merge: change.mode !== 'substituir' });
    batch.set(accountRef.collection('mcp_audit').doc(auditId), {
      action: before ? 'update' : 'create',
      documentPath: path,
      mode: change.mode,
      reason: String(change.reason || '').slice(0, 500),
      changedFields: Object.keys(data).slice(0, 200),
      payloadSha256: digest,
      source: 'sitey-caixa-mcp',
      accountAlias,
      createdAtMs: timestamp,
      createdAt: FieldValue.serverTimestamp(),
      schemaVersion: 1,
    });
    await batch.commit();
    return { path, before, after: await getDocument(path), auditId };
  }

  return Object.freeze({ summary, listPlayers, listBabas, getBaba, getDocument, listCollection, previewChange, saveChange });
}

export { ROOT_PATHS, WRITABLE_ROOTS, jsonSafe, normalizePath, validateDocumentData, validateKnownPath };
