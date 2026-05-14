const { getStore } = require("@netlify/blobs");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };

  try {
    const store = getStore({ name: "oviedo-folio", consistency: "strong" });
    const year = new Date().getFullYear();
    const key = `counter-${year}`;

    if (event.httpMethod === "GET") {
      const current = await store.get(key, { type: "json" });
      const n = current?.n || 0;
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ year, n, next: `COT-${year}-${String(n + 1).padStart(4, "0")}` }) };
    }

    if (event.httpMethod === "POST") {
      const current = await store.get(key, { type: "json" });
      const next = (current?.n || 0) + 1;
      await store.setJSON(key, { n: next, updated: new Date().toISOString() });
      const folio = `COT-${year}-${String(next).padStart(4, "0")}`;
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ folio, n: next, year }) };
    }

    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
