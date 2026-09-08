const https = require('https');

function fetchJson(url) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        'Referer': 'https://m.sports.naver.com/'
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
  const dateStr = `${year}${month}${day}`;

  const url = `https://api-gw.sports.naver.com/schedule/games?gameType=KBO&date=${year}-${month}-${day}`;
  const json = await fetchJson(url);

  const rawGames = json?.result?.games || json?.games || [];

  // KBO 리그 정규/시범/포스트시즌 경기만 엄격히 필터링
  const kboGames = rawGames.filter(g => {
    const category = (g.categoryName || g.leagueName || 'KBO').toUpperCase();
    return category.includes('KBO') || category.includes('한국야구');
  });

  const games = kboGames.map(g => ({
    GAME_ID: g.gameId || '',
    G_TM: g.gameTime || '18:30',
    S_NM: g.stadium || '구장 미정',
    GAME_STATE_SC: g.gameStatusCode || g.status || 'SCHEDULED',
    CANCEL_SC_ID: g.cancel || false,
    AWAY_NM: g.awayTeamName || g.awayTeam?.name || '원정',
    HOME_NM: g.homeTeamName || g.homeTeam?.name || '홈',
    T_SCORE_CN: g.awayTeamScore ?? g.awayTeam?.score ?? '-',
    B_SCORE_CN: g.homeTeamScore ?? g.homeTeam?.score ?? '-',
    GAME_INN_NO: g.currentInning || '',
    GAME_TB_SC_NM: g.inningStatus || '',
    T_P_NM: g.awayStarter || g.awayTeam?.starter || '-',
    B_P_NM: g.homeStarter || g.homeTeam?.starter || '-',
    T_PIT_P_NM: g.awayPitcher || '-',
    B_PIT_P_NM: g.homePitcher || '-',
    BALL_CN: g.b || 0,
    STRIKE_CN: g.s || 0,
    OUT_CN: g.o || 0,
    // 상세 페이지용 이닝별 스코어 배열
    INNINGS: g.scores || [
      { inn: 1, a: 0, h: 0 }, { inn: 2, a: 0, h: 0 }, { inn: 3, a: 0, h: 0 },
      { inn: 4, a: 0, h: 0 }, { inn: 5, a: 0, h: 0 }, { inn: 6, a: 0, h: 0 },
      { inn: 7, a: 0, h: 0 }, { inn: 8, a: 0, h: 0 }, { inn: 9, a: 0, h: 0 }
    ]
  }));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      d: games,
      date: `${year}.${month}.${day}`
    })
  };
};
