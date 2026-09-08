const https = require('https');

exports.handler = async function(event, context) {
  return new Promise((resolve) => {
    // 한국 시간(KST) 기준 YYYYMMDD 날짜 생성
    const now = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const url = `https://sports.news.naver.com/kgame/scheduleList.nhn?category=kbo&date=${dateStr}`;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    https.get(url, options, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(rawData);
          const rawGames = json.gameScheduleList || [];

          // index.html에서 사용하는 필드명 구조로 정제
          const games = rawGames.map(g => ({
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

          resolve({
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              d: games,
              date: `${year}.${month}.${day}`
            })
          });
        } catch (e) {
          resolve({
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ d: [], date: `${year}.${month}.${day}` })
          });
        }
      });
    }).on('error', () => {
      resolve({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ d: [], date: `${year}.${month}.${day}` })
      });
    });
  });
};
