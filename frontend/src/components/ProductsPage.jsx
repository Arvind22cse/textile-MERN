import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    style: "All",
    color: "All",
    material: "All",
    stock: "All",
    minPrice: "",
    maxPrice: ""
  });

  const [uniqueStyles, setUniqueStyles] = useState([]);
  const [uniqueColors, setUniqueColors] = useState([]);
  const [uniqueMaterials, setUniqueMaterials] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/products");
        setProducts(res.data);

        const styles = [...new Set(res.data.map(p => p.style).filter(Boolean))];
        const colors = [...new Set(res.data.map(p => p.color).filter(Boolean))];
        const materials = [...new Set(res.data.map(p => p.material).filter(Boolean))];

        setUniqueStyles(styles);
        setUniqueColors(colors);
        setUniqueMaterials(materials);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredProducts = products.filter((p) => {
    const {
      style,
      color,
      material,
      stock,
      minPrice,
      maxPrice
    } = filters;

    const matchStyle = style === "All" || p.style === style;
    const matchColor = color === "All" || p.color === color;
    const matchMaterial = material === "All" || p.material === material;
    const matchStock = stock === "All" || (stock === "InStock" ? p.availableStock > 0 : p.availableStock <= 0);
    const matchMinPrice = !minPrice || p.price >= parseFloat(minPrice);
    const matchMaxPrice = !maxPrice || p.price <= parseFloat(maxPrice);

    return matchStyle && matchColor && matchMaterial && matchStock && matchMinPrice && matchMaxPrice;
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">All Products</h2>

      {/* Filters Section */}
      <div className="bg-gray-50 p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Filter Products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Style Filter */}
          <div className="flex flex-col">
            <label htmlFor="style" className="text-sm font-medium mb-1">Style</label>
            <select
              id="style"
              name="style"
              value={filters.style}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded px-3 py-1"
            >
              <option value="All">All</option>
              {uniqueStyles.map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>

          {/* Color Filter */}
          <div className="flex flex-col">
            <label htmlFor="color" className="text-sm font-medium mb-1">Color</label>
            <select
              id="color"
              name="color"
              value={filters.color}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded px-3 py-1"
            >
              <option value="All">All</option>
              {uniqueColors.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          {/* Material Filter */}
          <div className="flex flex-col">
            <label htmlFor="material" className="text-sm font-medium mb-1">Material</label>
            <select
              id="material"
              name="material"
              value={filters.material}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded px-3 py-1"
            >
              <option value="All">All</option>
              {uniqueMaterials.map((material) => (
                <option key={material} value={material}>{material}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex flex-col">
            <label htmlFor="stock" className="text-sm font-medium mb-1">Stock Status</label>
            <select
              id="stock"
              name="stock"
              value={filters.stock}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded px-3 py-1"
            >
              <option value="All">All</option>
              <option value="InStock">In Stock</option>
              <option value="OutOfStock">Out of Stock</option>
            </select>
          </div>

          {/* Price Filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Price Range (₹)</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min"
                className="w-1/2 border rounded px-2 py-1"
              />
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max"
                className="w-1/2 border rounded px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* Reset Filters Button */}
        <div className="mt-4">
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded shadow"
            onClick={() =>
              setFilters({
                style: "All",
                color: "All",
                material: "All",
                stock: "All",
                minPrice: "",
                maxPrice: ""
              })
            }
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <p className="text-center col-span-full text-red-500">No products match the selected filters.</p>
        ) : (
          filteredProducts.map((product) => (
            <Link
              to={`/product/${product._id}`}
              key={product._id}
              className="border p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <img
                src={`http://localhost:5000/uploads/${product.image}`}
                alt={product.title}
                className="w-full h-64 object-cover rounded-lg"
              />
              <h3 className="mt-4 text-lg font-semibold">{product.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{product.description}</p>
              <p className="mt-2 text-blue-600 font-bold">₹{product.price.toFixed(2)}</p>
              <p className={`mt-1 text-sm font-medium ${product.availableStock <= 0 ? "text-red-500" : "text-green-600"}`}>
                {product.availableStock <= 0 ? "Out of Stock" : `Stock: ${product.availableStock}`}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
