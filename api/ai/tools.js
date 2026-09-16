/**
 * TextileAI Tool Definitions & Implementations
 * 
 * Two exports:
 *  - TOOL_DEFINITIONS: OpenAI-compatible function schema array (sent to Grok API)
 *  - executeTool(name, args, userId): server-side execution of each tool
 */

const mongoose = require("mongoose");
const Product = require("../models/Product.model");
const Review = require("../models/Review.js");
const Order = require("../models/Order.model");
const Cart = require("../models/Cart.model");

// Safe product fields to return — never expose internal metadata
const SAFE_PRODUCT_FIELDS = "_id title description image price availableStock color style material";

// Validate MongoDB ObjectId to prevent injection
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Escape regex special characters to prevent ReDoS
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Cap results to prevent huge payloads
const MAX_RESULTS = 12;

// ─── Tool Definitions (sent to Grok/OpenAI API) ──────────────────────────────

const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Search the Kumar Textiles product catalog. Use this whenever the customer asks to find, show, browse, or filter products. Supports keyword search across title/description, plus filters for material, color, style, price range, and stock status.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "General keyword search (e.g., 'cotton shirt', 'blue fabric')",
          },
          material: {
            type: "string",
            description: "Filter by material (e.g., 'cotton', 'silk', 'polyester', 'linen')",
          },
          color: {
            type: "string",
            description: "Filter by color (e.g., 'blue', 'red', 'navy', 'white')",
          },
          style: {
            type: "string",
            description: "Filter by style (e.g., 'formal', 'casual', 'traditional', 'checked')",
          },
          minPrice: {
            type: "number",
            description: "Minimum price in INR",
          },
          maxPrice: {
            type: "number",
            description: "Maximum price in INR",
          },
          inStockOnly: {
            type: "boolean",
            description: "If true, only return products with availableStock > 0",
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return (default 6, max 12)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_details",
      description:
        "Get complete details for a specific product by its ID. Use this when the customer asks about a specific product, or when you have a product ID and need full information.",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "The MongoDB ObjectId of the product",
          },
        },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_stock",
      description:
        "Check if a specific product has enough stock for the requested quantity. Use this before confirming availability to a customer.",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "The MongoDB ObjectId of the product",
          },
          quantity: {
            type: "number",
            description: "The quantity the customer wants to purchase",
          },
        },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_reviews",
      description:
        "Get customer reviews and average rating for a product. Use this when the customer asks about reviews, ratings, or what others think of a product.",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "The MongoDB ObjectId of the product",
          },
          limit: {
            type: "number",
            description: "Number of recent reviews to return (default 5, max 10)",
          },
        },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_cart",
      description:
        "Get the authenticated user's current shopping cart. Requires the user to be logged in. Use this when the customer asks 'what's in my cart', 'show my cart', etc.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_cart",
      description:
        "Add a product to the authenticated user's cart. ONLY use this when the user explicitly asks to add something (e.g., 'add this to cart', 'put 2 of these in my cart'). Do NOT call this just because you recommended a product.",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "The MongoDB ObjectId of the product to add",
          },
          quantity: {
            type: "number",
            description: "Number of units to add (default 1)",
          },
        },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_orders",
      description:
        "Get the authenticated user's order history. Requires the user to be logged in. Use this when the customer asks 'show my orders', 'what did I buy', 'my recent orders', etc.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of recent orders to return (default 5)",
          },
        },
        required: [],
      },
    },
  },
];

// ─── Tool Implementations ────────────────────────────────────────────────────

/**
 * TOOL 1: search_products
 * Searches MongoDB Product collection with flexible filters.
 */
