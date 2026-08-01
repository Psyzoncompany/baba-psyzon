import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const args = new Set(process.argv.slice(2));
const down = args.has('--down');
const confirmedDown = args.has('--confirm-down');
if (down && !confirmedDown) {
  throw new Error('A reversão exige --down --confirm-down. Ela remove apenas campos/índices lógicos criados por esta migration.');
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
if (!getApps().length) {
  initializeApp({ credential: applicationDefault(), ...(projectId ? { projectId } : {}) });
}
const db = getFirestore();
const accountUid = String(process.env.BABA_ACCOUNT_UID || '').trim();
if (!accountUid) {
  throw new Error('Defina BABA_ACCOUNT_UID com o UID da conta Google que receberá a migration.');
}
const accountRef = db.collection('baba_accounts').doc(accountUid);

function normalizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9' -]/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeAlias(value) {
  return normalizeName(value).replace(/[ '\-]/g, '');
}

async function commitChunks(operations) {
  for (let offset = 0; offset < operations.length; offset += 400) {
    const batch = db.batch();
    operations.slice(offset, offset + 400).forEach((operation) => operation(batch));
    await batch.commit();
  }
}

async function migrateUp() {
  const snapshot = await accountRef.collection('players').get();
  const operations = [];
  snapshot.docs.forEach((playerSnapshot) => {
    const player = playerSnapshot.data();
    if (player.deleted) return;
    const name = player.nome || player.name || '';
    const normalizedName = normalizeName(name);
    const normalizedAliasKey = normalizeAlias(name);
    if (!normalizedAliasKey) return;
    operations.push((batch) => batch.set(playerSnapshot.ref, { normalizedName, normalizedAliasKey }, { merge: true }));
    operations.push((batch) => batch.set(accountRef.collection('player_name_keys').doc(normalizedAliasKey), {
      normalizedName,
      normalizedAliasKey,
      playerId: player.playerId || player.id || playerSnapshot.id,
      active: true,
      source: 'migration',
      schemaVersion: 1,
      createdAtMs: Date.now(),
    }, { merge: true }));
  });
  operations.push((batch) => batch.set(accountRef.collection('schema_migrations').doc('20260801_baba_import_v1'), {
    id: '20260801_baba_import_v1',
    status: 'applied',
    playersProcessed: snapshot.size,
    appliedAtMs: Date.now(),
  }, { merge: true }));
  await commitChunks(operations);
  console.log(`Migration aplicada: ${snapshot.size} jogadores analisados.`);
}

async function migrateDown() {
  const [players, keys] = await Promise.all([
    accountRef.collection('players').get(),
    accountRef.collection('player_name_keys').where('source', '==', 'migration').get(),
  ]);
  const operations = [];
  players.docs.forEach((snapshot) => operations.push((batch) => batch.update(snapshot.ref, {
    normalizedName: FieldValue.delete(),
    normalizedAliasKey: FieldValue.delete(),
  })));
  keys.docs.forEach((snapshot) => operations.push((batch) => batch.delete(snapshot.ref)));
  operations.push((batch) => batch.set(accountRef.collection('schema_migrations').doc('20260801_baba_import_v1'), {
    status: 'reverted',
    revertedAtMs: Date.now(),
  }, { merge: true }));
  await commitChunks(operations);
  console.log(`Migration revertida: ${players.size} jogadores e ${keys.size} chaves processados.`);
}

if (down) await migrateDown();
else await migrateUp();
