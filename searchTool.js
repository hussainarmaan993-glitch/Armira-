export async function webSearch(query) {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: "basic",
      max_results: 5,
      include_answer: false
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
