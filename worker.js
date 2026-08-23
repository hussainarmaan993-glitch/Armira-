export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ─────────────────────────────────────
    // CORS
    // ─────────────────────────────────────
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // ─────────────────────────────────────
    // API SECRET TEST
    // ─────────────────────────────────────
    if (url.pathname === "/api/test") {
      return new Response(
        JSON.stringify({
          openrouterConfigured: Boolean(env.OPENROUTER_API_KEY)
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    // ─────────────────────────────────────
    // CHAT API
    // ─────────────────────────────────────
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();

        const message =
          typeof body?.message === "string"
            ? body.message.trim()
            : "";

        if (!message) {
          return new Response(
            JSON.stringify({
              error: "Message is required."
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        if (!env.OPENROUTER_API_KEY) {
          return new Response(
            JSON.stringify({
              error: "OpenRouter API key is not configured."
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        const openRouterResponse = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": url.origin,
              "X-Title": "Armira AI"
            },
            body: JSON.stringify({
              model: "nvidia/nemotron-3-super-120b-a12b:free",
              messages: [
                {
                  role: "system",
                  content:
                    "You are Armira, a friendly, intelligent and helpful AI assistant. Answer naturally and clearly. Be concise when the user asks a simple question and provide detailed explanations when needed. Do not claim to have performed actions you cannot actually perform."
                },
                {
                  role: "user",
                  content: message
                }
              ]
            })
          }
        );

        const data = await openRouterResponse.json();

        if (!openRouterResponse.ok) {
          return new Response(
            JSON.stringify({
              error:
                data?.error?.message ||
                "OpenRouter request failed."
            }),
            {
              status: openRouterResponse.status,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        const answer =
          data?.choices?.[0]?.message?.content ||
          "I couldn't generate a response.";

        return new Response(
          JSON.stringify({
            answer
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error?.message || "Server error."
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }
    }

    // ─────────────────────────────────────
    // ARMIRA UI
    // ─────────────────────────────────────
    if (url.pathname === "/" || url.pathname === "/test") {
      return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
  >
  <meta name="theme-color" content="#09090b">
  <title>Armira AI</title>

  <style>
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #09090b;
      color: #f4f4f5;
      font-family:
        Inter,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
    }

    body {
      overflow: hidden;
    }

    button,
    input {
      font: inherit;
    }

    .app {
      width: 100%;
      height: 100dvh;
      display: flex;
      flex-direction: column;
      background:
        radial-gradient(
          circle at 50% -10%,
          rgba(124, 58, 237, 0.18),
          transparent 35%
        ),
        #09090b;
    }

    /* HEADER */

    .header {
      height: 64px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      background: rgba(9,9,11,0.82);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 11px;
    }

    .logo {
      width: 38px;
      height: 38px;
      border-radius: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 21px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      box-shadow: 0 8px 25px rgba(124,58,237,0.28);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }

    .brand-name {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }

    .status {
      margin-top: 3px;
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #a1a1aa;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 8px rgba(34,197,94,0.8);
    }

    .new-chat {
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05);
      color: #e4e4e7;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 20px;
    }

    .new-chat:active {
      transform: scale(0.94);
    }

    /* CHAT */

    .chat {
      flex: 1;
      overflow-y: auto;
      padding: 24px 14px 18px;
      scroll-behavior: smooth;
    }

    .chat-inner {
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
    }

    .welcome {
      min-height: 58vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 30px 15px;
    }

    .welcome-logo {
      width: 74px;
      height: 74px;
      border-radius: 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 39px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      box-shadow:
        0 18px 50px rgba(124,58,237,0.28);
      margin-bottom: 20px;
    }

    .welcome h1 {
      margin: 0;
      font-size: 29px;
      letter-spacing: -0.7px;
    }

    .welcome p {
      margin: 10px 0 0;
      max-width: 430px;
      color: #a1a1aa;
      font-size: 14px;
      line-height: 1.6;
    }

    .suggestions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px;
      width: 100%;
      max-width: 520px;
      margin-top: 25px;
    }

    .suggestion {
      padding: 13px;
      text-align: left;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.035);
      color: #d4d4d8;
      cursor: pointer;
      font-size: 13px;
    }

    .suggestion:active {
      transform: scale(0.98);
      background: rgba(255,255,255,0.07);
    }

    .message {
      display: flex;
      margin: 12px 0;
      animation: appear 0.2s ease;
    }

    @keyframes appear {
      from {
        opacity: 0;
        transform: translateY(5px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message.user {
      justify-content: flex-end;
    }

    .bubble {
      max-width: 86%;
      padding: 12px 15px;
      border-radius: 18px;
      line-height: 1.55;
      font-size: 14px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .message.user .bubble {
      background: #6d28d9;
      color: white;
      border-bottom-right-radius: 5px;
    }

    .message.assistant .bubble {
      background: rgba(255,255,255,0.055);
      border: 1px solid rgba(255,255,255,0.07);
      color: #e4e4e7;
      border-bottom-left-radius: 5px;
    }

    .typing {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-width: 48px;
    }

    .typing span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #a1a1aa;
      animation: bounce 1s infinite;
    }

    .typing span:nth-child(2) {
      animation-delay: 0.15s;
    }

    .typing span:nth-child(3) {
      animation-delay: 0.3s;
    }

    @keyframes bounce {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.45;
      }

      30% {
        transform: translateY(-4px);
        opacity: 1;
      }
    }

    /* COMPOSER */

    .composer-area {
      flex-shrink: 0;
      padding: 10px 12px calc(12px + env(safe-area-inset-bottom));
      background: linear-gradient(
        to top,
        #09090b 70%,
        rgba(9,9,11,0.75)
      );
    }

    .composer {
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(24,24,27,0.92);
      border-radius: 20px;
      box-shadow: 0 10px 35px rgba(0,0,0,0.28);
    }

    .composer textarea {
      flex: 1;
      min-height: 42px;
      max-height: 130px;
      resize: none;
      outline: none;
      border: 0;
      background: transparent;
      color: #f4f4f5;
      padding: 11px 7px;
      font-size: 14px;
      line-height: 1.45;
    }

    .composer textarea::placeholder {
      color: #71717a;
    }

    .icon-btn,
    .send-btn {
      flex-shrink: 0;
      width: 42px;
      height: 42px;
      border-radius: 14px;
      border: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .icon-btn {
      background: rgba(255,255,255,0.06);
      color: #d4d4d8;
    }

    .send-btn {
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      color: white;
    }

    .send-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .disclaimer {
      text-align: center;
      color: #52525b;
      font-size: 10px;
      margin-top: 7px;
    }

    @media (max-width: 500px) {
      .welcome h1 {
        font-size: 26px;
      }

      .suggestions {
        grid-template-columns: 1fr;
      }

      .bubble {
        max-width: 90%;
      }
    }
  </style>
</head>

<body>
  <div class="app">

    <header class="header">
      <div class="brand">
        <div class="logo">🤖</div>

        <div class="brand-text">
          <div class="brand-name">Armira</div>

          <div class="status">
            <span class="status-dot"></span>
            Online
          </div>
        </div>
      </div>

      <button
        class="new-chat"
        onclick="newChat()"
        title="New chat"
      >
        ↻
      </button>
    </header>

    <main class="chat" id="chat">
      <div class="chat-inner" id="chatInner">

        <section class="welcome" id="welcome">
          <div class="welcome-logo">🤖</div>

          <h1>How can I help?</h1>

          <p>
            I'm Armira, your AI assistant. Ask me anything,
            brainstorm ideas, or just start a conversation.
          </p>

          <div class="suggestions">
            <button
              class="suggestion"
              onclick="useSuggestion('Explain artificial intelligence simply')"
            >
              🧠 Explain AI simply
            </button>

            <button
              class="suggestion"
              onclick="useSuggestion('Give me some creative ideas')"
            >
              💡 Give me creative ideas
            </button>

            <button
              class="suggestion"
              onclick="useSuggestion('Help me write something')"
            >
              ✍️ Help me write
            </button>

            <button
              class="suggestion"
              onclick="useSuggestion('Tell me something interesting')"
            >
              ✨ Tell me something interesting
            </button>
          </div>
        </section>

      </div>
    </main>

    <section class="composer-area">
      <div class="composer">

        <button
          class="icon-btn"
          id="voiceBtn"
          onclick="startVoice()"
          title="Voice input"
        >
          🎙️
        </button>

        <textarea
          id="messageInput"
          rows="1"
          placeholder="Ask Armira..."
          autocomplete="off"
        ></textarea>

        <button
          class="send-btn"
          id="sendBtn"
          onclick="sendMessage()"
          title="Send"
        >
          ➤
        </button>

      </div>

      <div class="disclaimer">
        Armira can make mistakes. Check important information.
      </div>
    </section>

  </div>

  <script>
    const input = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    const chat = document.getElementById("chat");
    const chatInner = document.getElementById("chatInner");

    let welcome = document.getElementById("welcome");

    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height =
        Math.min(input.scrollHeight, 130) + "px";
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });

    function useSuggestion(text) {
      input.value = text;
      input.focus();
      sendMessage();
    }

    function removeWelcome() {
      if (welcome) {
        welcome.remove();
        welcome = null;
      }
    }

    function addMessage(text, type) {
      removeWelcome();

      const wrapper = document.createElement("div");
      wrapper.className = "message " + type;

      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.textContent = text;

      wrapper.appendChild(bubble);
      chatInner.appendChild(wrapper);

      scrollToBottom();

      return wrapper;
    }

    function addTyping() {
      removeWelcome();

      const wrapper = document.createElement("div");
      wrapper.className = "message assistant";
      wrapper.id = "typingMessage";

      const bubble = document.createElement("div");
      bubble.className = "bubble";

      bubble.innerHTML =
  '<div class="typing">' +
    '<span></span>' +
    '<span></span>' +
    '<span></span>' +
  '</div>';

      wrapper.appendChild(bubble);
      chatInner.appendChild(wrapper);

      scrollToBottom();
    }

    function removeTyping() {
      const typing = document.getElementById("typingMessage");

      if (typing) {
        typing.remove();
      }
    }

    function scrollToBottom() {
      setTimeout(() => {
        chat.scrollTop = chat.scrollHeight;
      }, 20);
    }

    async function sendMessage() {
      const message = input.value.trim();

      if (!message || sendBtn.disabled) {
        return;
      }

      input.value = "";
      input.style.height = "42px";

      addMessage(message, "user");

      sendBtn.disabled = true;
      addTyping();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: message
          })
        });

        const data = await response.json();

        removeTyping();

        if (!response.ok) {
          addMessage(
            "Sorry 😔 " +
            (data.error || "Something went wrong."),
            "assistant"
          );
        } else {
          addMessage(
            data.answer || "I didn't receive an answer.",
            "assistant"
          );
        }

      } catch (error) {
        removeTyping();

        addMessage(
          "Connection error 😔 Please try again.",
          "assistant"
        );
      }

      sendBtn.disabled = false;
      input.focus();
    }

    function newChat() {
      chatInner.innerHTML = `
        <function newChat() {
  location.reload();
        }-logo">🤖</div>

          <h1>How can I help?</h1>

          <p>
            I'm Armira, your AI assistant. Ask me anything,
            brainstorm ideas, or just start a conversation.
          </p>

          <div class="suggestions">
            <button
              class="suggestion"
              onclick="useSuggestion('Explain artificial intelligence simply')"
            >
              🧠 Explain AI simply
            </button>

            <button
              class="suggestion"
              onclick="useSuggestion('Give me some creative ideas')"
            >
              💡 Give me creative ideas
            </button>

            <button
              class="suggestion"
              onclick="useSuggestion('Help me write something')"
            >
              ✍️ Help me write
            </button>

            <button
              class="suggestion"
              onclick="useSuggestion('Tell me something interesting')"
            >
              ✨ Tell me something interesting
            </button>
          </div>
        </section>
      `;

      welcome = document.getElementById("welcome");
      input.value = "";
      input.focus();
    }

    function startVoice() {
      const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert(
          "Voice input is not supported by this browser."
        );
        return;
      }

      const recognition = new SpeechRecognition();

      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        document.getElementById("voiceBtn").textContent = "🔴";
      };

      recognition.onresult = (event) => {
        const transcript =
          event.results[0][0].transcript;

        input.value = transcript;
        input.dispatchEvent(new Event("input"));
      };

      recognition.onerror = () => {
        document.getElementById("voiceBtn").textContent = "🎙️";
      };

      recognition.onend = () => {
        document.getElementById("voiceBtn").textContent = "🎙️";
      };

      recognition.start();
    }
  </script>
</body>
</html>`, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8"
        }
      });
    }

    // ─────────────────────────────────────
    // NOT FOUND
    // ─────────────────────────────────────
    return new Response("Not Found", {
      status: 404,
      headers: corsHeaders
    });
  }
};
