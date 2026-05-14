const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const store = getStore({ name: "access-logs", consistency: "strong" });

    if (event.httpMethod === "POST") {
      // Log a new access
      const { user, tipo } = JSON.parse(event.body);
      const timestamp = new Date().toISOString();

      // Get existing logs
      let logs = [];
      try {
        const existing = await store.get("logs", { type: "json" });
        if (existing) logs = existing;
      } catch {}

      // Append new entry
      logs.push({ user, tipo, fecha: timestamp });

      // Keep last 10,000 entries
      if (logs.length > 10000) logs = logs.slice(-10000);

      await store.set("logs", JSON.stringify(logs));

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (event.httpMethod === "GET") {
      // Return all logs
      let logs = [];
      try {
        const existing = await store.get("logs", { type: "json" });
        if (existing) logs = existing;
      } catch {}

      return { statusCode: 200, headers, body: JSON.stringify(logs) };
    }

    return { statusCode: 405, headers, body: "Method not allowed" };

  } catch (err) {
    console.error("access-log error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
