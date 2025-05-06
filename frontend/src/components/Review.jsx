import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const ReviewPage = () => {
  const location = useLocation();
  const { product, userId, orderId } = location.state;

  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const maxStars = 5;

  const handleSubmit = (e) => {
    e.preventDefault();
    const review = e.target.review.value;

    if (selectedRating === 0) {
      alert("Please select a rating before submitting.");
      return;
    }

    console.log("Sending review:", {
      productId: product?._id,
      userId,
      orderId,
      review,
      rating: selectedRating,
    });

    fetch("https://textile-mern.onrender.com/reviews/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product._id,
        userId,
        orderId,
        review,
        rating: selectedRating,
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          alert("✅ Review submitted!");
        } else {
          const error = await res.json();
          console.error("❌ Review submission error:", error);
          alert("Failed to submit review: " + (error?.error || "Unknown error"));
        }
      })
      .catch((err) => {
        console.error("Network error:", err);
        alert("Network error: " + err.message);
      });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Review: {product.title}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          name="review"
          rows="4"
          className="w-full border p-2 rounded"
          placeholder="Write your review..."
          required
        />

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-semibold">Rating:</span>
          {[...Array(maxStars)].map((_, i) => {
            const star = i + 1;
            const isActive = (hoverRating || selectedRating) >= star;

            return (
              <span
                key={star}
                onClick={() => setSelectedRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className={`text-4xl cursor-pointer transition-colors duration-200 ${
                  isActive ? "text-yellow-400" : "text-gray-300"
                }`}
              >
                {isActive ? "★" : "☆"}
              </span>
            );
          })}
          <span className="ml-2 text-gray-600">
            ({selectedRating} / {maxStars})
          </span>
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Submit Review
        </button>
      </form>
    </div>
  );
};

export default ReviewPage;
