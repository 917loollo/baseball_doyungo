exports.handler = async function(event, context) {
  try {
    const k = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const date = k.toISOString().slice(0, 10).replaceAll("-", "");
    const r = await fetch("https://www.koreabaseball.com/ws/Main.asmx/GetKboGameList", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Referer": "https://www.koreabaseball.com/",
        "User-Agent": "Mozilla/5.0"
      },
      body: JSON.stringify({ leId: "1", srId: "0", date })
    });
    if (!r.ok) throw Error("KBO HTTP " + r.status);
    const p = JSON.parse(await r.text());
    const d = Array.isArray(p?.d) ? p.d : Array.isArray(p) ? p : [];
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "s-maxage=5, stale-while-revalidate=5",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ date, d })
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: e.message })
    };
  }
};
