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

          let replyText = "متأسفانه نتوانستم پاسخی پیدا کنم.";
          const systemPrompt = "تو یک دستیار هوش مصنوعی هوشمند، دوستانه و شوخ‌طبع به نام «جوجو» هستی. همیشه به زبان فارسی روان صحبت کن.";

          try {
            // تلاش اول: اتصال به مغز اصلی (Google Gemini) برای دسترسی به اینترنت
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${env.GEMINI_API_KEY}`;
            
            const aiResponse = await fetch(geminiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: "user", parts: [{ text: text }] }],
                tools: [{ googleSearch: {} }] // فعال‌سازی سرچ زنده
              })
            });

            const aiData = await aiResponse.json();
            
            if (aiData.candidates && aiData.candidates.length > 0) {
               // گوگل جواب داد
               replyText = aiData.candidates[0].content.parts[0].text;
               replyText = replyText.replace(/\[\d+\]/g, ''); // پاکسازی لینک‌های اضافی
            } else if (aiData.error && aiData.error.message.includes("quota")) {
               // خطا: محدودیت گوگل (Quota Exceeded) - فعال‌سازی مغز پشتیبان
               console.log("Gemini Quota Exceeded. Switching to Fallback AI...");
               replyText = await useFallbackAI(text, systemPrompt, env);
            } else if (aiData.error) {
               // خطای دیگری از سمت گوگل
               console.log("Gemini API Error:", aiData.error.message);
               replyText = `مغز اصلی دچار مشکل شد: ${aiData.error.message}`;
            }
          } catch (error) {
             // خطای قطع اتصال - فعال‌سازی مغز پشتیبان
             console.log("Connection Error to Gemini. Switching to Fallback AI...");
             replyText = await useFallbackAI(text, systemPrompt, env);
          }

          // ارسال نهایی جواب به کاربر
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

    return new Response("JOJO is active!", { headers: { "content-type": "text/plain" } });
  }
};

// تابع مغز پشتیبان (استفاده از Cloudflare AI هنگام قطع شدن گوگل)
async function useFallbackAI(userText, systemPrompt, env) {
  try {
    if (!env.AI) {
      return "اوه! مغز اصلی من محدود شده و مغز پشتیبان هم فعال نیست.";
    }

    const messages = [
      { role: "system", content: systemPrompt + " مهم: تو الان به اینترنت متصل نیستی. اگر سوال درباره اطلاعات زنده (مثل قیمت دلار یا اخبار امروز) بود، عذرخواهی کن و بگو موقتاً دسترسی به اینترنت ندارم." },
      { role: "user", content: userText }
    ];

    const aiResponse = await env.AI.run(
      '@cf/meta/llama-3.1-8b-instruct',
      { messages: messages }
    );
    
    return "[پاسخ از مغز پشتیبان 🧠]\n\n" + aiResponse.response;
  } catch (fallbackError) {
    console.log("Fallback AI Error:", fallbackError);
    return "متاسفم، هم مغز اصلی و هم مغز پشتیبان من از کار افتاده‌اند!";
  }
                 }
