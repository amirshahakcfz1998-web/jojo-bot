export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return json({
        ok: true,
        bot: "JOJO",
        version: "0.1.0",
        service: "Telegram AI Assistant",
        status: "running"
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        ok: true,
        status: "healthy"
      });
    }

    return json(
      {
        ok: false,
        error: "Not Found"
      },
      404
    );
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}
