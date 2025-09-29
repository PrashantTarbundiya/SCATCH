const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const COUPONS_API_URL = `${API_BASE_URL}/api/v1/coupons`;

const handleResponse = async (response) => {
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        data = await response.json();
    } else {
        if (!response.ok) {
            throw new Error(response.statusText || `HTTP error! status: ${response.status}`);
        }
        return { success: true, message: response.statusText || "Operation successful but no JSON response." };
    }

    if (!response.ok) {
        const errorMessage = data?.message || data?.error || response.statusText || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
    }
    return data;
};

export const createCoupon = async (couponData) => {
    const response = await fetch(COUPONS_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Get all coupons
export const getAllCoupons = async () => {
    const response = await fetch(COUPONS_API_URL, {
        method: 'GET',
        credentials: 'include',
    });
    return handleResponse(response);
};

// Get a single coupon by ID
export const getCouponById = async (couponId) => {
    const response = await fetch(`${COUPONS_API_URL}/${couponId}`, {
        method: 'GET',
        credentials: 'include',
    });
    return handleResponse(response);
};

// Update an existing coupon
export const updateCoupon = async (couponId, couponData) => {
    const response = await fetch(`${COUPONS_API_URL}/${couponId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Delete a coupon
export const deleteCoupon = async (couponId) => {
    const response = await fetch(`${COUPONS_API_URL}/${couponId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return handleResponse(response);
};

// Validate a coupon code (for user side)
export const validateCoupon = async (code, cartItems, userId = null) => {
    const response = await fetch(`${COUPONS_API_URL}/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, cartItems, userId }),
        credentials: 'include',
    });
    return handleResponse(response);
};