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

    // API key test
    if (url.pathname === "/api/test") {
      return Response.json({
        openrouterConfigured: Boolean(env.OPENROUTER_API_KEY)
      });
    }

    // Chat API
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

    // Armira UI
    if (url.pathname === "/" || url.pathname === "/test") {
      const html = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#09090b">
<title>Armira AI</title>

<style>
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  background: #09090b;
  color: #f4f4f5;
  font-family: system-ui, sans-serif;
}

body {
  overflow: hidden;
}

.app {
  height: 100dvh;
  display: flex;
  flex-direction: column;
}

.header {
  height: 64px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #27272a;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  width: 40px;
  height: 40px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  font-size: 22px;
  background: linear-gradient(135deg,#7c3aed,#4f46e5);
}

.name {
  font-weight: 700;
}

.online {
  font-size: 11px;
  color: #22c55e;
}

.new {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 12px;
  background: #18181b;
  color: white;
  font-size: 20px;
}

.chat {
  flex: 1;
  overflow-y: auto;
  padding: 20px 13px;
}

.chatbox {
  max-width: 760px;
  margin: auto;
}

.welcome {
  min-height: 65vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.biglogo {
  width: 76px;
  height: 76px;
  border-radius: 25px;
  display: grid;
  place-items: center;
  font-size: 38px;
  background: linear-gradient(135deg,#7c3aed,#4f46e5);
  margin-bottom: 18px;
}

h1 {
  margin: 0;
  font-size: 28px;
}

.welcome p {
  max-width: 400px;
  color: #a1a1aa;
  line-height: 1.5;
}

.message {
  display: flex;
  margin: 12px 0;
}

.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 88%;
  padding: 12px 15px;
  border-radius: 17px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.user .bubble {
  background: #6d28d9;
  border-bottom-right-radius: 5px;
}

.ai .bubble {
  background: #18181b;
  border: 1px solid #27272a;
  border-bottom-left-radius: 5px;
}

.composer-area {
  padding: 10px 12px 14px;
  border-top: 1px solid #18181b;
}

.composer {
  max-width: 760px;
  margin: auto;
  display: flex;
  gap: 7px;
  align-items: flex-end;
  padding: 7px;
  border: 1px solid #3f3f46;
  border-radius: 18px;
  background: #18181b;
}

textarea {
  flex: 1;
  min-height: 42px;
  max-height: 120px;
  resize: none;
  border: 0;
  outline: 0;
  background: transparent;
  color: white;
  padding: 11px 7px;
  font-size: 14px;
}

textarea::placeholder {
  color: #71717a;
}

button {
  cursor: pointer;
}

.icon,
.send {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 13px;
  color: white;
  font-size: 18px;
}

.icon {
  background: #27272a;
}

.send {
  background: linear-gradient(135deg,#7c3aed,#4f46e5);
}

.send:disabled {
  opacity: .4;
}

.note {
  text-align: center;
  color: #52525b;
  font-size: 10px;
  margin-top: 6px;
}

.typing {
  color: #a1a1aa;
}
</style>
</head>

<body>

<div class="app">

<header class="header">
  <div class="brand">
    <div class="logo">🤖</div>
    <div>
      <div class="name">Armira</div>
      <div class="online">● Online</div>
    </div>
  </div>

  <button class="new" onclick="newChat()">↻</button>
</header>

<main class="chat" id="chat">
  <div class="chatbox" id="chatbox">

    <div class="welcome" id="welcome">
      <div class="biglogo">🤖</div>
      <h1>How can I help?</h1>
      <p>
        I'm Armira, your AI assistant.
        Start a conversation below.
      </p>
    </div>

  </div>
</main>

<div class="composer-area">

  <div class="composer">

    <button class="icon" onclick="voice()">🎙️</button>

    <textarea
      id="input"
      placeholder="Ask Armira..."
      rows="1"
    ></textarea>

    <button
      class="send"
      id="send"
      onclick="sendMessage()"
    >➤</button>

  </div>

  <div class="note">
    Armira can make mistakes. Check important information.
  </div>

</div>

</div>

<script>
const input = document.getElementById("input");
const send = document.getElementById("send");
const chat = document.getElementById("chat");
const chatbox = document.getElementById("chatbox");

input.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function removeWelcome() {
  const w = document.getElementById("welcome");
  if (w) w.remove();
}

function addMessage(text, type) {
  removeWelcome();

  const row = document.createElement("div");
  row.className = "message " + type;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  row.appendChild(bubble);
  chatbox.appendChild(row);

  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
  const message = input.value.trim();

  if (!message || send.disabled) return;

  input.value = "";
  addMessage(message, "user");

  send.disabled = true;

  removeWelcome();

  const loading = document.createElement("div");
  loading.className = "message ai";
  loading.id = "loading";

  const loadingBubble = document.createElement("div");
  loadingBubble.className = "bubble typing";
  loadingBubble.textContent = "Armira is thinking...";

  loading.appendChild(loadingBubble);
  chatbox.appendChild(loading);

  chat.scrollTop = chat.scrollHeight;

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

    const oldLoading = document.getElementById("loading");
    if (oldLoading) oldLoading.remove();

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

    const oldLoading = document.getElementById("loading");
    if (oldLoading) oldLoading.remove();

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
    alert("Voice input is not supported here.");
    return;
  }

  const recognition = new Recognition();

  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = function(event) {
    input.value =
      event.results[0][0].transcript;

    input.focus();
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
