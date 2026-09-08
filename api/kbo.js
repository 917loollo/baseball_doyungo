const https = require('https');

exports.handler = async function(event, context) {
  return new Promise((resolve) => {
    // 한국 시간(KST) 기준 YYYYMMDD 날짜 생성
    const now = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // 네이버 KBO 일정/중계 API 연동
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
          // 해당 날짜 경기 목록 추출
          const games = json.gameScheduleList || [];
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
    }).on('error', (err) => {
      resolve({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ d: [], date: `${year}.${month}.${day}` })
      });
    });
  });
};
