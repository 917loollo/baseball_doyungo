const https = require('https');

function fetchJson(url) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
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

  const url = `https://api-gw.sports.naver.com/schedule/games?gameType=KBO&date=${year}-${month}-${day}`;
  const json = await fetchJson(url);

  const rawGames = json?.result?.games || json?.games || [];

  // 순수 KBO 1군 리그 경기만 엄격하게 추출
  const kboGames = rawGames.filter(g => {
    const category = (g.categoryName || g.leagueName || g.gameType || '').toUpperCase();
    const title = (g.title || '').toUpperCase();
    
    // MLB, NPB, 해외야구 등 타 리그 명시 항목 완벽 제외
    if (category.includes('MLB') || category.includes('NPB') || category.includes('WBC')) return false;
    
    // KBO 관련 키워드가 있거나 기본 KBO 연동 데이터만 통과
    return category.includes('KBO') || category.includes('한국야구') || category === '' || title.includes('KBO');
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
    GAME_INN_NO: g.currentInning || g.inning || '',
    GAME_TB_SC_NM: g.inningStatus || '',
    T_P_NM: g.awayStarter || g.awayTeam?.starter || '-',
    B_P_NM: g.homeStarter || g.homeTeam?.starter || '-',
    T_PIT_P_NM: g.awayPitcher || '-',
    B_PIT_P_NM: g.homePitcher || '-',
    BALL_CN: g.b || 0,
    STRIKE_CN: g.s || 0,
    OUT_CN: g.o || 0
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