async function search_products({ query, material, color, style, minPrice, maxPrice, inStockOnly, limit } = {}) {
  const filter = {};

  // Keyword search across title + description
  if (query && query.trim()) {
    const escaped = escapeRegex(query.trim());
    filter.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
      { material: { $regex: escaped, $options: "i" } },
      { color: { $regex: escaped, $options: "i" } },
      { style: { $regex: escaped, $options: "i" } },
    ];
  }

  if (material && material.trim()) {
    filter.material = { $regex: escapeRegex(material.trim()), $options: "i" };
  }
  if (color && color.trim()) {
    filter.color = { $regex: escapeRegex(color.trim()), $options: "i" };
  }
  if (style && style.trim()) {
    filter.style = { $regex: escapeRegex(style.trim()), $options: "i" };
  }
  if (typeof minPrice === "number") {
    filter.price = { ...filter.price, $gte: minPrice };
  }
  if (typeof maxPrice === "number") {
    filter.price = { ...filter.price, $lte: maxPrice };
  }
  if (inStockOnly === true) {
    filter.availableStock = { $gt: 0 };
  }

  const resultLimit = Math.min(typeof limit === "number" ? limit : 6, MAX_RESULTS);

  const products = await Product.find(filter).select(SAFE_PRODUCT_FIELDS).limit(resultLimit).lean();

  return {
    count: products.length,
    products,
  };
}

/**
 * TOOL 2: get_product_details
 * Returns full safe details for a single product.
 */
async function get_product_details({ productId }) {
  if (!productId || !isValidObjectId(productId)) {
    return { error: "Invalid product ID" };
  }

  const product = await Product.findById(productId).select(SAFE_PRODUCT_FIELDS).lean();
  if (!product) {
    return { error: "Product not found" };
  }

  return { product };
}

/**
 * TOOL 3: check_stock
 * Checks real-time stock availability for a given quantity.
 */
async function check_stock({ productId, quantity = 1 }) {
  if (!productId || !isValidObjectId(productId)) {
    return { error: "Invalid product ID" };
  }

  const product = await Product.findById(productId)
    .select("_id title availableStock price")
    .lean();

  if (!product) {
    return { error: "Product not found" };
  }

  const available = product.availableStock >= quantity;

  return {
    available,
    requestedQuantity: quantity,
    availableStock: product.availableStock,
    product: {
      _id: product._id,
      title: product.title,
      price: product.price,
    },
    message: available
      ? `✅ Yes, ${quantity} unit(s) of "${product.title}" are available (${product.availableStock} in stock).`
      : `❌ Only ${product.availableStock} unit(s) of "${product.title}" are available, but you requested ${quantity}.`,
  };
}

/**
 * TOOL 4: get_product_reviews
 * Fetches reviews and computes average rating from MongoDB.
 */
async function get_product_reviews({ productId, limit = 5 }) {
  if (!productId || !isValidObjectId(productId)) {
    return { error: "Invalid product ID" };
  }

  const reviewLimit = Math.min(typeof limit === "number" ? limit : 5, 10);

  const reviews = await Review.find({ productId })
    .select("review rating createdAt userId")
    .sort({ createdAt: -1 })
    .limit(reviewLimit)
    .lean();

  const allReviews = await Review.find({ productId }).select("rating").lean();
  const reviewCount = allReviews.length;
  const averageRating =
    reviewCount > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
      : 0;

  return {
    productId,
    reviewCount,
    averageRating: parseFloat(averageRating),
    recentReviews: reviews.map((r) => ({
      review: r.review,
      rating: r.rating,
      date: r.createdAt,
    })),
  };
}

/**
 * TOOL 5: get_my_cart
 * Returns the authenticated user's cart with populated product details.
 * userId is ALWAYS from verified JWT — never from AI arguments.
 */
async function get_my_cart({ }, userId) {
  if (!userId) {
    return { requiresAuth: true, message: "Please log in to view your cart." };
  }

  if (!isValidObjectId(userId)) {
    return { error: "Invalid user session" };
  }

  const cart = await Cart.findOne({ userID: new mongoose.Types.ObjectId(userId) })
    .populate({ path: "products.productID", select: "title price image availableStock color material style" })
    .lean();

  if (!cart || !cart.products || cart.products.length === 0) {
    return { empty: true, message: "Your cart is currently empty.", products: [], totalItems: 0, subtotal: 0 };
  }

  let subtotal = 0;
  let totalItems = 0;
  const items = cart.products
    .filter((p) => p.productID) // guard against deleted products
    .map((p) => {
      const lineTotal = (p.productID.price || 0) * (p.quantity || 1);
      subtotal += lineTotal;
      totalItems += p.quantity || 1;
      return {
        product: p.productID,
        quantity: p.quantity || 1,
        lineTotal,
      };
    });

  return {
    products: items,
    totalItems,
    subtotal,
    message: `You have ${totalItems} item(s) in your cart totalling ₹${subtotal.toLocaleString("en-IN")}.`,
  };
}

