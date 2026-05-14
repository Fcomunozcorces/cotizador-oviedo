const { getStore } = require("@netlify/blobs");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

const MAX_LOGS = 10000;

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  try {
    const store = getStore({ name: "oviedo-access-logs", consistency: "strong" });

    if (event.httpMethod === "GET") {
      const data = await store.get("logs", { type: "json" });
      const logs = Array.isArray(data) ? data : [];
      return { statusCode: 200, headers: CORS, body: JSON.stringify(logs) };
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      if (!body.user) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing user" }) };
      }
      const existing = await store.get("logs", { type: "json" });
      const logs = Array.isArray(existing) ? existing : [];
      logs.push({
        user: String(body.user),
        tipo: String(body.tipo || ""),
        fecha: new Date().toISOString()
      });
      const trimmed = logs.length > MAX_LOGS ? logs.slice(-MAX_LOGS) : logs;
      await store.setJSON("logs", trimmed);
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, count: trimmed.length }) };
    }

    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
