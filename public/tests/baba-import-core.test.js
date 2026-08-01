const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../baba-import-core.js');

const REAL_REPORT = `BABA — 31 DE JULHO DE 2026

ARTILHEIROS

1º Juninho — Time 3 — 5 gols — Convidado
2º Erik — Time 2 — 3 gols
3º Ró — Time 1 — 2 gols
4º Rodrigol — Time 3 — 2 gols
5º Negão — Time 3 — 2 gols
6º Buga — Time 1 — 1 gol
7º Budega — Time 1 — 1 gol
8º Felipe — Time 2 — 1 gol
9º Bodão — Time 2 — 1 gol
10º Buiu — Time 3 — 1 gol

Total de gols registrados: 19
Artilheiro: Juninho — 5 gols
Destaque do Time 2: Erik — 3 gols

Sem gols registrados:
Nilton, Duda, Jeff (goleiro), Allison (goleiro) e Wesley (Convidado / goleiro).

CLASSIFICAÇÃO DOS TIMES

1º TIME 3 — COLETE CAQUI
Vitórias: 5
Empates: 0
Derrotas: 2
Pontos: 15
Gols marcados: 10

Jogadores:

* Rodrigol
* Negão
* Buiu
* Juninho (Convidado)
* Wesley (Convidado / goleiro)

2º TIME 1 — COLETE VERMELHO
Vitórias: 3
Empates: 0
Derrotas: 4
Pontos: 9
Gols marcados: 4

Jogadores:

* Buga
* Nilton
* Ró
* Budega
* Jeff (goleiro)

3º TIME 2 — COLETE VERDE
Vitórias: 2
Empates: 0
Derrotas: 4
Pontos: 6
Gols marcados: 5

Jogadores:

* Duda
* Felipe
* Bodão
* Erik
* Allison (goleiro)

4º TIME 4 — COLETE PRETO
Vitórias: 0
Empates: 0
Derrotas: 0
Pontos: 0
Gols marcados: 0

Jogadores:

* Sem jogadores registrados

Regra de pontuação:
Vitória = 3 pontos
Empate = 1 ponto`;

const players = [
  { id: 'ro', nome: 'Ró', ativo: true },
  { id: 'erik', nome: 'Erik', ativo: true },
  { id: 'eric', nome: 'Eric', ativo: true },
  { id: 'rodrigo', nome: 'Rodrigo', ativo: true },
];

test('normaliza igualdade exata, caixa, acentos e espaços', () => {
  assert.equal(core.normalizeName('  RÓ  '), 'ro');
  assert.equal(core.matchPlayerName('Ró', players).status, 'automatic');
  assert.equal(core.matchPlayerName('RO', players).suggestedPlayerId, 'ro');
  assert.equal(core.matchPlayerName(' Rô  ', players).suggestedPlayerId, 'ro');
  assert.ok(core.matchPlayerName(' Rô  ', players).confidence >= .92);
});

test('usa erro simples de digitação como sugestão sem forçar baixa confiança', () => {
  const result = core.matchPlayerName('Rodrigou', players);
  assert.equal(result.suggestedPlayerId, 'rodrigo');
  assert.ok(result.confidence >= .80);
});

test('alias confirmado tem prioridade sobre fuzzy matching', () => {
  const aliases = [{ id: 'a1', originalText: 'Hurik', normalizedText: 'hurik', playerId: 'erik', active: true }];
  const result = core.matchPlayerName('Hurik', players, aliases);
  assert.equal(result.suggestedPlayerId, 'erik');
  assert.equal(result.candidates[0].source, 'alias');
  assert.ok(result.confidence >= .99);
});

test('dois jogadores parecidos nunca são escolhidos automaticamente', () => {
  const result = core.matchPlayerName('Eri', players);
  assert.equal(result.ambiguous, true);
  assert.notEqual(result.status, 'automatic');
});

test('jogador realmente novo fica pendente para cadastro como novato', () => {
  const result = core.matchPlayerName('Wesley', players);
  assert.equal(result.status, 'new');
  assert.equal(result.suggestedPlayerId, null);
});

