import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (password === "admin123"){
      localStorage.setItem("isAdmin", "true");
      navigate("/admin");
    } else {
      toast.error("Invalid password!",{transition: Bounce});
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
      <input
        type="password"
        placeholder="Enter Admin Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 w-full mb-4"
      />
      <button onClick={handleLogin} className="bg-blue-600 text-white px-6 py-2 rounded w-full">
        Login
      </button>
    </div>
  );
};

export default AdminLogin;
