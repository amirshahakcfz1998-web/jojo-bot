export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // بخش تنظیم ارتباط (Webhook) با تلگرام
    if (url.pathname === "/setup") {
      const webhookUrl = `https://${url.hostname}/webhook`;
      const telegramApiUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook?url=${webhookUrl}`;
      const response = await fetch(telegramApiUrl);
      const result = await response.json();
      return new Response(JSON.stringify(result), { headers: { "content-type": "application/json" } });
    }

    // بخش دریافت پیام
    if (request.method === "POST" && url.pathname === "/webhook") {
      try {
        const update = await request.json();
        
        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const text = update.message.text;

          // 1. آماده‌سازی پیام برای هوش مصنوعی کلادفلر
          const messages = [
            { role: "system", content: "تو یک دستیار هوش مصنوعی هوشمند، دوستانه و کمی شوخ‌طبع به نام «جوجو» هستی. باید همیشه به زبان فارسی روان صحبت کنی. جواب‌هایت کوتاه و مفید باشد." },
            { role: "user", content: text }
          ];

          let replyText = "";
          
          try {
             // 2. استفاده از هوش مصنوعی داخلی Cloudflare (مدل Llama 3)
             const aiResponse = await env.AI.run(
               '@cf/meta/llama-3.1-8b-instruct',
               { messages: messages }
             );
             replyText = aiResponse.response;
          } catch (aiError) {
             console.log("AI Error:", aiError);
             replyText = "اوه! مغزم یک لحظه هنگ کرد. می‌تونی دوباره بپرسی؟";
          }

          // 3. ارسال جواب به تلگرام
          const sendMessageUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
          await fetch(sendMessageUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: replyText
            })
          });
        }
        return new Response("OK", { status: 200 });
      } catch (error) {
        return new Response("Error", { status: 500 });
      }
    }

    return new Response("JOJO is active with Cloudflare AI!", { headers: { "content-type": "text/plain" } });
  },
};
            
