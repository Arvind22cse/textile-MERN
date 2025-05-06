import React from "react";
import { Route, Routes } from "react-router-dom";
import ProductsPage from "./components/ProductsPage";
import ProductDetails from "./components/ProductDetails";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import Orders from "./components/Orders";
import Navbar from "./components/Navbar";
import AdminDashboard from "./admin/AdminDashboard";
import ManageOrders from "./admin/ManageOrders";
import ManageProducts from "./admin/ManageProducts";
import AdminLogin from "./admin/AdminLogin";
import Home from "./components/Home";
import Contactus from "./components/Contactus";
import ReviewPage from "./components/Review";
import Reqquantity from "./components/Reqquantity";
import Managereq from "./admin/Managereq";
import { ToastContainer } from 'react-toastify';
const App = () => {
  return (
    <>
      <Navbar />
      <ToastContainer />
      <Routes>
        <Route path="/" element={< Home/>} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product/:productId" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/contact" element={<Contactus />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/reqquantity" element={<Reqquantity />} />
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<ManageOrders />} />
        <Route path="/admin/products" element={<ManageProducts />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/req" element={<Managereq />} />

      </Routes>
    </>
  );
};

export default App;
