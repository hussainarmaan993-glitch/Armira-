export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (url.pathname === "/api/test") {
      return Response.json({
        openrouterConfigured: Boolean(env.OPENROUTER_API_KEY)
      });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const message = String(body?.message || "").trim();

        if (!message) {
          return Response.json(
            { error: "Message is required." },
            { status: 400 }
          );
        }

        if (!env.OPENROUTER_API_KEY) {
          return Response.json(
            { error: "OpenRouter API key is missing." },
            { status: 500 }
          );
        }

        const aiResponse = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": "Bearer " + env.OPENROUTER_API_KEY,
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
                    "You are Armira, a friendly and helpful AI assistant. Answer naturally, clearly and accurately."
                },
                {
                  role: "user",
                  content: message
                }
              ]
            })
          }
        );

        const data = await aiResponse.json();

        if (!aiResponse.ok) {
          return Response.json(
            {
              error:
                data?.error?.message ||
                "OpenRouter request failed."
            },
            { status: aiResponse.status }
          );
        }

        const answer =
          data?.choices?.[0]?.message?.content ||
          "I could not generate an answer.";

        return Response.json({ answer });

      } catch (error) {
        return Response.json(
          {
            error: error?.message || "Server error."
          },
          { status: 500 }
        );
      }
    }

    if (url.pathname === "/" || url.pathname === "/test") {
      const html = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta name="theme-color" content="#08070d">
<title>Armira AI</title>

<style>
* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html,
body {
  margin: 0;
  width: 100%;
  height: 100%;
  background: #08070d;
  color: #f8fafc;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  overflow: hidden;
}

button,
textarea {
  font-family: inherit;
}

button {
  border: 0;
  cursor: pointer;
}

.app {
  position: relative;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% -10%, rgba(124,58,237,.28), transparent 42%),
    radial-gradient(circle at 100% 60%, rgba(59,130,246,.10), transparent 35%),
    #08070d;
}

/* ---------- HEADER ---------- */

.header {
  height: 68px;
  min-height: 68px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255,255,255,.07);
  background: rgba(8,7,13,.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 10;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
}

.logo-wrap {
  position: relative;
}

.logo {
  width: 43px;
  height: 43px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  font-size: 22px;
  background: linear-gradient(145deg, #8b5cf6, #4f46e5);
  box-shadow:
    0 0 0 1px rgba(255,255,255,.10) inset,
    0 8px 30px rgba(99,102,241,.30);
}

.status-dot {
  position: absolute;
  right: -2px;
  bottom: -1px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid #08070d;
  box-shadow: 0 0 10px rgba(34,197,94,.65);
}

.brand-text {
  line-height: 1.15;
}

.name {
  font-size: 16px;
  font-weight: 750;
  letter-spacing: -.2px;
}

.online {
  margin-top: 4px;
  font-size: 10px;
  color: #86efac;
  letter-spacing: .2px;
}

.new-chat {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  color: #d4d4d8;
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.08);
  font-size: 20px;
  transition: .2s;
}

.new-chat:active {
  transform: scale(.92);
}

/* ---------- CHAT ---------- */

.chat {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scroll-behavior: smooth;
  padding: 18px 13px 16px;
}

.chat::-webkit-scrollbar {
  width: 4px;
}

.chat::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.10);
  border-radius: 20px;
}

.chatbox {
  width: 100%;
  max-width: 760px;
  margin: auto;
}

/* ---------- WELCOME ---------- */

