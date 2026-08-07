(() => {
  'use strict';

  const CONFIG = Object.freeze({
    earlyBabaLimit: 10,
    playerWeight: 0.7,
    averageWeight: 0.3,
    matureMinimumGames: 10,
    thresholds: Object.freeze([0.8, 1, 1.25, 1.5, 1.8]),
  });

  const LEVELS = Object.freeze([
    Object.freeze({ stars: 0, title: 'Sem estrela', tone: 'none' }),
    Object.freeze({ stars: 1, title: 'Iniciante', tone: 'gray' }),
    Object.freeze({ stars: 2, title: 'Promessa', tone: 'bronze' }),
    Object.freeze({ stars: 3, title: 'Destaque', tone: 'silver' }),
    Object.freeze({ stars: 4, title: 'Craque', tone: 'gold' }),
    Object.freeze({ stars: 5, title: 'Lenda do Baba', tone: 'diamond' }),
  ]);

  const number = (value) => Math.max(0, Number(value) || 0);
  const field = (stats, ...keys) => {
    for (const key of keys) {
      if (stats?.[key] !== undefined && stats?.[key] !== null) return number(stats[key]);
    }
    return 0;
  };

  function playerMetrics(stats = {}) {
    return {
      wins: field(stats, 'totalVitorias', 'vitorias', 'wins'),
      draws: field(stats, 'totalEmpates', 'empates', 'draws'),
      losses: field(stats, 'totalDerrotas', 'derrotas', 'losses'),
      goals: field(stats, 'totalGols', 'gols', 'goals'),
      mvps: field(stats, 'totalMvps', 'mvps', 'mvp'),
      yellowCards: field(stats, 'totalCartoesAmarelos', 'cartoesAmarelos', 'yellowCards'),
      redCards: field(stats, 'totalCartoesVermelhos', 'cartoesVermelhos', 'redCards'),
      games: field(stats, 'totalJogos', 'jogos', 'games'),
      appearances: field(stats, 'totalBabas', 'babas', 'appearances'),
      efficiency: field(stats, 'aproveitamento', 'efficiency'),
    };
  }

  function goalkeeperMetrics(stats = {}) {
    return {
      wins: field(stats, 'vitorias', 'totalVitorias', 'wins'),
      draws: field(stats, 'empates', 'totalEmpates', 'draws'),
      losses: field(stats, 'derrotas', 'totalDerrotas', 'losses'),
      games: field(stats, 'jogos', 'goalkeeperGames', 'totalJogos', 'games'),
      appearances: field(stats, 'totalBabas', 'babas', 'appearances'),
      goalsConceded: field(stats, 'golsSofridos', 'goalsConceded'),
    };
  }

  function playerScore(stats = {}) {
    const metrics = playerMetrics(stats);
    return Math.max(0,
      (metrics.wins * 6)
      + (metrics.draws * 2)
      + (metrics.goals * 3)
      + (metrics.mvps * 5)
      - metrics.yellowCards
      - (metrics.redCards * 3));
  }

  function goalkeeperScore(stats = {}) {
    const metrics = goalkeeperMetrics(stats);
    // Goleiros recebem bonus por jogos sem derrota. Vitoria continua sendo o
    // principal desempate, enquanto uma derrota nunca gera pontos.
    const unbeatenGames = Math.max(0, metrics.games - metrics.losses);
    return Math.max(0, (metrics.wins * 6) + (metrics.draws * 2) + (unbeatenGames * 2));
  }

  function minimumGames(completedBabas = 0) {
    const babas = number(completedBabas);
    if (babas >= CONFIG.earlyBabaLimit) return CONFIG.matureMinimumGames;
    return Math.max(1, Math.min(5, Math.ceil(babas / 2)));
  }

  function levelFromRatio(ratio) {
    if (!Number.isFinite(ratio) || ratio < CONFIG.thresholds[0]) return LEVELS[0];
    if (ratio < CONFIG.thresholds[1]) return LEVELS[1];
    if (ratio < CONFIG.thresholds[2]) return LEVELS[2];
    if (ratio < CONFIG.thresholds[3]) return LEVELS[3];
    if (ratio < CONFIG.thresholds[4]) return LEVELS[4];
    return LEVELS[5];
  }

  function progressForRatio(ratio, stars) {
    if (stars >= 5) return 100;
    const lower = stars === 0 ? 0 : CONFIG.thresholds[stars - 1];
    const upper = CONFIG.thresholds[stars];
    if (!Number.isFinite(ratio) || upper <= lower) return 0;
    return Math.max(0, Math.min(99, Math.round(((ratio - lower) / (upper - lower)) * 100)));
  }

  function averages(items, goalkeeper = false) {
    if (!items.length) return {
      score: 0, wins: 0, goals: 0, games: 0, mvps: 0, efficiency: 0, losses: 0,
    };
    const metrics = items.map((item) => (goalkeeper ? goalkeeperMetrics(item) : playerMetrics(item)));
    const average = (key) => Number((metrics.reduce((sum, item) => sum + number(item[key]), 0) / metrics.length).toFixed(2));
    const score = items.reduce((sum, item) => sum + (goalkeeper ? goalkeeperScore(item) : playerScore(item)), 0) / items.length;
    return {
      score: Number(score.toFixed(2)),
      wins: average('wins'),
      goals: goalkeeper ? 0 : average('goals'),
      games: average('games'),
      mvps: goalkeeper ? 0 : average('mvps'),
      efficiency: goalkeeper ? 0 : average('efficiency'),
      losses: average('losses'),
    };
  }

  function calculateRatings(sourceItems = [], options = {}) {
    const items = sourceItems.filter(Boolean);
    const goalkeeper = Boolean(options.goalkeeper);
    const completedBabas = number(options.completedBabas);
    const scoreOf = goalkeeper ? goalkeeperScore : playerScore;
    const metricsOf = goalkeeper ? goalkeeperMetrics : playerMetrics;
    const groupAverages = averages(items, goalkeeper);
    const requiredGames = minimumGames(completedBabas);
    const earlyDatabase = completedBabas < CONFIG.earlyBabaLimit;

    return items.map((stats) => {
      const rawScore = scoreOf(stats);
      const adjustedScore = earlyDatabase
        ? ((rawScore * CONFIG.playerWeight) + (groupAverages.score * CONFIG.averageWeight))
        : rawScore;
      const ratio = groupAverages.score > 0 ? adjustedScore / groupAverages.score : 0;
      const metrics = metricsOf(stats);
      const eligible = metrics.games >= requiredGames && groupAverages.score > 0;
      const level = eligible ? levelFromRatio(ratio) : LEVELS[0];
      const progress = eligible ? progressForRatio(ratio, level.stars) : 0;
      const displayStars = eligible
        ? Math.min(5, level.stars + (level.stars < 5 && progress >= 50 ? 0.5 : 0))
        : 0;
      const displayLevel = LEVELS[Math.ceil(displayStars)] || level;
      return {
        ...stats,
        performance: {
          stars: level.stars,
          displayStars,
          title: level.title,
          tone: level.tone,
          displayTone: displayLevel.tone,
          score: Number(rawScore.toFixed(2)),
          adjustedScore: Number(adjustedScore.toFixed(2)),
          ratio: Number(ratio.toFixed(3)),
          progress,
          nextStars: Math.min(5, level.stars + 1),
          eligible,
          minimumGames: requiredGames,
          missingGames: Math.max(0, requiredGames - metrics.games),
          completedBabas,
          goalkeeper,
          averages: groupAverages,
          metrics,
        },
      };
    });
  }

  function mapRatings(items = [], options = {}) {
    return new Map(calculateRatings(items, options).map((item) => [
      item.jogadorId || item.playerId || item.id,
      item.performance,
    ]));
  }

  const api = Object.freeze({
    CONFIG,
    LEVELS,
    playerMetrics,
    goalkeeperMetrics,
    playerScore,
    goalkeeperScore,
    minimumGames,
    levelFromRatio,
    calculateRatings,
    mapRatings,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.BabaPerformanceStars = api;
})();
