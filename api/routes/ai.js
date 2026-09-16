/**
 * TextileAI Chat API Route
 * POST /api/ai/chat
 * 
 * Public endpoint (optional auth):
 *  - Anonymous users can search products, view details, check stock, read reviews
 *  - Authenticated users additionally get cart & order access
 */

const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { runAgent } = require("../ai/agent");

// ─── Simple in-memory rate limiter ───────────────────────────────────────────
// Limits: 30 requests per minute per IP
const rateLimitMap = new Map();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_WINDOW_MS;
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count <= RATE_LIMIT;
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

// ─── Optional JWT auth (never blocks the request, just enriches it) ───────────
function optionalAuth(req) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    if (!token) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    return payload.uid || null;
  } catch {
    return null; // Invalid/expired token — treat as anonymous
  }
}

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
router.post("/chat", async (req, res) => {
  // Rate limiting
  const clientIp = req.ip || req.connection.remoteAddress || "unknown";
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      status: "error",
      message: "Too many requests. Please slow down and try again in a minute.",
    });
  }

  const { message, history = [], currentProduct = null } = req.body;

  // Validate message
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ status: "error", message: "Message is required." });
  }
  if (message.length > 1000) {
    return res.status(400).json({ status: "error", message: "Message is too long (max 1000 characters)." });
  }

  // Validate history
  if (!Array.isArray(history)) {
    return res.status(400).json({ status: "error", message: "History must be an array." });
  }

  // Get authenticated user ID from JWT (if provided)
  const userId = optionalAuth(req);

  try {
    const { response, products, cartActions } = await runAgent({
      userMessage: message.trim(),
      history,
      userId,
      currentProduct: currentProduct || null,
    });

    return res.json({
      status: "ok",
      response,
      products,
      cartActions,
      authenticated: !!userId,
    });
  } catch (err) {
    console.error("[TextileAI Route] Error:", err.message);

    // Never expose internal errors to client
    const clientMessage = err.message.includes("AI service")
      ? err.message
      : "I'm having trouble right now. Please try again in a moment.";

    return res.status(500).json({
      status: "error",
      message: clientMessage,
    });
  }
});

module.exports = router;