test('interpreta o caso real de 31/07/2026 com dados estruturados', () => {
  const parsed = core.parseReport(REAL_REPORT);
  assert.equal(parsed.date, '2026-07-31');
  assert.equal(parsed.totalGoalsInformed, 19);
  assert.equal(parsed.scorers.length, 10);
  assert.equal(parsed.teams.length, 3);
  assert.equal(parsed.ignoredTeams.length, 1);
  assert.equal(parsed.ignoredTeams[0].name, 'Time 4');
  assert.deepEqual(parsed.teams.map((team) => [team.name, team.calculatedPoints]), [
    ['Time 3', undefined], ['Time 1', undefined], ['Time 2', undefined],
  ]);
  const warnings = core.validateStructuredReport(parsed);
  assert.equal(parsed.calculatedTotalGoals, 19);
  assert.equal(warnings.filter((warning) => warning.severity === 'blocker').length, 0);
  assert.ok(warnings.some((warning) => warning.code === 'IGNORED_EMPTY_TEAM'));
  const team3 = parsed.teams.find((team) => team.id === 'team_3');
  const team1 = parsed.teams.find((team) => team.id === 'team_1');
  const team2 = parsed.teams.find((team) => team.id === 'team_2');
  assert.equal(team3.calculatedPoints, 15);
  assert.equal(team3.calculatedGoals, 10);
  assert.equal(team1.calculatedPoints, 9);
  assert.equal(team1.calculatedGoals, 4);
  assert.equal(team2.calculatedPoints, 6);
  assert.equal(team2.calculatedGoals, 5);
  const people = core.collectPeople(parsed);
  assert.equal(people.find((person) => person.typedName === 'Wesley').roles.guest, true);
  assert.equal(people.find((person) => person.typedName === 'Wesley').roles.goalkeeper, true);
  assert.equal(people.find((person) => person.typedName === 'Jeff').goals, 0);
  assert.equal(people.find((person) => person.typedName === 'Allison').roles.goalkeeper, true);
});

test('calcula pontos e acusa divergência sem alterar o valor informado', () => {
  const parsed = core.parseReport(REAL_REPORT.replace('Pontos: 15', 'Pontos: 14'));
  const warning = core.validateStructuredReport(parsed).find((item) => item.code === 'POINTS_DIVERGENCE');
  assert.ok(warning);
  assert.equal(warning.details.informed, 14);
  assert.equal(warning.details.calculated, 15);
  assert.equal(parsed.teams[0].pointsInformed, 14);
});

test('detecta divergência na soma dos gols', () => {
  const parsed = core.parseReport(REAL_REPORT.replace('Total de gols registrados: 19', 'Total de gols registrados: 20'));
  const warnings = core.validateStructuredReport(parsed);
  assert.ok(warnings.some((item) => item.code === 'TOTAL_GOALS_DIVERGENCE'));
  assert.ok(warnings.some((item) => item.code === 'TEAM_TOTAL_DIVERGENCE'));
});

test('aceita texto irregular de WhatsApp, singular de gol, caixa e data numérica', () => {
  const parsed = core.parseReport(`baba 31/07/2026\nartilheiros\n- João — TIME 1 — 1 gol\nTOTAL DE GOLS REGISTRADOS: 1\nCLASSIFICAÇÃO DOS TIMES\nTIME 1 — COLETE azul\nVitórias 1\nEmpates 0\nDerrotas 0\nPontos 3\nGols marcados 1\nJogadores:\n- João`);
  assert.equal(parsed.date, '2026-07-31');
  assert.equal(parsed.scorers[0].goals, 1);
  assert.equal(parsed.teams[0].vestColor.toLowerCase(), 'azul');
  assert.equal(core.validateStructuredReport(parsed).filter((item) => item.severity === 'blocker').length, 0);
});

test('valida data por extenso e rejeita data impossível', () => {
  assert.equal(core.parseDate('Baba — 31 de julho de 2026'), '2026-07-31');
  assert.equal(core.parseDate('31/02/2026'), null);
});

test('sanitiza controles e tags executáveis sem executar conteúdo', () => {
  const result = core.sanitizeImportedText('Baba\u0000 <script>alert(1)</script> 31/07/2026');
  assert.equal(result.includes('\u0000'), false);
  assert.equal(result.includes('<script>'), false);
});

test('salvamento automático exige alta confiança e nenhuma inconsistência', () => {
  const report = `BABA 31/07/2026\nARTILHEIROS\nRó — Time 1 — 1 gol\nTotal de gols registrados: 1\nCLASSIFICAÇÃO DOS TIMES\nTIME 1 — COLETE AZUL\nVitórias: 1\nEmpates: 0\nDerrotas: 0\nPontos: 3\nGols marcados: 1\nJogadores:\n- Ró`;
  const analysis = core.buildAnalysis(report, [{ id: 'ro', nome: 'Ró', ativo: true }]);
  assert.equal(core.isHighConfidenceAnalysis(analysis), true);
  analysis.warnings.push({ severity: 'blocker' });
  assert.equal(core.isHighConfidenceAnalysis(analysis), false);
});

test('novato, convidado e goleiro permanecem classificações independentes', () => {
  assert.deepEqual(core.roleLabels({ novice: true, guest: true, goalkeeper: true }), ['CONVIDADO', 'GOLEIRO', 'NOVATO']);
  const roles = core.parseRoles('Novato / Convidado / goleiro');
  assert.deepEqual(roles, { guest: true, goalkeeper: true, novice: true });
});

