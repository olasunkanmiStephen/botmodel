import { tavily } from "@tavily/core";

const client = tavily({
    apiKey: process.env.TAVILY_API_KEY
})


export async function webSearch(query) {
    try {

        const response = await client.search(query);
        
        if (response.results?.length > 0) {
            return response.results.slice(0, 3).map((r) => ({
                title: r.title,
                link: r.link,
                snippet: r.snippet,
            }))
        }

        return [{ title: "No results found", link: null, snippet: "" }]
    } catch (error) {
        console.error("Web search error:", err);
        return [{ 
            title: "Search failed", link: null,
            snippet: err.message        }]
    }
}
