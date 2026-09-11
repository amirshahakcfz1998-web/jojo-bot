export default {
  async fetch(request, env, ctx) {
    return new Response("Hello, I am JOJO!", {
      headers: { "content-type": "text/plain" },
    });
  },
};
