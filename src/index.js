export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check
    if (request.method === "GET" && url.pathname === "/") {
      return json({
        ok: true,
        bot: "JOJO",
        version: "0.2.0",
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

    // Telegram Webhook
    if (request.method === "POST" && url.pathname === "/telegram/webhook") {
      return handleTelegramWebhook(request, env);
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

async function handleTelegramWebhook(request, env) {
  try {
    // Check Telegram webhook secret
    const receivedSecret =
      request.headers.get("X-Telegram-Bot-Api-Secret-Token");

    if (!receivedSecret || receivedSecret !== env.TELEGRAM_WEBHOOK_SECRET) {
      return json(
        {
          ok: false,
          error: "Unauthorized"
        },
        401
      );
    }

    // Read request body
    const update = await request.json();

    // Basic Telegram update validation
    if (!update || typeof update !== "object") {
      return json(
        {
          ok: false,
          error: "Invalid update"
        },
        400
      );
    }

    // Log only the update ID.
    // Never log the full Telegram update because it may contain
    // user messages and other private information.
    console.log(
      JSON.stringify({
        event: "telegram_update_received",
        update_id: update.update_id ?? null
      })
    );

    // Phase 5 is only connectivity testing.
    // AI, memory, database and commands will be added later.
    return json({
      ok: true,
      received: true
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "telegram_webhook_error",
        error: error instanceof Error ? error.message : "Unknown error"
      })
    );

    return json(
      {
        ok: false,
        error: "Internal Server Error"
      },
      500
    );
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}
