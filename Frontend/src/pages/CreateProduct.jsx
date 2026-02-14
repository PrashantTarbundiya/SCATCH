import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
// Import useTheme
import { toast } from '../utils/toast';


const CreateProductPage = () => {
  // Consume theme
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
      <main className="w-full bg-white border-4 border-black shadow-neo p-6 md:p-8">
        <h2 className="text-3xl font-black uppercase mb-8 border-b-4 border-black pb-4 text-black flex items-center gap-3">
          {isEditMode ? (
            <>
              <i className="ri-edit-2-line"></i>
              <span>Edit Product</span>
            </>
          ) : (
            <>
              <i className="ri-add-line"></i>
              <span>Create New Product</span>
            </>
          )}
        </h2>
        <form autoComplete="off" onSubmit={handleSubmit} className="space-y-8">
          {/* Product Details Section */}
          <div>
            <div className="mb-6">
              <label htmlFor="image" className="block mb-2 font-black uppercase text-sm text-gray-700">
                Product Image{isEditMode ? '' : '*'}
              </label>
              {imagePreview && (
                <div className="mb-4 p-2 border-4 border-black bg-gray-50 w-fit">
                  <img src={imagePreview} alt="Product Preview" className="h-48 w-auto object-contain" />
                </div>
              )}
              <div className="relative">
                <input
                  id="image"
                  name="image"
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full text-sm font-bold text-black
                        file:mr-4 file:py-3 file:px-6
                        file:border-2 file:border-black file:text-sm file:font-black file:uppercase
                        file:bg-black file:text-white
                        hover:file:bg-gray-800 cursor-pointer border-2 border-black p-2 bg-white"
                  required={!isEditMode}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block mb-2 font-black uppercase text-sm text-gray-700">Product Name*</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="E.G., COOL T-SHIRT"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-black font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="price" className="block mb-2 font-black uppercase text-sm text-gray-700">Product Price (₹)*</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  placeholder="E.G., 999"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-black font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="discount" className="block mb-2 font-black uppercase text-sm text-gray-700">Discount (%)</label>
                <input
                  id="discount"
                  name="discount"
                  type="number"
                  placeholder="E.G., 10"
                  value={formData.discount}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-black font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="quantity" className="block mb-2 font-black uppercase text-sm text-gray-700">Quantity*</label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  placeholder="E.G., 100"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-black font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white"
                  required
                  min="0"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="category" className="block mb-2 font-black uppercase text-sm text-gray-700">Category*</label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 border-black font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white appearance-none uppercase"
                    required
                    disabled={isLoading || categoriesLoading}
                  >
                    <option value="">
                      {categoriesLoading ? 'LOADING...' : 'SELECT CATEGORY'}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <i className="ri-arrow-down-s-line text-xl font-bold"></i>
                  </div>
                </div>
                {categories.length === 0 && !categoriesLoading && (
                  <p className="text-sm font-bold text-red-600 mt-2 uppercase">
                    No categories available. Please create categories first.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t-4 border-black border-dashed">
            <button
              className="px-8 py-4 bg-purple-600 text-white font-black uppercase tracking-widest border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (
                <>
                  <i className={isEditMode ? "ri-save-line" : "ri-add-circle-line"}></i>
                  <span>{isEditMode ? 'Update Product' : 'Create Product'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
      {/* Orphaned div removed here, main closes, then the top-level div from line 150 closes */}
    </div>
  );
};

export default CreateProductPage;








