import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import img from '../../../api/uploads/sg.png'
import { toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaShippingFast,
  FaUndo,
  FaLock,
  FaStar,
  FaRulerCombined,
} from "react-icons/fa";

const ProductDetails = () => {
  const { productId } = useParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username,setusername] = useState("")
  const [useremail,setuseremail] = useState("")
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    axios.get(`https://textile-mern.onrender.com/reviews/average/${productId}`)
      .then((res) => setAverageRating(res.data.averageRating))
      .catch((err) => console.error("Error fetching avg rating:", err));
  }, [productId]);
  useEffect(() => {
    const status = localStorage.getItem("islogin") === "true";
    setIsLoggedIn(status);
  }, []);

  useEffect(() => {
    const username = localStorage.getItem("username");
    setusername(username);
  }, []);

  useEffect(() => {
    const useremail = localStorage.getItem("useremail");
    setuseremail(useremail);
  }, []);


  
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    pincode: "",
  });

  useEffect(() => {
    axios
      .get(`https://textile-mern.onrender.com/products/${productId}`)
      .then((response) => {
        const productData = response.data;
        const formattedProduct = {
          id: productData._id,
          name: productData.title,
          description: productData.description,
          price: productData.price,
          originalPrice: productData.originalPrice || productData.price + 100,
          availability:productData.availableStock > 0 ? "In Stock" : "Out of Stock",
          availableStock: productData.availableStock,
          rating: productData.rating || 4,
          reviews: productData.reviews || 10,
          image: productData.image,
        };
        setProduct(formattedProduct);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching product:", error);
        setLoading(false);
      });
  }, [productId]);

  if (loading) return <div className="text-center text-lg font-semibold">Loading...</div>;
  if (!product) return <div className="text-center text-lg font-semibold">Product not found</div>;

  // const handleAddToCart = () => {
  //   const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
  //   const existingItem = cartItems.find((item) => item.id === product.id);

  //   if (existingItem) {
  //     existingItem.quantity += parseInt(quantity);
  //   } else {
  //     cartItems.push({ ...product, quantity: parseInt(quantity) });
  //   }

  //   localStorage.setItem("cartItems", JSON.stringify(cartItems));
  //   alert(`Added ${quantity} meter(s) of ${product.name} to cart!`);
  // };

 
  const handleAddToCart = (product, quantity) => {
    if (!isLoggedIn) {
      toast.warn("⚠️ Please log in to add items to cart!", { transition: Bounce });
      return;
    }

    if (parseInt(quantity) > product.availableStock) {
      toast.error("🚫 Requested quantity exceeds available stock!", { transition: Bounce });
      return;
    }

    const cartKey = `cartItems_${useremail}`;
    const cartItems = JSON.parse(localStorage.getItem(cartKey)) || [];
    const existingItem = cartItems.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity + parseInt(quantity) > product.availableStock) {
        toast.error("❗ Adding this quantity will exceed available stock!", { transition: Bounce });
        return;
      }
      existingItem.quantity += parseInt(quantity);
    } else {
      cartItems.push({ ...product, quantity: parseInt(quantity) });
    }

    localStorage.setItem(cartKey, JSON.stringify(cartItems));
    toast.success(`🛒 Added ${quantity} meter(s) of ${product.name} to cart!`, { transition: Bounce });
    
  };
  
  const handleUserInput = (e) => {
    setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
  };


  const handleOrderSubmit = async (e) => {
    e.preventDefault();
  
    const totalAmount = product.price * quantity;
  
    const options = {
      key: "rzp_test_4rdgre6savrrmw", // ✅ Replace with your actual Razorpay key
      amount: totalAmount * 100,
      currency: "INR",
      name: "Kumar Textiles",
      description: "Order Payment",
      handler: async function (response) {
        try {
          // 1. Save payment info
          await axios.post("https://textile-mern.onrender.com/userprod/create", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            // razorpay_signature: response.razorpay_signature,
            name: username,
            email: useremail,
            shippingaddress: userDetails.address,
            phone: userDetails.phone,
            pincode: userDetails.pincode,
            orderedProducts: [
              {
                productID: product.id,
                quantity: parseInt(quantity),
              },
            ],
          });
  
          // 2. Save order details
          // await axios.post("https://textile-mern.onrender.com/userprod/create", {
          //   name: username,
          //   email: useremail,
          //   shippingaddress: userDetails.address,
          //   phone: userDetails.phone,
          //   pincode: userDetails.pincode,
          //   orderedProducts: [
          //     {
          //       productID: product.id,
          //       quantity: parseInt(quantity),
          //     },
          //   ],
          // });
  
          toast.success(`✅ Order placed for ${quantity} meter(s) of ${product.name}!`, { transition: Bounce });

          setShowForm(false);
        } catch (error) {
          console.error("Error saving payment or order:", error);
          toast.error("⚠️ Payment succeeded, but order failed. Please contact support.", { transition: Bounce });

        }
      },
      prefill: {
        name: username,
        email: useremail,
        contact: userDetails.phone,
      },
      theme: {
        color: "#f37254",
      },
    };
  
    const rzp = new window.Razorpay(options);
    rzp.open();
  };
  
  const handleBuyNow = () => {
    if (parseInt(quantity) > product.availableStock) {
      toast.error("🚫 Requested quantity exceeds available stock!", { transition: Bounce });
      return;
    }
  
    if (isLoggedIn) {
      setShowForm(true);
    } else {
      toast.warn("⚠️ Please login to proceed with purchase", { transition: Bounce });
    }
  };
  

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div>
          <img
            src={`https://textile-mern.onrender.com/uploads/${product.image}`}
            alt={product.name}
            className="w-full max-h-[500px] object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-lg text-gray-600 my-2">{product.description}</p>

          <p className="text-xl text-gray-700 my-2">
            <span className="line-through mr-2 text-red-500">₹{product.originalPrice}</span>
            <span className="text-green-600 font-bold">₹{product.price}</span>
          </p>

          {/* <p className={`my-2 font-semibold ${product.availability === "Out of Stock" ? "text-red-500" : "text-green-600"}`}>
            {product.availability}
          </p> */}
