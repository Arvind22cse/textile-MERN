import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const Reqquantity = () => {
  const location = useLocation();
  const { product, userId, orderId } = location.state;

  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (quantity <= 0) {
      toast.warn("Please enter a valid quantity greater than 0.",{transition: Bounce});
      return;
    }

    console.log("Sending requested quantity:", {
      productId: product?._id,
      userId,
      orderId,
      quantity,
    });

    fetch("https://textile-mern.onrender.com/requested-quantity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product._id,
        userId,
        orderId,
        quantity,
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          toast.success("✅ Quantity submitted successfully!",{transition: Bounce});
        } else {
          const error = await res.json();
          console.error("❌ Submission error:", error);
          toast.error("Failed to submit quantity: " + (error?.error || "Unknown error"),{transition: Bounce});
        }
      })
      .catch((err) => {
        console.error("Network error:", err);
        toast.error("Network error: " + err.message,{transition: Bounce});
      });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Request Quantity: {product.title}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block font-medium text-lg mb-1">Enter Required Quantity:</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full border p-2 rounded"
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default Reqquantity;
