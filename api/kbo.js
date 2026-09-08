const https = require('https');

function fetchJson(url) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        'Referer': 'https://m.sports.naver.com/kbaseball/index'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

exports.handler = async function(event, context) {
  const now = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');

  // 1. 경기 라이브 일정 API
  const gameUrl = `https://api-gw.sports.naver.com/schedule/games?gameType=KBO&date=${year}-${month}-${day}`;
  // 2. 팀 순위 API
  const rankUrl = `https://api-gw.sports.naver.com/record/kbo/team?season=${year}`;
  // 3. 개인 기록 순위 API (타자/투수)
  const hitterUrl = `https://api-gw.sports.naver.com/record/kbo/individual/hitter?season=${year}&sort=AVG`;
  const pitcherUrl = `https://api-gw.sports.naver.com/record/kbo/individual/pitcher?season=${year}&sort=ERA`;

  const [gameRes, rankRes, hitterRes, pitcherRes] = await Promise.all([
    fetchJson(gameUrl),
    fetchJson(rankUrl),
    fetchJson(hitterUrl),
    fetchJson(pitcherUrl)
  ]);

  const rawGames = gameRes?.result?.games || gameRes?.games || [];

  const games = rawGames.map(g => {
    const away = g.awayTeam || {};
    const home = g.homeTeam || {};
    const detail = g.baseballMatchDetails || {};

    return {
      GAME_ID: g.gameId || '',
      G_TM: g.gameTime || '18:30',
      S_NM: g.stadium || '구장',
      GAME_STATE_SC: g.status || g.gameStatusCode || 'SCHEDULED',
      AWAY_NM: away.name || g.awayTeamName || '원정',
      HOME_NM: home.name || g.homeTeamName || '홈',
      T_SCORE_CN: away.score ?? '-',
      B_SCORE_CN: home.score ?? '-',
      GAME_INN_NO: detail.currentInning ? `${detail.currentInning}회` : (g.currentInning ? `${g.currentInning}회` : ''),
      GAME_TB_SC_NM: detail.inningStatus || g.inningStatus || '',
      PITCHER: {
        name: detail.currentPitcher?.name || away.starter || home.starter || '-',
        record: detail.currentPitcher?.stat || '투수 정보'
      },
      BATTER: {
        name: detail.currentBatter?.name || '-',
        record: detail.currentBatter?.stat || '타자 정보'
      },
      RUNNERS: {
        base1: !!(detail.runners && detail.runners.base1),
        base2: !!(detail.runners && detail.runners.base2),
        base3: !!(detail.runners && detail.runners.base3)
      },
      BALL_CN: detail.balls ?? 0,
      STRIKE_CN: detail.strikes ?? 0,
      OUT_CN: detail.outs ?? 0
    };
  });

  // 팀 순위 파싱
  const teams = (rankRes?.result?.teamRecords || rankRes?.records || []).map((t, i) => ({
    rank: t.rank || i + 1,
    team: t.teamName || t.name || '-',
    games: t.gameCount || t.games || 0,
    win: t.win || 0,
    loss: t.loss || 0,
    draw: t.draw || 0,
    pct: t.wra || t.winRate || '0.000',
    diff: t.gameBehind || '0.0'
  }));

  // 개인 순위 파싱 (타자 / 투수)
  const hitters = (hitterRes?.result?.hitterRecords || hitterRes?.records || []).slice(0, 10).map((h, i) => ({
    rank: i + 1,
    name: h.playerName || h.name || '-',
    team: h.teamName || h.team || '-',
    avg: h.wra || h.avg || '0.000',
    hits: h.hit || 0,
    hr: h.hr || 0
  }));

  const pitchers = (pitcherRes?.result?.pitcherRecords || pitcherRes?.records || []).slice(0, 10).map((p, i) => ({
    rank: i + 1,
    name: p.playerName || p.name || '-',
    team: p.teamName || p.team || '-',
    era: p.era || '0.00',
    win: p.win || 0,
    SO: p.kk || p.so || 0
  }));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      d: games,
      teams: teams,
      players: { hitters, pitchers },
      date: `${year}.${month}.${day}`
    })
  };
};
