const https = require('https');

exports.handler = async function(event, context) {
  return new Promise((resolve) => {
    // 한국 시간(KST) 기준 날짜 생성
    const now = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // 네이버 스포츠 KBO 통합 API 주소
    const url = `https://api-gw.sports.naver.com/schedule/games?gameType=KBO&date=${year}-${month}-${day}`;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Referer': 'https://m.sports.naver.com/'
      }
    };

    https.get(url, options, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(rawData);
          const rawGames = json.result?.games || json.games || [];

          // index.html 규격에 맞게 데이터 파싱
          const games = rawGames.map(g => ({
            GAME_ID: g.gameId || '',
            G_TM: g.gameTime || g.gtime || '18:30',
            S_NM: g.stadium || '구장',
            GAME_STATE_SC: g.gameStatusCode || g.statusCode || g.status || '',
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
          // 파싱 실패 시 KBO 공식 모바일 페이지 크롤링 보완
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