test('jogador sem gols recebe zero e continua presente no elenco', () => {
  const parsed = core.parseReport(REAL_REPORT);
  const people = core.collectPeople(parsed);
  assert.equal(people.find((person) => person.typedName === 'Nilton').goals, 0);
  assert.equal(parsed.teams.find((team) => team.id === 'team_1').players.some((person) => person.name === 'Nilton'), true);
});

test('time sem jogadores e sem participação é ignorado na criação do baba', () => {
  const parsed = core.parseReport(`BABA 31/07/2026\nCLASSIFICAÇÃO DOS TIMES\nTIME 1 — COLETE AZUL\nVitórias: 0\nEmpates: 0\nDerrotas: 0\nPontos: 0\nGols marcados: 0\nJogadores:`);
  assert.equal(parsed.teams.length, 0);
  assert.equal(parsed.ignoredTeams.length, 1);
  assert.ok(core.validateStructuredReport(parsed).some((warning) => warning.code === 'IGNORED_EMPTY_TEAM'));
});

test('jogador em dois times é inconsistência impeditiva', () => {
  const parsed = core.parseReport(`BABA 31/07/2026\nCLASSIFICAÇÃO DOS TIMES\nTIME 1 — COLETE AZUL\nVitórias: 0\nEmpates: 0\nDerrotas: 0\nPontos: 0\nGols marcados: 0\nJogadores:\n- João\nTIME 2 — COLETE VERDE\nVitórias: 0\nEmpates: 0\nDerrotas: 0\nPontos: 0\nGols marcados: 0\nJogadores:\n- João`);
  assert.ok(core.validateStructuredReport(parsed).some((warning) => warning.code === 'PLAYER_IN_MULTIPLE_TEAMS' && warning.severity === 'blocker'));
});

test('artilheiro ausente do elenco bloqueia a importação', () => {
  const parsed = core.parseReport(`BABA 31/07/2026\nARTILHEIROS\nJoão — Time 1 — 1 gol\nTotal de gols registrados: 1\nCLASSIFICAÇÃO DOS TIMES\nTIME 1 — COLETE AZUL\nVitórias: 1\nEmpates: 0\nDerrotas: 0\nPontos: 3\nGols marcados: 1\nJogadores:\n- Pedro`);
  assert.ok(core.validateStructuredReport(parsed).some((warning) => warning.code === 'SCORER_NOT_IN_ROSTER'));
});

test('falha de identidade não permite resolução automática nem duplicação silenciosa', () => {
  const people = [{ typedName: 'Novo Nome', match: { status: 'new', confidence: 0 }, resolution: null }];
  assert.ok(core.validateResolutions(people).some((warning) => warning.code === 'PLAYER_REVIEW_REQUIRED'));
  people[0].resolution = { type: 'new', officialName: 'Novo Nome', confirmedManually: true };
  assert.equal(core.validateResolutions(people).length, 0);
});

test('estado local só é aplicado depois do commit transacional bem-sucedido', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'baba-import-ui.js'), 'utf8');
  const commitIndex = source.indexOf('await repository().commitImport');
  const localApplyIndex = source.indexOf('host().applyCommittedImport', commitIndex);
  assert.ok(commitIndex > 0);
  assert.ok(localApplyIndex > commitIndex);
});

test('reversão marca associações e estatísticas sem apagar dados compartilhados indiscriminadamente', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'baba-import-persistence.js'), 'utf8');
  assert.match(source, /removablePlayerIds/);
  assert.match(source, /participants.*deleted: true/s);
  assert.match(source, /mergeAggregateStats\([^\n]+-1\)/);
  assert.doesNotMatch(source, /transaction\.delete\(doc\(db, 'baba_players'/);
});

test('arquitetura grava em transação, protege permissões e desenha etiquetas no PDF', () => {
  const root = path.join(__dirname, '..');
  const persistence = fs.readFileSync(path.join(root, 'baba-import-persistence.js'), 'utf8');
  const rules = fs.readFileSync(path.join(root, '..', 'firestore.rules'), 'utf8');
  const pdf = fs.readFileSync(path.join(root, 'pdf-report.js'), 'utf8');
  assert.match(persistence, /runTransaction\(db/);
  assert.match(persistence, /await repository\(\)\.commitImport|commitImport/);
  assert.match(rules, /function isImportAdmin\(\)/);
  assert.match(rules, /match \/baba_player_aliases/);
  assert.match(pdf, /drawPaymentClassificationBadges/);
  assert.match(pdf, /NOVATO/);
  assert.match(pdf, /CONVIDADO/);
  assert.match(pdf, /GOLEIRO/);
});
