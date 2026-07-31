(function registerManualScoreSheetTemplate(root, factory) {
  const template = factory();
  if (typeof module === 'object' && module.exports) module.exports = template;
  if (root) root.BabaManualTemplate = template;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const sourceWidth = 1489;
  const sourceHeight = 2105;
  const resultColumns = {
    vitorias: [223, 253, 284, 314, 345, 375, 406, 436],
    empates: [655, 686, 716, 747, 777, 808, 838, 869],
    derrotas: [1073, 1103, 1134, 1164, 1195, 1225, 1256, 1286],
  };
  const resultRows = [446, 856, 1266, 1675];
  const playerRows = [
    [526, 569, 613, 656, 700],
    [936, 980, 1023, 1067, 1110],
    [1345, 1389, 1432, 1476, 1519],
    [1755, 1799, 1842, 1886, 1929],
  ];
  const goalColumns = [885, 928, 971, 1014, 1057, 1100, 1143, 1186, 1229, 1272];
  const teamDefinitions = [
    { id: 'team_1', nome: 'Time 1', cor: 'Vermelho', accent: '#ef312a' },
    { id: 'team_2', nome: 'Time 2', cor: 'Verde', accent: '#169c5a' },
    { id: 'team_3', nome: 'Time 3', cor: 'Caqui', accent: '#bea47a' },
    { id: 'team_4', nome: 'Time 4', cor: 'Preto', accent: '#181b22' },
  ];

  const makeBox = (x, y, size, meta) => ({ x, y, width: size, height: size, ...meta });
  const teams = teamDefinitions.map((definition, teamIndex) => {
    const results = Object.fromEntries(Object.entries(resultColumns).map(([key, xs]) => [
      key,
      xs.map((x, boxIndex) => makeBox(x, resultRows[teamIndex], 22, {
        kind: 'result',
        teamIndex,
        field: key,
        boxIndex,
      })),
    ]));
    const jogadores = playerRows[teamIndex].map((y, playerIndex) => ({
      slot: playerIndex < 4 ? `Jogador ${playerIndex + 1}` : 'Goleiro',
      tipo: playerIndex === 4 ? 'goleiro' : 'jogador',
      nameRegion: {
        x: 245,
        y: y - 19,
        width: 580,
        height: 52,
        teamIndex,
        playerIndex,
      },
      goals: goalColumns.map((x, boxIndex) => makeBox(x, y, 25, {
        kind: 'goal',
        teamIndex,
        playerIndex,
        boxIndex,
      })),
    }));
    return { ...definition, teamIndex, results, jogadores };
  });

  return Object.freeze({
    id: 'futsal-a4-anotacoes-v1',
    version: 1,
    title: 'Ficha de Controle - Futsal',
    sourceWidth,
    sourceHeight,
    canonicalWidth: 1240,
    canonicalHeight: 1754,
    acceptedTypes: Object.freeze([
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]),
    headerRegions: Object.freeze({
      data: { x: 184, y: 245, width: 270, height: 46 },
      local: { x: 674, y: 245, width: 325, height: 46 },
      responsavel: { x: 1182, y: 245, width: 218, height: 46 },
    }),
    teams: Object.freeze(teams),
    allBoxes: Object.freeze(teams.flatMap((team) => [
      ...team.results.vitorias,
      ...team.results.empates,
      ...team.results.derrotas,
      ...team.jogadores.flatMap((player) => player.goals),
    ])),
  });
});