.welcome {
  min-height: calc(100dvh - 170px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px 10px 50px;
}

.hero-logo {
  position: relative;
  width: 88px;
  height: 88px;
  margin-bottom: 22px;
}

.hero-logo::before {
  content: "";
  position: absolute;
  inset: -14px;
  border-radius: 34px;
  background: rgba(124,58,237,.13);
  filter: blur(15px);
}

.hero-logo-inner {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 29px;
  display: grid;
  place-items: center;
  font-size: 42px;
  background: linear-gradient(145deg, #8b5cf6, #4338ca);
  border: 1px solid rgba(255,255,255,.15);
  box-shadow:
    0 18px 50px rgba(79,70,229,.30),
    inset 0 1px 1px rgba(255,255,255,.20);
}

.welcome h1 {
  margin: 0;
  font-size: clamp(28px, 8vw, 42px);
  line-height: 1.05;
  letter-spacing: -1.4px;
  background: linear-gradient(90deg, #fff, #c4b5fd);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.welcome-sub {
  max-width: 390px;
  margin: 13px 0 24px;
  color: #a1a1aa;
  font-size: 14px;
  line-height: 1.6;
}

.suggestions {
  width: 100%;
  max-width: 540px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}

.suggestion {
  min-height: 54px;
  padding: 11px 12px;
  text-align: left;
  color: #d4d4d8;
  background: rgba(255,255,255,.045);
  border: 1px solid rgba(255,255,255,.075);
  border-radius: 16px;
  transition: .2s;
}

.suggestion:active {
  transform: scale(.97);
  background: rgba(124,58,237,.12);
}

.suggestion-icon {
  display: block;
  margin-bottom: 5px;
  font-size: 16px;
}

.suggestion-text {
  font-size: 11px;
  color: #a1a1aa;
}

/* ---------- MESSAGES ---------- */

.message {
  display: flex;
  width: 100%;
  margin: 14px 0;
  animation: messageIn .22s ease;
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(7px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user {
  justify-content: flex-end;
}

.ai {
  justify-content: flex-start;
  gap: 9px;
}

.ai-avatar {
  flex: 0 0 31px;
  width: 31px;
  height: 31px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  font-size: 15px;
  background: linear-gradient(145deg, #7c3aed, #4338ca);
  border: 1px solid rgba(255,255,255,.10);
  box-shadow: 0 5px 18px rgba(79,70,229,.20);
}

.bubble {
  max-width: min(88%, 650px);
  padding: 12px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.user .bubble {
  color: white;
  background: linear-gradient(145deg, #7c3aed, #5b21b6);
  border: 1px solid rgba(255,255,255,.09);
  border-bottom-right-radius: 6px;
  box-shadow: 0 7px 25px rgba(91,33,182,.18);
}

.ai .bubble {
  color: #e4e4e7;
  background: rgba(255,255,255,.045);
  border: 1px solid rgba(255,255,255,.075);
  border-bottom-left-radius: 6px;
}

/* ---------- TYPING ---------- */

.typing-bubble {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 58px;
  height: 42px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a78bfa;
  animation: typing 1.2s infinite;
}

.dot:nth-child(2) {
  animation-delay: .15s;
}

.dot:nth-child(3) {
  animation-delay: .30s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: .25;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

/* ---------- COMPOSER ---------- */

.composer-area {
  padding: 9px 12px calc(11px + env(safe-area-inset-bottom));
  background: linear-gradient(
    to top,
    #08070d 72%,
    rgba(8,7,13,.82)
  );
  z-index: 10;
}

.composer {
  width: 100%;
  max-width: 760px;
  margin: auto;
  min-height: 57px;
  display: flex;
  align-items: flex-end;
  gap: 7px;
  padding: 7px;
  border-radius: 20px;
  background: rgba(24,24,27,.88);
  border: 1px solid rgba(255,255,255,.10);
  box-shadow:
    0 15px 45px rgba(0,0,0,.35),
    inset 0 1px 0 rgba(255,255,255,.04);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

textarea {
  flex: 1;
  min-width: 0;
  min-height: 42px;
  max-height: 125px;
  resize: none;
  outline: none;
  border: 0;
  background: transparent;
  color: white;
  padding: 11px 7px;
  font-size: 14px;
  line-height: 20px;
}

textarea::placeholder {
  color: #71717a;
}

.action {
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #d4d4d8;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.06);
  font-size: 17px;
  transition: .18s;
}

.action:active {
  transform: scale(.91);
}

.send {
  color: white;
  background: linear-gradient(145deg, #8b5cf6, #4f46e5);
  box-shadow: 0 7px 20px rgba(79,70,229,.28);
}

.send:disabled {
  opacity: .38;
  box-shadow: none;
}

.note {
  text-align: center;
  margin-top: 7px;
  color: #52525b;
  font-size: 9px;
}

/* ---------- MOBILE ---------- */

@media (max-width: 430px) {
  .header {
    height: 62px;
    min-height: 62px;
  }

  .logo {
    width: 39px;
    height: 39px;
    border-radius: 13px;
  }

  .name {
    font-size: 15px;
  }

  .welcome {
    min-height: calc(100dvh - 160px);
  }

  .hero-logo,
  .hero-logo-inner {
    width: 78px;
    height: 78px;
  }

  .hero-logo-inner {
    font-size: 37px;
    border-radius: 25px;
  }

  .suggestions {
    grid-template-columns: 1fr;
  }

  .suggestion {
    min-height: 48px;
  }

  .bubble {
    font-size: 13.5px;
  }
}
</style>
</head>

<body>

<div class="app">

<header class="header">
  <div class="brand">

    <div class="logo-wrap">
      <div class="logo">🤖</div>
      <div class="status-dot"></div>
    </div>

    <div class="brand-text">
      <div class="name">Armira</div>
      <div class="online">● Online & ready</div>
    </div>
  </div>

  <button
    class="new-chat"
    onclick="newChat()"
    aria-label="New chat"
  >＋</button>
</header>

<main class="chat" id="chat">

  <div class="chatbox" id="chatbox">

    <section class="welcome" id="welcome">

      <div class="hero-logo">
        <div class="hero-logo-inner">🤖</div>
      </div>

      <h1>How can I help?</h1>

      <div class="welcome-sub">
        I'm Armira — your personal AI assistant.
        Ask me anything, brainstorm ideas, or just start a conversation.
      </div>

      <div class="suggestions">

        <button
          class="suggestion"
          onclick="useSuggestion('Explain artificial intelligence simply')"
        >
          <span class="suggestion-icon">🧠</span>
          <span class="suggestion-text">Explain AI simply</span>
        </button>

        <button
          class="suggestion"
          onclick="useSuggestion('Give me a creative idea for a YouTube video')"
        >
          <span class="suggestion-icon">✨</span>
          <span class="suggestion-text">Give me a creative idea</span>
        </button>

        <button
          class="suggestion"
          onclick="useSuggestion('Help me learn something interesting')"
        >
          <span class="suggestion-icon">📚</span>
          <span class="suggestion-text">Teach me something</span>
        </button>

        <button
          class="suggestion"
          onclick="useSuggestion('Tell me something interesting')"
        >
          <span class="suggestion-icon">💡</span>
          <span class="suggestion-text">Surprise me</span>
        </button>

      </div>

    </section>

  </div>

</main>

<div class="composer-area">

  <div class="composer">

    <button
      class="action"
      onclick="voice()"
      aria-label="Voice"
    >🎙️</button>

    <textarea
      id="input"
      placeholder="Message Armira..."
      rows="1"
    ></textarea>

    <button
      class="action send"
      id="send"
      onclick="sendMessage()"
      aria-label="Send"
    >➤</button>

  </div>

  <div class="note">
    Armira may make mistakes. Check important information.
  </div>

</div>

</div>

<script>
const input = document.getElementById("input");
const send = document.getElementById("send");
const chat = document.getElementById("chat");
const chatbox = document.getElementById("chatbox");

input.addEventListener("input", function() {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 125) + "px";
});

input.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function removeWelcome() {
  const welcome = document.getElementById("welcome");

  if (welcome) {
    welcome.remove();
  }
}

function useSuggestion(text) {
  input.value = text;
  input.dispatchEvent(new Event("input"));
  input.focus();
  sendMessage();
}

function addMessage(text, type) {
  removeWelcome();

  const row = document.createElement("div");
  row.className = "message " + type;

  if (type === "ai") {
    const avatar = document.createElement("div");
    avatar.className = "ai-avatar";
    avatar.textContent = "🤖";
    row.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  row.appendChild(bubble);
  chatbox.appendChild(row);

  requestAnimationFrame(function() {
    chat.scrollTop = chat.scrollHeight;
  });
}

function addTyping() {
  const row = document.createElement("div");
  row.className = "message ai";
  row.id = "loading";

  const avatar = document.createElement("div");
  avatar.className = "ai-avatar";
  avatar.textContent = "🤖";

  const bubble = document.createElement("div");
  bubble.className = "bubble typing-bubble";

  const d1 = document.createElement("span");
  d1.className = "dot";

  const d2 = document.createElement("span");
  d2.className = "dot";

  const d3 = document.createElement("span");
  d3.className = "dot";

  bubble.appendChild(d1);
  bubble.appendChild(d2);
  bubble.appendChild(d3);

  row.appendChild(avatar);
  row.appendChild(bubble);

  chatbox.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
  const message = input.value.trim();

  if (!message || send.disabled) {
    return;
  }

  input.value = "";
  input.style.height = "auto";

  addMessage(message, "user");

  send.disabled = true;
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

    const loading = document.getElementById("loading");

    if (loading) {
      loading.remove();
    }

    if (!response.ok) {
      addMessage(
        "Sorry 😔 " + (data.error || "Something went wrong."),
        "ai"
      );
    } else {
      addMessage(
        data.answer || "No answer received.",
        "ai"
      );
    }

  } catch (error) {

    const loading = document.getElementById("loading");

    if (loading) {
      loading.remove();
    }

    addMessage(
      "Connection error 😔 Please try again.",
      "ai"
    );
  }

  send.disabled = false;
  input.focus();
}

function newChat() {
  location.reload();
}

function voice() {
  const Recognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!Recognition) {
    alert("Voice input is not supported in this browser.");
    return;
  }

  const recognition = new Recognition();

  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = function(event) {
    input.value = event.results[0][0].transcript;
    input.dispatchEvent(new Event("input"));
    input.focus();
  };

  recognition.onerror = function() {
    console.log("Voice recognition error");
  };

  recognition.start();
}
</script>

</body>
</html>`;

      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8"
        }
      });
    }

    return new Response("Not Found", {
      status: 404
    });
  }
};
