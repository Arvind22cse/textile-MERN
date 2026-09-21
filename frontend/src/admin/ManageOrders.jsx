import React, { useEffect, useState } from "react";
import API_BASE from "../config";

const AdminUserOrders = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/userprod/getuser`);
        const data = await res.json();
        console.log("All user orders:", data);
        setUsers(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch user orders", err);
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">All User Orders</h2>
      {users.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, idx) => (
            <div
              key={idx}
              className="border rounded-lg shadow-md p-4 bg-white space-y-4"
            >
              {/* User Info */}
              <div>
                <h3 className="text-xl font-semibold mb-1">{user.name}</h3>
                <p className="text-sm text-gray-600">📧 {user.email}</p>
                <p className="text-sm text-gray-600">📞 {user.phone}</p>
                <p className="text-sm text-gray-600">📍 {user.shippingaddress}</p>
                <p className="text-sm text-gray-600">🏷️ Pincode: {user.pincode}</p>
                {/* <p className="text-sm text-gray-600">razorpay_order_id:{user.razorpay_order_id}</p> */}
                <p className="text-sm text-gray-600">razorpay_payment_id:{user.razorpay_payment_id}</p>
                {user.razorpay_payment_id ? (
  <p className="text-sm text-green-600 font-semibold">✅ Payment Successful</p>
) : (
  <p className="text-sm text-red-600 font-semibold">❌ Payment Not Completed</p>
)}

              </div>

              {/* Ordered Products */}
              <div>
                <h4 className="font-bold mb-2">🛒 Ordered Products:</h4>
                {user.orderedProducts.map((product, i) => {
                  const p = product.productID;
                  return (
                    <div
                      key={i}
                      className="border p-3 rounded mb-2 space-y-2 bg-gray-50"
                    >
                      <div className="flex items-start gap-4">
                        {p?.image && (
                          <img
                            src={`${API_BASE}/uploads/${p.image}`}
                            alt={p?.title}
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                        <div>
                          <h5 className="text-lg font-semibold">{p?.title}</h5>
                          <p className="text-sm text-gray-700">{p?.description}</p>
                          <p className="text-sm text-gray-600">Color: {p?.color}</p>
                          <p className="text-sm text-gray-600">Style: {p?.style}</p>
                          <p className="text-sm text-gray-600">Material: {p?.material}</p>
                          <p className="text-sm text-gray-600">Available Stock: {p?.availableStock}</p>
                          <p className="text-sm text-gray-800 font-medium mt-1">
                            🛍️ Quantity Ordered: {product.quantity}
                          </p>
                          <p className="text-sm text-green-700 font-semibold">
                            ₹ Price: {product.quantity*p?.price}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUserOrders;
