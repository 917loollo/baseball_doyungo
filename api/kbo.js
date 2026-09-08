const https = require('https');

function fetchJson(url) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*'
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

  // KBO 공식 데이터 서비스 모바일 API
  const kboDataUrl = `https://m.koreabaseball.com/ws/Main.asmx/GetScheduleList?leId=1&srId=0,1,3,4,5,7,8,9&date=${year}${month}${day}`;
  const json = await fetchJson(kboDataUrl);

  const rawList = json?.rows || json?.data || [];

  const games = rawList.map(g => {
    const awayName = g.AWAY_NM || g.awayTeamName || '원정';
    const homeName = g.HOME_NM || g.homeTeamName || '홈';
    const awayScore = g.T_SCORE_CN ?? g.awayScore ?? '-';
    const homeScore = g.B_SCORE_CN ?? g.homeScore ?? '-';

    return {
      GAME_ID: g.GAME_ID || '',
      G_TM: g.G_TM || '18:30',
      S_NM: g.S_NM || '구장',
      GAME_STATE_SC: g.GAME_STATE_SC || 'SCHEDULED',
      AWAY_NM: awayName,
      HOME_NM: homeName,
      T_SCORE_CN: awayScore,
      B_SCORE_CN: homeScore,
      GAME_INN_NO: g.GAME_INN_NO ? `${g.GAME_INN_NO}회` : '',
      GAME_TB_SC_NM: g.GAME_TB_SC_NM || '',
      PITCHER: { name: g.T_P_NM || g.awayPitcher || '-', record: '투수 기록' },
      BATTER: { name: g.B_P_NM || g.homeBatter || '-', record: '타자 기록' },
      RUNNERS: {
        base1: g.B1_BAT_ORDER_NO ? true : false,
        base2: g.B2_BAT_ORDER_NO ? true : false,
        base3: g.B3_BAT_ORDER_NO ? true : false
      },
      BALL_CN: g.BALL_CN || 0,
      STRIKE_CN: g.STRIKE_CN || 0,
      OUT_CN: g.OUT_CN || 0
    };
  });

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
