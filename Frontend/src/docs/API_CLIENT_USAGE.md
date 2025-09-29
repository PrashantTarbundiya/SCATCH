# API Client Usage Guide

This document provides examples of how to use the API client with built-in CSRF protection in your React components.

## Importing the API Client

```javascript
import apiClient from '../services/apiClient';
```

## Basic Usage Examples

### GET Request
```javascript
// Fetch products
const fetchProducts = async () => {
  try {
    const data = await apiClient.get('/products');
    console.log('Products:', data);
  } catch (error) {
    console.error('Error fetching products:', error.message);
  }
};
```

### POST Request (CSRF token automatically included)
```javascript
// Create a new order
const createOrder = async (orderData) => {
  try {
    const result = await apiClient.post('/orders', {
      products: orderData.products,
      shippingAddress: orderData.address,
      totalAmount: orderData.total
    });
    console.log('Order created:', result);
    return result;
  } catch (error) {
    console.error('Error creating order:', error.message);
    throw error;
  }
};
```

### PUT Request
```javascript
// Update a product
const updateProduct = async (productId, updates) => {
  try {
    const result = await apiClient.put(`/products/${productId}`, updates);
    console.log('Product updated:', result);
    return result;
  } catch (error) {
    console.error('Error updating product:', error.message);
    throw error;
  }
};
```

### DELETE Request
```javascript
// Delete a product
const deleteProduct = async (productId) => {
  try {
    const result = await apiClient.delete(`/products/${productId}`);
    console.log('Product deleted:', result);
    return result;
  } catch (error) {
    console.error('Error deleting product:', error.message);
    throw error;
  }
};
```

## Using in React Components

### Example: Product Form Component
```javascript
import React, { useState } from 'react';
import apiClient from '../services/apiClient';
import { toast } from '../utils/toast';

const ProductForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await apiClient.post('/products', formData);
      toast.success('Product created successfully!');
      setFormData({ name: '', price: '', category: '' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  );
};
```

### Example: Product List with Delete
```javascript
import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await apiClient.get('/products');
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await apiClient.delete(`/products/${productId}`);
      setProducts(products.filter(p => p._id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product._id}>
          <h3>{product.name}</h3>
          <p>${product.price}</p>
          <button onClick={() => handleDelete(product._id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};
```

## Using the CSRF Hook

If you need direct access to the CSRF token:

```javascript
import React from 'react';
import { useCsrf } from '../context/CsrfContext';

const MyComponent = () => {
  const { csrfToken, isLoading, error } = useCsrf();

  if (isLoading) return <div>Loading security token...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {/* Your component content */}
      {/* The apiClient will automatically use the CSRF token */}
    </div>
  );
};
```

## Error Handling

### Handling CSRF Token Errors
```javascript
const handleAction = async () => {
  try {
    await apiClient.post('/some-endpoint', data);
  } catch (error) {
    if (error.message.includes('Security token expired')) {
      // CSRF token expired - inform user to refresh
      alert('Your session has expired. Please refresh the page.');
      // Optionally, you can refresh the token programmatically
      // window.location.reload();
    } else {
      // Handle other errors
      console.error('Action failed:', error.message);
    }
  }
};
```

### Handling Rate Limiting
```javascript
const handleSubmit = async () => {
  try {
    await apiClient.post('/endpoint', data);
  } catch (error) {
    if (error.message.includes('Too many requests')) {
      alert('You\'re sending too many requests. Please wait a moment and try again.');
    } else {
      console.error('Error:', error.message);
    }
  }
};
```

## Best Practices

1. **Always use apiClient for API calls** - Don't use raw fetch() for state-changing operations
2. **Handle errors appropriately** - Show user-friendly messages
3. **Use loading states** - Provide feedback during async operations
4. **Don't expose CSRF tokens in URLs** - The apiClient handles this automatically in headers
5. **Refresh on token expiry** - Inform users when their session has expired

## Migration from Raw Fetch

### Before (Raw Fetch)
```javascript
const response = await fetch(`${API_URL}/products`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(data)
});
const result = await response.json();
```

### After (API Client with CSRF)
```javascript
const result = await apiClient.post('/products', data);
```

## Testing CSRF Protection

To verify CSRF protection is working:

```javascript
// This should work (includes CSRF token)
await apiClient.post('/orders', orderData);

// This should fail with CSRF error
await fetch(`${API_URL}/orders`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});
```

## Common Issues

### Issue: "Security token expired"
**Solution:** The CSRF token has expired. Refresh the page to get a new token.

### Issue: Requests working in development but failing in production
**Solution:** Ensure:
- CORS is properly configured on the backend
- `credentials: 'include'` is set (apiClient does this automatically)
- Cookies are being sent cross-origin (check sameSite settings)

### Issue: Token not being sent
**Solution:** 
- Check that the XSRF-TOKEN cookie exists in browser DevTools
- Verify the API_BASE_URL is correct in your .env file
- Ensure the backend is running and accessible```

## Testing CSRF Protection

To verify CSRF protection is working:

```javascript
// This should work (includes CSRF token)
await apiClient.post('/orders', orderData);

// This should fail with CSRF error
await fetch(`${API_URL}/orders`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});
```

## Common Issues

### Issue: "Security token expired"
**Solution:** The CSRF token has expired. Refresh the page to get a new token.

### Issue: Requests working in development but failing in production
**Solution:** Ensure:
- CORS is properly configured on the backend
- `credentials: 'include'` is set (apiClient does this automatically)
- Cookies are being sent cross-origin (check sameSite settings)

### Issue: Token not being sent
**Solution:** 
- Check that the XSRF-TOKEN cookie exists in browser DevTools
- Verify the API_BASE_URL is correct in your .env file
- Ensure the backend is running and accessible
