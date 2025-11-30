import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { toast } from '../utils/toast';


const CreateProductPage = () => {
  const { theme } = useTheme(); // Consume theme
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    discount: '',
    quantity: '',
    category: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // For showing existing image in edit mode
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const navigate = useNavigate();
  const { productId } = useParams(); // Get productId from URL
  const isEditMode = Boolean(productId);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories`, {
          credentials: 'include'
        });
        let data;
        if (response.headers.get("content-type")?.includes("application/json")) {
          data = await response.json();
        }
        
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load categories');
        }
        
        if (data.success && data.categories) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        toast.error('Failed to load categories');
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      const fetchProductDetails = async () => {
        setIsLoading(true);
        setApiError(null);
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products/${productId}`, { credentials: 'include' });
          let data;
          if (response.headers.get("content-type")?.includes("application/json")) {
            data = await response.json().catch(() => null);
          }

          if (!response.ok) {
            const errorText = data?.error || data?.message || `HTTP error! status: ${response.status} ${response.statusText}`;
            throw new Error(errorText);
          }
          
          if (data.product) {
            const { name, price, discount, image, quantity, category } = data.product;
            // Convert absolute discount amount back to percentage for display
            const discountPercentage = price > 0 && discount > 0
              ? Math.round((discount / price) * 100)
              : 0;
            
            setFormData({
              name: name || '',
              price: price || '',
              discount: discountPercentage || '',
              quantity: quantity || '',
              category: category?._id || category || ''
            });
            if (image && image.data) {
                let binary = '';
                const bytes = new Uint8Array(image.data);
                bytes.forEach((byte) => binary += String.fromCharCode(byte));
                setImagePreview(`data:image/jpeg;base64,${window.btoa(binary)}`);
            } else if (typeof image === 'string') {
                setImagePreview(image);
            }
          } else {
            throw new Error('Product data not found in response.');
          }
        } catch (err) {
          toast.error(`Failed to load product for editing: ${err.message || 'Unknown error'}`);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProductDetails();
    }
  }, [productId, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);
    setApiSuccess(null);

    // Convert discount percentage to absolute amount
    const discountPercentage = parseFloat(formData.discount) || 0;
    const price = parseFloat(formData.price) || 0;
    const discountAmount = (price * discountPercentage) / 100;

    const productPayload = new FormData();
    productPayload.append('name', formData.name);
    productPayload.append('price', formData.price);
    productPayload.append('discount', discountAmount.toFixed(2));
    productPayload.append('quantity', formData.quantity || 0);
    productPayload.append('category', formData.category);
    if (imageFile) {
      productPayload.append('image', imageFile);
    } else if (!isEditMode && !imagePreview) {
      toast.error("Product image is required for new products.");
      setIsLoading(false);
      return;
    }

    const url = isEditMode ? `${import.meta.env.VITE_API_BASE_URL}/products/${productId}` : `${import.meta.env.VITE_API_BASE_URL}/products/create`;
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        body: productPayload,
        credentials: 'include',
      });
      
      let result;
      if (response.headers.get("content-type")?.includes("application/json")) {
          result = await response.json();
      }

      if (!response.ok) {
        throw new Error(result?.error || result?.message || response.statusText || `HTTP error! status: ${response.status}`);
      }

      toast.success(result.message || (isEditMode ? 'Product updated successfully!' : 'Product created successfully!'));
      
      if (!isEditMode) {
        setFormData({ name: '', price: '', discount: '', quantity: '', category: '' });
        setImageFile(null);
        setImagePreview(null);
        if (document.getElementById('image')) {
            document.getElementById('image').value = '';
        }
      }
      setTimeout(() => navigate('/admin'), 2000);
    } catch (err) {
      toast.error(err.message || (isEditMode ? 'Failed to update product.' : 'Failed to create product.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // The parent div with padding and margin for sidebar is now in OwnerProtectedRoute.jsx
    // This div should just be a simple container for its own content.
    <div className="w-full"> {/* Removed min-h-screen, flex, bg, text, pt - handled by parent */}


      {/* Removed the outer flex container and the internal aside (sidebar) */}
      {/* The main content area will now take full width within the space provided by OwnerProtectedRoute */}
      <main className="w-full bg-white/80 dark:bg-[#1E1538]/60 backdrop-blur-xl border border-purple-500/20 p-6 sm:p-8 shadow rounded-lg transition-colors duration-300">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-purple-100">
            {isEditMode ? 'Edit Product' : 'Create New Product'}
          </h2>
          <form autoComplete="off" onSubmit={handleSubmit}>
            {/* Product Details Section */}
            <div className="mb-8 p-4 border border-purple-500/20 rounded-md">
              <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-purple-200">Product Details</h3>

              <div className="mb-4">
                <label htmlFor="image" className="block mb-1 font-medium text-gray-700 dark:text-purple-200">
                  Product Image{isEditMode ? '' : '*'}
                </label>
                {imagePreview && (
                  <div className="my-2">
                    <img src={imagePreview} alt="Product Preview" className="h-32 w-auto object-contain rounded border dark:border-gray-600" />
                  </div>
                )}
                <input
                  id="image"
                  name="image"
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-purple-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
                  required={!isEditMode} // Required only if not in edit mode (or if no image was previously set, backend should handle)
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="block mb-1 font-medium text-gray-700 dark:text-purple-200">Product Name*</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g., Cool T-Shirt"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="border border-purple-500/30 p-2 rounded w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-purple-100 text-purple-100 placeholder-gray-400 dark:placeholder-purple-300/50"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="price" className="block mb-1 font-medium text-gray-700 dark:text-purple-200">Product Price (₹)*</label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="e.g., 999"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="border border-purple-500/30 p-2 rounded w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-purple-100 text-purple-100 placeholder-gray-400 dark:placeholder-purple-300/50"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="discount" className="block mb-1 font-medium text-gray-700 dark:text-purple-200">Discount (%)</label>
                  <input
                    id="discount"
                    name="discount"
                    type="number"
                    placeholder="e.g., 10 for 10%"
                    value={formData.discount}
                    onChange={handleInputChange}
                    className="border border-purple-500/30 p-2 rounded w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-purple-100 text-purple-100 placeholder-gray-400 dark:placeholder-purple-300/50"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="quantity" className="block mb-1 font-medium text-gray-700 dark:text-purple-200">Quantity*</label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="border border-purple-500/30 p-2 rounded w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-purple-100 text-purple-100 placeholder-gray-400 dark:placeholder-purple-300/50"
                    required
                    min="0"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block mb-1 font-medium text-gray-700 dark:text-purple-200">Category*</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="border border-purple-500/30 p-2 rounded w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-purple-100 text-gray-900 dark:text-purple-100"
                    required
                    disabled={isLoading || categoriesLoading}
                  >
                    <option value="">
                      {categoriesLoading ? 'Loading categories...' : 'Select Category'}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && !categoriesLoading && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                      No categories available. Please create categories first.
                    </p>
                  )}
                </div>
              </div>
            </div>



            <button
              className="px-6 py-2.5 rounded-md bg-blue-600 dark:bg-purple-600 text-white font-semibold hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (isEditMode ? 'Updating Product...' : 'Creating Product...') : (isEditMode ? 'Update Product' : 'Create New Product')}
            </button>
          </form>
        </main>
        {/* Orphaned div removed here, main closes, then the top-level div from line 150 closes */}
    </div>
  );
};

export default CreateProductPage;








