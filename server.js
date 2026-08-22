import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY_1}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-ultra-550b-a55b:free",
        messages: [
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({
      answer: data.choices?.[0]?.message?.content || "No answer received."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "AI request failed."
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
