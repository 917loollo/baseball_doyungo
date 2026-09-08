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

  const games = rawGames.map(g => {
    // 팀명 파싱 (객체 형태 또는 문자열 형태 모두 대응)
    const awayName = g.awayTeam?.name || g.awayTeamName || g.aName || '원정';
    const homeName = g.homeTeam?.name || g.homeTeamName || g.hName || '홈';

    // 점수 파싱
    const awayScore = g.awayTeam?.score ?? g.awayTeamScore ?? g.aScore ?? '-';
    const homeScore = g.homeTeam?.score ?? g.homeTeamScore ?? g.hScore ?? '-';

    // 경기 상태 및 구장
    const status = g.status || g.gameStatusCode || g.statusCode || 'SCHEDULED';
    const stadium = g.stadium || g.venueDetails?.name || '구장';
    const gameTime = g.gameTime || (g.startTimeUserTimezone ? g.startTimeUserTimezone.substring(11, 16) : '18:30');

    // 이닝 및 상세 상태
    const matchDetails = g.baseballMatchDetails || {};
    const inning = matchDetails.currentInning || g.currentInning || '';
    const inningStatus = matchDetails.inningStatus || g.inningStatus || '';

    return {
      GAME_ID: g.gameId || '',
      G_TM: gameTime,
      S_NM: stadium,
      GAME_STATE_SC: status,
      CANCEL_SC_ID: status === 'CANCEL' || status === 'POSTPONED' || g.cancel,
      AWAY_NM: awayName,
      HOME_NM: homeName,
      T_SCORE_CN: awayScore,
      B_SCORE_CN: homeScore,
      GAME_INN_NO: inning ? `${inning}회` : '',
      GAME_TB_SC_NM: inningStatus,
      T_P_NM: g.awayStarter || g.awayTeam?.starter || '-',
      B_P_NM: g.homeStarter || g.homeTeam?.starter || '-',
      BALL_CN: matchDetails.balls || 0,
      STRIKE_CN: matchDetails.strikes || 0,
      OUT_CN: matchDetails.outs || 0
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
