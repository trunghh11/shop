import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";

const CategoryProducts = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    const fetchCategoryName = async () => {
      try {
        const categoryRef = doc(db, "categories", categoryId); // Tham chiếu đến tài liệu cụ thể
        const categoryDoc = await getDoc(categoryRef); // Lấy tài liệu từ Firestore
    
        if (categoryDoc.exists()) {
          setCategoryName(categoryDoc.data().CategoryName); // Lấy tên danh mục
        } else {
          setCategoryName("Unknown Category"); // Nếu không tìm thấy tài liệu
        }
      } catch (error) {
        console.error("Error fetching category name:", error);
        setCategoryName("Unknown Category");
      }
    };
      
    const fetchProducts = async () => {
      try {
        const productsQuery = query(
          collection(db, "products"),
          where("CategoryID", "==", categoryId), where("showOnHome", "==", true)
        );
        const querySnapshot = await getDocs(productsQuery);
        const productsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsArray);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    };
    fetchCategoryName();
    fetchProducts();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen px-6 py-12">
      <div className="container mx-auto">
        <button
          onClick={() => navigate(-1)} // Go back to the previous page
          className="mb-4 text-blue-600 hover:underline flex items-center"
        >
          &larr; Back
        </button>

        <h1 className="text-3xl font-bold text-center mb-8">
          Products of {categoryName || "Category"}
        </h1>
        
        {products.length === 0 ? (
            <p className="text-center text-gray-600">No products found.</p>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
                <ProductCard 
                key={product.id} 
                product={product} 
                />
            ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default CategoryProducts;