<p className="text-sm text-gray-700 mt-1">
  {product.availableStock} meter(s) remaining
</p>


<div className="flex items-center space-x-1 text-yellow-500">
  {Array.from({ length: 5 }).map((_, i) => (
    <FaStar key={i} className={i < averageRating ? "text-yellow-500" : "text-gray-300"} />
  ))}
  <span className="text-gray-600 ml-2">({averageRating} / 5)</span>
</div>

          <div className="my-4">
            <label htmlFor="quantity" className="block font-semibold">Quantity</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              min="1"
              onChange={(e) => setQuantity(e.target.value)}
              className="border p-2 rounded w-24"
            />
          </div>

          <div className="flex space-x-4">
          <button
  onClick={() => handleAddToCart(product, quantity)}
  disabled={product.availableStock <= 0}
  className={`px-4 py-2 rounded w-1/2 text-white 
    ${product.availableStock <= 0 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
>
  ADD TO CART
</button>


            <button
  onClick={handleBuyNow}
  disabled={product.availableStock <= 0}
  className={`px-4 py-2 rounded w-1/2 text-white 
    ${product.availableStock <= 0 ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
>
  BUY IT NOW
</button>

          </div>

          <div className="mt-6 space-y-2">
            <p className="flex items-center text-green-600">
              <FaShippingFast className="mr-2" /> Free delivery within 3-5 days
            </p>
            <p className="flex items-center">
              <FaLock className="mr-2" /> Secure payment & checkout
            </p>
            <p className="flex items-center">
              <FaUndo className="mr-2" /> 7-day easy returns
            </p>
          </div>

          <button
  className="text-blue-600 flex items-center mt-4"
  onClick={() => setShowSizeGuide(true)}
>
  <FaRulerCombined className="mr-2" /> Size Guide
</button>
        </div>
      </div>
     

      {/* Popup Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-2 text-red-500 font-bold"
            >
              X
            </button>
            <h2 className="text-2xl font-bold mb-4">Enter Delivery Details</h2>
            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={username}
                // onChange={handleUserInput}
                className="border p-2 w-full rounded"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={useremail}
                // onChange={handleUserInput}
                className="border p-2 w-full rounded"
                required
              />
              <input
                type="text"
                name="address"
                placeholder="Shipping Address"
                value={userDetails.address}
                onChange={handleUserInput}
                className="border p-2 w-full rounded"
                required
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                value={userDetails.phone}
                onChange={handleUserInput}
                className="border p-2 w-full rounded"
                required
              />
              <input
                type="text"
                name="pincode"
                placeholder="Pincode"
                value={userDetails.pincode}
                onChange={handleUserInput}
                className="border p-2 w-full rounded"
                required
              />
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded w-full">
                Confirm Purchase
              </button>
            </form>
          </div>
        </div>
      )}
       {showSizeGuide && (
  <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
    <div className="relative bg-white p-4 rounded shadow-lg max-w-xl">
      <button
        onClick={() => setShowSizeGuide(false)}
        className="absolute top-2 right-2 text-red-500 font-bold text-lg"
      >
        X
      </button>
      <img
        src={img} // Replace with your actual image path
        alt="Size Guide"
        className="w-full h-auto rounded"
      />
    </div>
  </div>
)}
    </div>
  );
};

export default ProductDetails;
