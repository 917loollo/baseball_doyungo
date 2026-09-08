exports.handler = async function(event, context) {
  const now = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');

  // 실시간 KBO 경기 및 그래픽 라이브 데이터
  const games = [
    {
      GAME_ID: "20260908SSLG0",
      G_TM: "18:30",
      S_NM: "잠실구장",
      GAME_STATE_SC: "LIVE",
      AWAY_NM: "삼성",
      HOME_NM: "LG",
      T_SCORE_CN: 7,
      B_SCORE_CN: 4,
      GAME_INN_NO: "4회",
      GAME_TB_SC_NM: "초",
      PITCHER: { name: "백정현", record: "3이닝 4실점 3K", pCount: 58 },
      BATTER: { name: "김현수", record: "2타수 1안타 1홈런", avg: "0.294" },
      RUNNERS: { base1: true, base2: true, base3: false },
      BALL_CN: 2, STRIKE_CN: 1, OUT_CN: 1,
      INNING_SCORES: {
        away: [1, 0, 2, 4, 0, 0, 0, 0, 0],
        home: [0, 0, 0, 4, 0, 0, 0, 0, 0],
        awayRHE: [7, 9, 0], homeRHE: [4, 6, 1]
      }
    },
    {
      GAME_ID: "20260908HHNC0",
      G_TM: "18:30",
      S_NM: "창원구장",
      GAME_STATE_SC: "LIVE",
      AWAY_NM: "한화",
      HOME_NM: "NC",
      T_SCORE_CN: 3,
      B_SCORE_CN: 2,
      GAME_INN_NO: "6회",
      GAME_TB_SC_NM: "말",
      PITCHER: { name: "류현진", record: "5이닝 2실점 6K", pCount: 82 },
      BATTER: { name: "손아섭", record: "3타수 2안타", avg: "0.312" },
      RUNNERS: { base1: true, base2: false, base3: true },
      BALL_CN: 3, STRIKE_CN: 2, OUT_CN: 2,
      INNING_SCORES: {
        away: [0, 1, 0, 0, 2, 0, 0, 0, 0],
        home: [1, 0, 0, 1, 0, 0, 0, 0, 0],
        awayRHE: [3, 7, 1], homeRHE: [2, 5, 0]
      }
    }
  ];

  // 팀 순위 데이터
  const teamRankings = [
    { rank: 1, team: "LG", games: 128, win: 76, loss: 50, draw: 2, pct: "0.603", diff: "0.0" },
    { rank: 2, team: "kt", games: 129, win: 73, loss: 53, draw: 3, pct: "0.579", diff: "3.0" },
    { rank: 3, team: "SSG", games: 127, win: 68, loss: 56, draw: 3, pct: "0.548", diff: "7.0" },
    { rank: 4, team: "NC", games: 126, win: 65, loss: 59, draw: 2, pct: "0.524", diff: "10.0" },
    { rank: 5, team: "두산", games: 128, win: 64, loss: 62, draw: 2, pct: "0.508", diff: "12.0" },
    { rank: 6, team: "KIA", games: 125, win: 62, loss: 61, draw: 2, pct: "0.504", diff: "12.5" },
    { rank: 7, team: "롯데", games: 126, win: 60, loss: 62, draw: 4, pct: "0.492", diff: "14.0" },
    { rank: 8, team: "삼성", games: 127, win: 58, loss: 68, draw: 1, pct: "0.460", diff: "18.0" },
    { rank: 9, team: "한화", games: 126, win: 52, loss: 71, draw: 3, pct: "0.423", diff: "22.5" },
    { rank: 10, team: "키움", games: 128, win: 51, loss: 74, draw: 3, pct: "0.408", diff: "24.5" }
  ];

  // 개인 순위 데이터 (타자 / 투수)
  const playerRankings = {
    hitters: [
      { rank: 1, name: "손아섭", team: "NC", avg: "0.339", hr: 5, rbi: 65, hits: 152 },
      { rank: 2, name: "김혜성", team: "키움", avg: "0.335", hr: 7, rbi: 55, hits: 161 },
      { rank: 3, name: "홍창기", team: "LG", avg: "0.332", hr: 1, rbi: 60, hits: 148 },
      { rank: 4, name: "구자욱", team: "삼성", avg: "0.325", hr: 11, rbi: 71, hits: 139 }
    ],
    pitchers: [
      { rank: 1, name: "페디", team: "NC", era: "2.00", win: 20, loss: 6, SO: 209 },
      { rank: 2, name: "안우진", team: "키움", era: "2.39", win: 9, loss: 7, SO: 164 },
      { rank: 3, name: "고영표", team: "kt", era: "2.78", win: 12, loss: 7, SO: 114 },
      { rank: 4, name: "임찬규", team: "LG", era: "3.42", win: 14, loss: 3, SO: 102 }
    ]
  };

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      d: games,
      teams: teamRankings,
      players: playerRankings,
      date: `${year}.${month}.${day}`
    })
  };
};
