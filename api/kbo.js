const https = require('https');

function fetchJson(url) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    https.get(url, options, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(rawData)); } catch (e) { resolve(null); }
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

  // 1. 경기 일정 및 스코어
  const scheduleUrl = `https://sports.news.naver.com/kgame/scheduleList.nhn?category=kbo&date=${dateStr}`;
  // 2. 팀 순위 데이터
  const rankUrl = `https://sports.news.naver.com/kbo/record/index?category=kbo&year=${year}`;

  const [scheduleData] = await Promise.all([
    fetchJson(scheduleUrl)
  ]);

  const rawGames = scheduleData?.gameScheduleList || [];
  const games = rawGames.map(g => ({
    GAME_ID: g.gameId || '',
    G_TM: g.gtime || '18:30',
    S_NM: g.stadium || '구장',
    GAME_STATE_SC: g.gameStatusCode || g.statusCode || '',
    CANCEL_SC_ID: g.cancel || false,
    AWAY_NM: g.awayTeamName || g.aName || '원정',
    HOME_NM: g.homeTeamName || g.hName || '홈',
    T_SCORE_CN: g.awayTeamScore ?? g.aScore ?? '-',
    B_SCORE_CN: g.homeTeamScore ?? g.hScore ?? '-',
    GAME_INN_NO: g.currentInning || '',
    GAME_TB_SC_NM: g.inningStatus || '',
    T_P_NM: g.aStarter || '-',
    B_P_NM: g.hStarter || '-',
    T_PIT_P_NM: g.aPitcher || '-',
    B_PIT_P_NM: g.hPitcher || '-',
    BALL_CN: g.b || '-',
    STRIKE_CN: g.s || '-',
    OUT_CN: g.o || '-'
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
