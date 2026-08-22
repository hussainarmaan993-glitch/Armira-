const SYSTEM_PROMPT = `
You are Armira, an AI web assistant.

Use the web_search tool when the user needs:
- current information
- recent news
- live/up-to-date facts
- information that should be verified from the web

After receiving search results, use them to answer clearly.
Do not claim that you searched if the search tool was not used.
`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web and return relevant results.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The web search query."
          }
        },
        required: ["query"],
        additionalProperties: false
      }
    }
  }
];

async function askBrain(messages, env) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY_1}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-ultra-550b-a55b:free",
        messages,
        tools: TOOLS,
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

async function webSearch(query, env) {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      api_key: env.TAVILY_API_KEY,
      query,
      search_depth: "basic",
      max_results: 5
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.detail || data?.error || "Tavily search failed"
    );
  }

  return (data.results || []).map((result) => ({
    title: result.title,
    url: result.url,
    content: result.content
  }));
}

async function handleChat(request, env) {
  const body = await request.json();
  const userMessage = body?.message?.trim();

  if (!userMessage) {
    return Response.json(
      { error: "Message is required." },
      { status: 400 }
    );
  }

  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT
    },
    {
      role: "user",
      content: userMessage
    }
  ];

  let result = await askBrain(messages, env);
  let assistant = result.choices?.[0]?.message;

  if (!assistant) {
    throw new Error("No response from Brain.");
  }

  messages.push(assistant);

  if (assistant.tool_calls?.length) {
    for (const toolCall of assistant.tool_calls) {
      if (toolCall.function?.name !== "web_search") continue;

      const args = JSON.parse(toolCall.function.arguments);
      const results = await webSearch(args.query, env);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(results)
      });
    }

    result = await askBrain(messages, env);
    assistant = result.choices?.[0]?.message;
  }

  return Response.json({
    answer: assistant?.content || "No answer received."
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        return await handleChat(request, env);
      } catch (error) {
        console.error(error);

        return Response.json(
          { error: error.message || "Something went wrong." },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
