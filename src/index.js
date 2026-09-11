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

    // بخش دریافت پیام از تلگرام
    if (request.method === "POST" && url.pathname === "/webhook") {
      try {
        const update = await request.json();
        
        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const text = update.message.text;

          let replyText = "مشکلی پیش آمد. لطفا دوباره تلاش کن.";

          try {
            // 1. تنظیمات هوش مصنوعی Gemini و فعال‌سازی قابلیت جستجو در اینترنت
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${env.GEMINI_API_KEY}`;
            const prompt = `تو یک دستیار هوش مصنوعی هوشمند، دوستانه و شوخ‌طبع به نام «جوجو» هستی. همیشه به زبان فارسی روان صحبت کن. به این پیام کاربر پاسخ بده: ${text}`;
            
            const aiResponse = await fetch(geminiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                // این بخش به جوجو اجازه می‌دهد از گوگل سرچ استفاده کند
                tools: [{ googleSearch: {} }]
              })
            });

            const aiData = await aiResponse.json();
            
            if (aiData.candidates && aiData.candidates.length > 0) {
               replyText = aiData.candidates[0].content.parts[0].text;
            } else {
               console.log("AI Data Error:", JSON.stringify(aiData));
            }
          } catch (aiError) {
             console.log("Fetch Error:", aiError);
             replyText = "اوه، اتصال من به مغز اصلی قطع شد! (خطای ارتباط با هوش مصنوعی)";
          }

          // 2. ارسال جواب به کاربر در تلگرام
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

    return new Response("JOJO is active with Gemini!", { headers: { "content-type": "text/plain" } });
  },
};
