export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // بخش تنظیم ارتباط (Webhook) با تلگرام
    if (url.pathname === "/setup") {
      const webhookUrl = `https://${url.hostname}/webhook`;
      const telegramApiUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook?url=${webhookUrl}`;
      
      const response = await fetch(telegramApiUrl);
      const result = await response.json();
      
      return new Response(JSON.stringify(result), {
        headers: { "content-type": "application/json" },
      });
    }

    // بخش دریافت پیام از تلگرام
    if (request.method === "POST" && url.pathname === "/webhook") {
      try {
        const update = await request.json();
        
        // اگر پیام متنی بود
        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const text = update.message.text;

          const sendMessageUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
          
          // جوجو فعلاً فقط پیام شما را تکرار می‌کند
          await fetch(sendMessageUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `سلام! من پیام شما را دریافت کردم: "${text}"`
            })
          });
        }
        
        return new Response("OK", { status: 200 });
      } catch (error) {
        return new Response("Error", { status: 500 });
      }
    }

    // اگر آدرس اصلی باز شود
    return new Response("JOJO Bot is alive and waiting for setup!", {
      headers: { "content-type": "text/plain" },
    });
  },
};
