import React, { useEffect, useState } from "react";
import axios from "axios";

function Managereq() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get("https://textile-mern.onrender.com/request/get-requests");
        setRequests(res.data);
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">🛒 User Order Requests</h2>
      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req, index) => {
            const user = req.userId;
            const product = req.productId;
            return (
              <div
                key={index}
                className="bg-white shadow-md rounded-lg p-5 border hover:shadow-lg transition"
              >
                <h3 className="text-xl font-bold text-blue-800 mb-2">
                  {user?.name}
                </h3>
                <p className="text-sm text-gray-600 mb-1">📧 {user?.email}</p>
                <p className="text-sm text-gray-600 mb-1">📞 {user?.phone}</p>
                <p className="text-sm text-gray-600 mb-1">📍 {user?.shippingaddress}</p>
                <p className="text-sm text-gray-600 mb-3">🏷️ Pincode: {user?.pincode}</p>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-md font-semibold mb-2 text-gray-800">🧾 Product Info</h4>
                  <p className="text-gray-700 font-medium">🧢 {product?.title}</p>
                  <p className="text-gray-600">📦 Requested Quantity: 
                    <span className="font-semibold text-blue-700 ml-1">{req.requestedQuantity}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Managereq;
