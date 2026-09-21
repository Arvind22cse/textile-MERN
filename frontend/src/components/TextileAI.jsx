import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast, Bounce } from "react-toastify";
import API_BASE from "../config";

// ─── Suggested starter prompts ────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  { emoji: "👕", text: "Find cotton shirts" },
  { emoji: "💰", text: "Products under ₹800" },
  { emoji: "🔵", text: "Show me blue products" },
  { emoji: "🛒", text: "What's in my cart?" },
  { emoji: "⭐", text: "Show highly rated products" },
  { emoji: "📦", text: "Show products in stock" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("token") || null;
}

function getUserEmail() {
  return localStorage.getItem("useremail") || "";
}

function isLoggedIn() {
  return localStorage.getItem("islogin") === "true";
}

function addToLocalCart(product, quantity) {
  const email = getUserEmail();
  if (!email) return false;
  const cartKey = `cartItems_${email}`;
  const cartItems = JSON.parse(localStorage.getItem(cartKey)) || [];
  const existing = cartItems.find((item) => item.id === product._id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cartItems.push({
      id: product._id,
      name: product.title,
      price: product.price,
      image: product.image,
      availableStock: product.availableStock,
      quantity,
    });
  }
  localStorage.setItem(cartKey, JSON.stringify(cartItems));
  return true;
}

