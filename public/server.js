require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'sitey-caixa' });
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
