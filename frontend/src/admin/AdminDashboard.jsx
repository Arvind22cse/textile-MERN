import React from "react";
import { Link } from "react-router-dom";
import video from "../assets/vid.mp4";
const AdminDashboard = () => {
  return (
    <section className="bg-gray-100 min-h-screen flex items-center justify-center p-6">
      <div className="max-w-6xl w-full bg-white shadow-lg rounded-lg flex flex-col md:flex-row overflow-hidden">
        {/* Text Section */}
        <div className="md:w-1/2 p-8 flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold mb-4 text-gray-800">
            Admin Dashboard
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Welcome back, Admin! Manage your products, track orders, and keep the operations smooth at Kumar Textiles.
          </p>
          <div className="flex gap-4">
            <Link
              to="/admin/orders"
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
            >
              Manage Orders
            </Link>
            <Link
              to="/admin/products"
              className="bg-yellow-600 text-white px-6 py-3 rounded hover:bg-yellow-700"
            >
              Manage Products
            </Link>
            <Link
              to="/admin/req"
              className="bg-yellow-600 text-white px-6 py-3 rounded hover:bg-yellow-700"
            >
              View Requests
            </Link>
          </div>
        </div>

        {/* Image Section */}
        <div className="md:w-1/2">
        <video
            className="w-full h-full object-cover"
            src={video}
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      </div>
    </section>
  );
};

export default AdminDashboard;