// ─── Product Card Component (inside chat) ─────────────────────────────────────
function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  const imageUrl = product.image
    ? `${API_BASE}/uploads/${product.image}`
    : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-32 object-cover"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      )}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h4 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
          {product.title}
        </h4>
        <p className="text-green-600 font-bold text-base">
          ₹{product.price?.toLocaleString("en-IN")}
        </p>
        <div className="text-xs text-gray-500 space-y-0.5">
          {product.material && <p>🧵 {product.material}</p>}
          {product.color && <p>🎨 {product.color}</p>}
          {product.style && <p>✨ {product.style}</p>}
          <p className={product.availableStock > 0 ? "text-green-600" : "text-red-500"}>
            {product.availableStock > 0 ? `📦 ${product.availableStock} in stock` : "❌ Out of stock"}
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => navigate(`/product/${product._id}`)}
            className="flex-1 bg-gray-900 text-white text-xs py-1.5 px-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            View
          </button>
          <button
            onClick={() => onAddToCart(product)}
            disabled={product.availableStock <= 0}
            className={`flex-1 text-xs py-1.5 px-2 rounded-lg transition-colors ${
              product.availableStock > 0
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            + Cart
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, onAddToCart }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs mr-2 flex-shrink-0 mt-1">
          🧵
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm"
              : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm"
          }`}
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>
        {/* Product cards grid */}
        {!isUser && msg.products && msg.products.length > 0 && (
          <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
            {msg.products.map((p) => (
              <ProductCard key={p._id} product={p} onAddToCart={onAddToCart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs flex-shrink-0">
        🧵
      </div>
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
        <span className="text-xs text-gray-500 mr-1">TextileAI is thinking</span>
        <span className="textile-ai-dot" style={{ "--delay": "0s" }} />
        <span className="textile-ai-dot" style={{ "--delay": "0.2s" }} />
        <span className="textile-ai-dot" style={{ "--delay": "0.4s" }} />
      </div>
    </div>
  );
}

// ─── Main TextileAI Component ─────────────────────────────────────────────────
const TextileAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get current product context if on product detail page
  const getCurrentProduct = useCallback(() => {
    const match = location.pathname.match(/^\/product\/([a-f0-9]{24})$/i);
    if (!match) return null;
    // Basic context — agent will verify from DB
    return { _id: match[1] };
  }, [location.pathname]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Animate panel open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setIsOpen(false), 250);
  };

  // Handle adding product to localStorage cart
  const handleAddToCart = (product) => {
    if (!isLoggedIn()) {
      toast.warn("⚠️ Please log in to add items to cart!", { transition: Bounce });
      return;
    }
    const success = addToLocalCart(product, 1);
    if (success) {
      toast.success(`🛒 Added "${product.title}" to cart!`, { transition: Bounce });
    }
  };

  // Build conversation history for API (exclude product cards to save tokens)
  const buildHistory = () => {
    return messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput("");
    const userMsg = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const token = getToken();
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const { data } = await axios.post(
        `${API_BASE}/api/ai/chat`,
        {
          message: msg,
          history: buildHistory(),
          currentProduct: getCurrentProduct(),
        },
        { headers, timeout: 60000 }
      );

      // Handle cart actions from AI (add_to_cart tool responses)
      if (data.cartActions && data.cartActions.length > 0) {
        data.cartActions.forEach(({ product, quantity }) => {
          if (!isLoggedIn()) {
            toast.warn("⚠️ Please log in to add items to cart!", { transition: Bounce });
            return;
          }
          addToLocalCart(product, quantity);
          toast.success(`🛒 Added ${quantity}x "${product.title}" to cart!`, { transition: Bounce });
        });
      }

      const aiMsg = {
        role: "assistant",
        content: data.response,
        products: data.products || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorContent =
        err.response?.data?.message ||
        (err.code === "ECONNABORTED" ? "Request timed out. Please try again." : "Something went wrong. Please try again.");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${errorContent}`, products: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestion = (text) => {
    sendMessage(text);
  };

  return (
    <>
      {/* Inject dot animation CSS */}
      <style>{`
        .textile-ai-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6366f1;
          animation: textile-ai-bounce 1.2s infinite ease-in-out;
          animation-delay: var(--delay, 0s);
        }
        @keyframes textile-ai-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        .textile-ai-panel {
          transition: opacity 0.25s ease, transform 0.25s ease;
        }
        .textile-ai-panel.hidden-panel {
          opacity: 0;
          transform: translateY(16px) scale(0.97);
          pointer-events: none;
        }
        .textile-ai-panel.visible-panel {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .textile-ai-fab {
          animation: textile-ai-pulse 3s infinite;
        }
        @keyframes textile-ai-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Floating Action Button */}
      {!isOpen && (
        <button
          id="textile-ai-fab"
          onClick={handleOpen}
          className="textile-ai-fab fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-full shadow-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold text-sm"
          aria-label="Open TextileAI Shopping Assistant"
        >
          <span className="text-lg">🧵</span>
          TextileAI
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`textile-ai-panel ${isVisible ? "visible-panel" : "hidden-panel"} fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-gray-50 rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden`}
          style={{ height: "560px", maxHeight: "calc(100vh - 5rem)" }}
          role="dialog"
          aria-label="TextileAI Chat"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-lg">
                🧵
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">TextileAI</h3>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                  <span className="text-indigo-100 text-xs">Online · Kumar Textiles</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white text-opacity-80 hover:text-opacity-100 text-xl leading-none p-1 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {messages.length === 0 ? (
              /* Welcome state */
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-2">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                  🧵
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-base">Hi! I'm TextileAI</h4>
                  <p className="text-gray-500 text-sm mt-1">
                    Your shopping assistant for Kumar Textiles. Try asking me:
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {SUGGESTED_PROMPTS.map((s) => (
                    <button
                      key={s.text}
                      onClick={() => handleSuggestion(s.text)}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-left text-xs text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-150 shadow-sm"
                    >
                      <span className="mr-1.5">{s.emoji}</span>
                      {s.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Conversation */
              <>
                {messages.map((msg, i) => (
                  <MessageBubble
                    key={i}
                    msg={msg}
                    onAddToCart={handleAddToCart}
                  />
                ))}
                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex gap-2 items-end bg-gray-100 rounded-xl px-3 py-2">
              <textarea
                ref={inputRef}
                id="textile-ai-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything… (Enter to send)"
                disabled={loading}
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-800 resize-none outline-none placeholder-gray-400 max-h-24 overflow-y-auto leading-relaxed"
                style={{ minHeight: "24px" }}
              />
              <button
                id="textile-ai-send"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  loading || !input.trim()
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90"
                }`}
                aria-label="Send message"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-1.5">
              Shift+Enter for new line · Powered by Grok
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default TextileAI;