/**
 * TOOL 6: add_to_cart
 * Validates product existence and stock, then returns cart item data 
 * for the frontend to add to localStorage (existing cart system).
 * userId is ALWAYS from verified JWT — never from AI arguments.
 */
async function add_to_cart({ productId, quantity = 1 }, userId) {
  if (!userId) {
    return { requiresAuth: true, message: "Please log in to add items to your cart." };
  }

  if (!productId || !isValidObjectId(productId)) {
    return { error: "Invalid product ID" };
  }

  const qty = Math.max(1, Math.floor(quantity));

  const product = await Product.findById(productId)
    .select(SAFE_PRODUCT_FIELDS)
    .lean();

  if (!product) {
    return { error: "Product not found" };
  }

  if (product.availableStock < qty) {
    return {
      success: false,
      error: `Only ${product.availableStock} unit(s) available, but you requested ${qty}.`,
      availableStock: product.availableStock,
    };
  }

  // Return the product + quantity for the frontend to add to localStorage cart
  return {
    success: true,
    addToCart: true, // signal to frontend to add this item
    product,
    quantity: qty,
    message: `✅ Ready to add ${qty} unit(s) of "${product.title}" (₹${product.price} each) to your cart.`,
  };
}

/**
 * TOOL 7: get_my_orders
 * Returns the authenticated user's orders with populated product details.
 * userId is ALWAYS from verified JWT — never from AI arguments.
 */
async function get_my_orders({ limit = 5 } = {}, userId) {
  if (!userId) {
    return { requiresAuth: true, message: "Please log in to view your orders." };
  }

  if (!isValidObjectId(userId)) {
    return { error: "Invalid user session" };
  }

  const orderLimit = Math.min(typeof limit === "number" ? limit : 5, 20);

  const orders = await Order.find({ userID: new mongoose.Types.ObjectId(userId) })
    .populate({ path: "products.productID", select: "title price image" })
    .select("_id products amount status createdAt")
    .sort({ createdAt: -1 })
    .limit(orderLimit)
    .lean();

  if (!orders || orders.length === 0) {
    return { empty: true, message: "You don't have any orders yet.", orders: [] };
  }

  const safeOrders = orders.map((order) => ({
    orderId: order._id,
    status: order.status,
    amount: order.amount,
    date: order.createdAt,
    items: order.products
      .filter((p) => p.productID)
      .map((p) => ({
        title: p.productID.title,
        price: p.productID.price,
        quantity: p.quantity,
        image: p.productID.image,
      })),
  }));

  return {
    orderCount: safeOrders.length,
    orders: safeOrders,
    message: `Found ${safeOrders.length} recent order(s).`,
  };
}

// ─── Tool Dispatch (allowlist) ────────────────────────────────────────────────

const ALLOWED_TOOLS = {
  search_products,
  get_product_details,
  check_stock,
  get_product_reviews,
  get_my_cart,
  add_to_cart,
  get_my_orders,
};

/**
 * Execute a tool by name with validated arguments.
 * @param {string} name - Tool name (must be in allowlist)
 * @param {object} args - Tool arguments from AI
 * @param {string|null} userId - Verified user ID from JWT (null if anonymous)
 */
async function executeTool(name, args, userId) {
  const toolFn = ALLOWED_TOOLS[name];
  if (!toolFn) {
    return { error: `Unknown tool: ${name}` };
  }
  try {
    return await toolFn(args, userId);
  } catch (err) {
    console.error(`[TextileAI] Tool "${name}" error:`, err.message);
    return { error: "Tool execution failed. Please try again." };
  }
}

module.exports = { TOOL_DEFINITIONS, executeTool };
