import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const Orders = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
const [selectedProduct, setSelectedProduct] = useState(null);
const [selectedUser, setSelectedUser] = useState(null);
const [quantityInput, setQuantityInput] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        const loggedInUser = JSON.parse(localStorage.getItem("user")); // or your login key
        if (!loggedInUser?.email) {
          console.error("User not logged in");
          return;
        }
  
        const response = await axios.get(`https://textile-mern.onrender.com/userprod/orders/${loggedInUser.email}`);
        setUsers(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user orders:", error);
      }
    };
  
    fetchUserOrders();
  }, []);
  useEffect(() => {
    if (showModal) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  
    // Clean up in case component unmounts while modal is open
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [showModal]);
  

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
                            src={`https://textile-mern.onrender.com/uploads/${p.image}`}
                            alt={p?.title}
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                        <div>
                          <h5 className="text-lg font-semibold">{p?.title}</h5>
                          {/* <p className="text-sm text-gray-700">{p?.description}</p> */}
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
                      <button
  onClick={() =>
    navigate("/review", {
      state: {
        product: p,
        userId: user._id,
        // orderId: user._id, // or actual order ID if available
      },
    })
  }
  className="mt-2 px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
>
  ✍️ Give Review
</button>
<br/>

<button
  onClick={() => {
    setSelectedProduct(p);
    setSelectedUser(user);
    setShowModal(true);
  }}
  className="mt-2 px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
>
  🛒 Request More Order
</button>

<br />

{showModal && (
  <div className="fixed inset-0 mt-10 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Request More Quantity</h2>

      <input
        type="number"
        min="1"
        value={quantityInput}
        onChange={(e) => setQuantityInput(e.target.value)}
        placeholder="Enter quantity"
        className="w-full p-2 border rounded mb-4"
      />

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            if (!quantityInput || isNaN(quantityInput)) {
              toast.error("Please enter a valid number", { transition: Bounce });
              return;
            }

            try {
              const res = await axios.post("https://textile-mern.onrender.com/request/request-quantity", {
                userId: selectedUser._id,
                productId: selectedProduct._id,
                orderId: selectedUser._id,
                requestedQuantity: parseInt(quantityInput),
              });

              if (res.status === 201) {
                toast.success("Request submitted successfully!", { transition: Bounce });
                setShowModal(false);
                setQuantityInput("");
              } else {
                toast.error("Request failed: " + res.data.message, { transition: Bounce });
              }
            } catch (err) {
              console.error("Request failed:", err);
              toast.error("Failed to submit request.", { transition: Bounce });
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </div>
    </div>
  </div>
)}


<button
  onClick={async () => {
    try {
      const confirmDelete = window.confirm("Are you sure you want to cancel this order?");
      if (!confirmDelete) return;

      await axios.delete(`https://textile-mern.onrender.com/userprod/delete/${user._id}`);
      setUsers(users.filter((u) => u._id !== user._id));
      toast.success("Order cancelled successfully",{transition: Bounce});
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to cancel the order",{transition: Bounce});
    }
  }}
  className="mt-2 ml-2 px-4 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
>
  ❌ Cancel Payment
</button>

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

export default Orders;
