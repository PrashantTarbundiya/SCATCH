import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; // Import useTheme


const CreateProductPage = () => {
  const { theme } = useTheme(); // Consume theme
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    discount: '',
    bgcolor: '',
    panelcolor: '',
    textcolor: '',
    quantity: '', // Added quantity
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // For showing existing image in edit mode
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);
  const navigate = useNavigate();
  const { productId } = useParams(); // Get productId from URL
  const isEditMode = Boolean(productId);

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
            const { name, price, discount, bgcolor, panelcolor, textcolor, image, quantity } = data.product; // Added quantity
            setFormData({
              name: name || '',
              price: price || '',
              discount: discount || '',
              bgcolor: bgcolor || '',
              panelcolor: panelcolor || '',
              textcolor: textcolor || '',
              quantity: quantity || '' // Added quantity
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
          setApiError(`Failed to load product for editing: ${err.message || 'Unknown error'}`);
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

    const productPayload = new FormData();
    productPayload.append('name', formData.name);
    productPayload.append('price', formData.price);
    productPayload.append('discount', formData.discount || 0);
    productPayload.append('bgcolor', formData.bgcolor);
    productPayload.append('panelcolor', formData.panelcolor);
    productPayload.append('textcolor', formData.textcolor);
    productPayload.append('quantity', formData.quantity || 0); // Added quantity
    if (imageFile) {
      productPayload.append('image', imageFile);
    } else if (!isEditMode && !imagePreview) {
      setApiError("Product image is required for new products.");
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

      setApiSuccess(result.message || (isEditMode ? 'Product updated successfully!' : 'Product created successfully!'));
      
      if (!isEditMode) {
        setFormData({ name: '', price: '', discount: '', bgcolor: '', panelcolor: '', textcolor: '', quantity: '' }); // Reset quantity
        setImageFile(null);
        setImagePreview(null);
        if (document.getElementById('image')) {
            document.getElementById('image').value = '';
        }
      }
      setTimeout(() => navigate('/admin'), 2000);
    } catch (err) {
      setApiError(err.message || (isEditMode ? 'Failed to update product.' : 'Failed to create product.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300 transition-colors duration-300 pt-28"> {/* Added pt-28 for fixed header, theme bg and text */}
      {(apiSuccess || apiError) && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 p-3 rounded-md shadow-lg z-50 ${apiSuccess ? 'bg-green-500 dark:bg-green-600' : 'bg-red-500 dark:bg-red-600'} text-white transition-all duration-300`}> {/* Reverted to top-20 */}
          <span className="inline-block">{apiSuccess || apiError}</span>
        </div>
      )}

      <div className="w-full py-10 flex flex-grow px-4 md:px-6 lg:px-8"> {/* Removed container, mx-auto. Added w-full and some padding */}
        {/* Sidebar */}
        <aside className="w-full md:w-[25%] flex-col items-start hidden md:flex bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mr-6 transition-colors duration-300 h-fit sticky top-28"> {/* Styled like Admin/Shop sidebar */}
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Admin Menu</h3>
          <nav className="flex flex-col space-y-2">
            <Link to="/admin" className="text-blue-600 dark:text-blue-400 hover:underline">
              Dashboard / View Products
            </Link>
            <Link to="/create-product" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
              Create New Product
            </Link>
            {/* Add other admin links here */}
          </nav>
        </aside>

        <main className="w-full md:w-[75%] bg-white dark:bg-gray-800 p-6 sm:p-8 shadow rounded-lg transition-colors duration-300">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
            {isEditMode ? 'Edit Product' : 'Create New Product'}
          </h2>
          <form autoComplete="off" onSubmit={handleSubmit}>
            {/* Product Details Section */}
            <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
              <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Product Details</h3>

              <div className="mb-4">
                <label htmlFor="image" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
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
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
                  required={!isEditMode} // Required only if not in edit mode (or if no image was previously set, backend should handle)
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Product Name*</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g., Cool T-Shirt"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="price" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Product Price (₹)*</label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="e.g., 999"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"> {/* New row for discount and quantity */}
                <div>
                  <label htmlFor="discount" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Discount (%)</label>
                  <input
                    id="discount"
                    name="discount"
                    type="number"
                    placeholder="e.g., 10 for 10%"
                    value={formData.discount}
                    onChange={handleInputChange}
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="quantity" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Quantity*</label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                    required
                    min="0"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Panel Details Section */}
            <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
              <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Display Panel Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="bgcolor" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Background Color</label>
                  <input
                    id="bgcolor"
                    name="bgcolor"
                    type="text"
                    placeholder="e.g., #FFFFFF or red"
                    value={formData.bgcolor}
                    onChange={handleInputChange}
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="panelcolor" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Panel Color</label>
                  <input
                    id="panelcolor"
                    name="panelcolor"
                    type="text"
                    placeholder="e.g., #EEEEEE or lightgray"
                    value={formData.panelcolor}
                    onChange={handleInputChange}
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="textcolor" className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Text Color</label>
                  <input
                    id="textcolor"
                    name="textcolor"
                    type="text"
                    placeholder="e.g., #000000 or black"
                    value={formData.textcolor}
                    onChange={handleInputChange}
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <button
              className="px-6 py-2.5 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (isEditMode ? 'Updating Product...' : 'Creating Product...') : (isEditMode ? 'Update Product' : 'Create New Product')}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default CreateProductPage;
