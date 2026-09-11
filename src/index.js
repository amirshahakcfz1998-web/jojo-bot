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

          try {
            // استفاده از مدل gemini-2.5-flash که جدیدتر، سریع‌تر و برای جستجوی اینترنت در حساب رایگان بهینه‌تر است
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
            
            // بدنه درخواست با پشتیبانی از سرچ گوگل (Grounding) و ساختار صحیح
            const aiResponse = await fetch(geminiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: "تو یک دستیار هوش مصنوعی هوشمند، دوستانه و شوخ‌طبع به نام «جوجو» هستی. همیشه به زبان فارسی روان صحبت کن." }]
                },
                contents: [{ role: "user", parts: [{ text: text }] }],
                // فعال‌سازی ابزار جستجوی گوگل برای دسترسی به اطلاعات زنده اینترنت
                tools: [{ googleSearch: {} }]
              })
            });

            const aiData = await aiResponse.json();
            
            if (aiData.candidates && aiData.candidates.length > 0) {
               replyText = aiData.candidates[0].content.parts[0].text;
               
               // حذف ارجاعات اضافی متن که گاهی گوگل در انتهای جواب می‌آورد
               replyText = replyText.replace(/\[\d+\]/g, ''); 
            } else if (aiData.error) {
               console.log("Gemini API Error:", aiData.error.message);
               // اگر باز هم 429 داد، پیام بهتری بدهیم
               if(aiData.error.code === 429) {
                  replyText = "مغزم خیلی خسته است (محدودیت درخواست گوکل). لطفاً چند ثانیه دیگر دوباره بپرس!";
               } else {
                  replyText = `خطای ارتباط با مغز اصلی: ${aiData.error.message}`;
               }
            } else {
               console.log("Unexpected AI Data:", JSON.stringify(aiData));
            }
          } catch (aiError) {
             console.log("Fetch Error:", aiError);
             replyText = "اتصال من به اینترنت قطع شد!";
          }

          // ارسال جواب به کاربر
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
  },
};
