import express from "express";
import dotenv from "dotenv";
import { webSearch } from "./searchTool.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const tools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web when the user asks for current, recent, factual, or web-based information.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query."
          }
        },
        required: ["query"],
        additionalProperties: false
      }
    }
  }
];

async function callBrain(messages) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY_1}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-ultra-550b-a55b:free",
        messages,
        tools,
        tool_choice: "auto"
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "OpenRouter request failed"
    );
  }

  return data;
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const messages = [
      {
        role: "system",
        content:
          "You are an AI assistant. Use web_search when current or web-based information is needed. After receiving search results, answer the user's question clearly and accurately."
      },
      {
        role: "user",
        content: message
      }
    ];

    let brainResponse = await callBrain(messages);
    let assistantMessage = brainResponse.choices?.[0]?.message;

    if (!assistantMessage) {
      throw new Error("Brain returned no message.");
    }

    messages.push(assistantMessage);

    if (assistantMessage.tool_calls?.length) {
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.function?.name !== "web_search") {
          continue;
        }

        let args;

        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch {
          throw new Error("Invalid search tool arguments.");
        }

        const results = await webSearch(args.query);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(results)
        });
      }

      brainResponse = await callBrain(messages);

      assistantMessage = brainResponse.choices?.[0]?.message;

      if (!assistantMessage) {
        throw new Error("Brain returned no final answer.");
      }
    }

    res.json({
      answer: assistantMessage.content || "No answer received."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message || "Something went wrong."
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "AI Web Agent is running 🤖"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
