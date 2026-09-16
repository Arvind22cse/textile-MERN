/**
 * TextileAI Agent
 *
 * Supports two OpenAI-compatible AI providers:
 *  - Groq  (api key starts with 'gsk_') → https://api.groq.com/openai/v1
 *  - xAI Grok (api key starts with 'xai-') → https://api.x.ai/v1
 *
 * Set AI_API_KEY and AI_MODEL in .env — the provider is auto-detected.
 * Orchestrates multi-step tool calls, collects product results,
 * and returns a structured response.
 */

const OpenAI = require("openai");
const { SYSTEM_PROMPT } = require("./prompts");
const { TOOL_DEFINITIONS, executeTool } = require("./tools");

// Auto-detect provider from API key prefix
const AI_API_KEY = process.env.AI_API_KEY || process.env.GROK_API_KEY || "";
const isGroq = AI_API_KEY.startsWith("gsk_");
const BASE_URL = isGroq ? "https://api.groq.com/openai/v1" : "https://api.x.ai/v1";
const DEFAULT_MODEL = isGroq ? "llama-3.3-70b-versatile" : "grok-3-latest";
const MODEL = process.env.AI_MODEL || process.env.GROK_MODEL || DEFAULT_MODEL;

console.log(`[TextileAI] Using ${isGroq ? "Groq" : "xAI Grok"} API → model: ${MODEL}`);

const aiClient = new OpenAI({
  apiKey: AI_API_KEY,
  baseURL: BASE_URL,
});

const MAX_TOOL_ROUNDS = 5; // Prevent infinite tool-call loops

/**
 * Run the TextileAI agent for a single conversation turn.
 *
 * @param {string} userMessage - The current user message
 * @param {Array}  history     - Previous conversation messages [{role, content}]
 * @param {string|null} userId - Authenticated user's MongoDB ID (from JWT, server-side)
 * @param {object|null} currentProduct - Product context from the current page (frontend hint)
 * @returns {{ response: string, products: Array, cartActions: Array }}
 */
async function runAgent({ userMessage, history = [], userId = null, currentProduct = null }) {
  // Build message array
  const messages = [];

  // Inject sanitized conversation history (last 20 messages max)
  const safeHistory = history.slice(-20).filter(
    (m) => m && typeof m.role === "string" && typeof m.content === "string"
  );
  messages.push(...safeHistory);

  // Build the user message, optionally including page context
  let userContent = userMessage.trim();
  if (currentProduct && currentProduct._id && currentProduct.title) {
    userContent = `[Currently viewing product: "${currentProduct.title}" (ID: ${currentProduct._id}, Price: ₹${currentProduct.price})]\n\n${userContent}`;
  }
  messages.push({ role: "user", content: userContent });

  // Collected products and cart actions from tool calls across all rounds
  const allProducts = [];
  const cartActions = [];

  let round = 0;
  let finalResponse = "";

  // Agentic loop: call Grok, handle tool calls, repeat
  while (round < MAX_TOOL_ROUNDS) {
    round++;

    let completion;
    try {
      completion = await aiClient.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        tools: TOOL_DEFINITIONS,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 1024,
      });
    } catch (apiErr) {
      console.error("[TextileAI] AI API error:", apiErr.message);
      throw new Error("AI service temporarily unavailable. Please try again.");
    }

    const choice = completion.choices[0];
    const message = choice.message;

    // Add assistant message to conversation
    messages.push(message);

    // If the model wants to call tools
    if (choice.finish_reason === "tool_calls" && message.tool_calls && message.tool_calls.length > 0) {
      // Execute each tool call in parallel
      const toolResults = await Promise.all(
        message.tool_calls.map(async (toolCall) => {
          const name = toolCall.function.name;
          let args = {};
          try {
            args = JSON.parse(toolCall.function.arguments || "{}");
          } catch {
            args = {};
          }

          console.log(`[TextileAI] Calling tool: ${name}`, args);
          const result = await executeTool(name, args, userId);

          // Collect products from search/detail results
          if (name === "search_products" && result.products) {
            allProducts.push(...result.products);
          }
          if (name === "get_product_details" && result.product) {
            allProducts.push(result.product);
          }
          if (name === "add_to_cart" && result.success && result.addToCart) {
            cartActions.push({ product: result.product, quantity: result.quantity });
          }

          return {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          };
        })
      );

      // Add tool results to conversation
      messages.push(...toolResults);
      // Continue loop to get next AI response
      continue;
    }

    // No tool calls — we have the final text response
    finalResponse = message.content || "";
    break;
  }

  // If loop exhausted without final text (shouldn't happen in practice)
  if (!finalResponse) {
    finalResponse = "I've gathered the information you need. Please see the results above.";
  }

  // Deduplicate products by _id
  const seen = new Set();
  const uniqueProducts = allProducts.filter((p) => {
    const id = String(p._id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return {
    response: finalResponse,
    products: uniqueProducts,
    cartActions,
  };
}

module.exports = { runAgent };
