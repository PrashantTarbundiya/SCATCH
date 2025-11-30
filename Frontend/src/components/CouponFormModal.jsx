import React, { useState, useEffect } from 'react';
import { FormSkeleton } from './ui/SkeletonLoader.jsx';

const CouponFormModal = ({ isOpen, onClose, onSubmit, initialData, mode = 'create' }) => {
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        validFrom: '',
        validUntil: '',
        minPurchaseAmount: '',
        usageLimit: '',
        isActive: true,
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                code: initialData.code || '',
                description: initialData.description || '',
                discountType: initialData.discountType || 'percentage',
                discountValue: initialData.discountValue || '',
                validFrom: initialData.validFrom ? new Date(initialData.validFrom).toISOString().split('T')[0] : '',
                validUntil: initialData.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] : '',
                minPurchaseAmount: initialData.minPurchaseAmount || '',
                usageLimit: initialData.usageLimit || '',
                isActive: initialData.isActive !== undefined ? initialData.isActive : true,
            });
        } else {

            setFormData({
                code: '',
                description: '',
                discountType: 'percentage',
                discountValue: '',
                validFrom: new Date().toISOString().split('T')[0], 
                validUntil: '',
                minPurchaseAmount: '0',
                usageLimit: '',
                isActive: true,
            });
        }
        setError(''); 
    }, [isOpen, initialData, mode]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        
        if (!formData.code || !formData.discountType || !formData.discountValue || !formData.validUntil) {
            setError('Code, Discount Type, Discount Value, and Valid Until date are required.');
            setIsSubmitting(false);
            return;
        }
        if (formData.discountType === 'percentage' && (parseFloat(formData.discountValue) <= 0 || parseFloat(formData.discountValue) > 100)) {
            setError('Percentage discount must be between 1 and 100.');
            setIsSubmitting(false);
            return;
        }
        if (formData.discountType === 'fixedAmount' && parseFloat(formData.discountValue) <= 0) {
            setError('Fixed amount discount must be greater than 0.');
            setIsSubmitting(false);
            return;
        }
        if (new Date(formData.validUntil) < new Date(formData.validFrom)) {
            setError('Valid Until date must be after Valid From date.');
            setIsSubmitting(false);
            return;
        }
        if (formData.minPurchaseAmount && parseFloat(formData.minPurchaseAmount) < 0) {
            setError('Minimum purchase amount cannot be negative.');
            setIsSubmitting(false);
            return;
        }
         if (formData.usageLimit && parseInt(formData.usageLimit, 10) < 1) {
            setError('Usage limit must be at least 1, or leave blank for unlimited.');
            setIsSubmitting(false);
            return;
        }


        try {
            const dataToSubmit = {
                ...formData,
                discountValue: parseFloat(formData.discountValue),
                minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : 0,
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : null, // Send null if empty
            };
            await onSubmit(dataToSubmit);
            // onClose(); 
        } catch (submissionError) {
            setError(submissionError.message || `Failed to ${mode} coupon.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out">
            <div className="bg-white dark:bg-white dark:bg-neutral-800 p-6 sm:p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white">
                        {mode === 'create' ? 'Create New Coupon' : 'Edit Coupon'}
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="text-purple-300 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        aria-label="Close modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 p-3 rounded-md">{error}</p>}

                {isSubmitting ? (
                    <FormSkeleton fields={6} />
                ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-purple-200 mb-1">Coupon Code</label>
                        <input
                            type="text"
                            name="code"
                            id="code"
                            value={formData.code}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm bg-white dark:bg-white dark:bg-neutral-700 text-purple-100 placeholder-gray-400 dark:placeholder-purple-300/50 dark:placeholder-gray-400 dark:placeholder-neutral-500"
                            placeholder="E.g., SUMMER25"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-purple-200 mb-1">Description (Optional)</label>
                        <textarea
                            name="description"
                            id="description"
                            rows="2"
                            value={formData.description}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm bg-white dark:bg-white dark:bg-neutral-700 text-purple-100 placeholder-gray-400 dark:placeholder-purple-300/50 dark:placeholder-gray-400 dark:placeholder-neutral-500"
                            placeholder="E.g., 25% off all summer items"
                        ></textarea>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="discountType" className="block text-sm font-medium text-purple-200 mb-1">Discount Type</label>
                            <select
                                name="discountType"
                                id="discountType"
                                value={formData.discountType}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm bg-white dark:bg-white dark:bg-neutral-700 text-gray-900 dark:text-purple-100"
                            >
                                <option value="percentage">Percentage</option>
                                <option value="fixedAmount">Fixed Amount</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="discountValue" className="block text-sm font-medium text-purple-200 mb-1">Discount Value</label>
                            <input
                                type="number"
                                name="discountValue"
                                id="discountValue"
                                value={formData.discountValue}
                                onChange={handleChange}
                                required
                                step="0.01"
                                min="0"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm bg-white dark:bg-white dark:bg-neutral-700 text-purple-100 placeholder-gray-400 dark:placeholder-purple-300/50 dark:placeholder-gray-400 dark:placeholder-neutral-500"
                                placeholder={formData.discountType === 'percentage' ? "E.g., 25 (for 25%)" : "E.g., 10 (for $10 off)"}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="validFrom" className="block text-sm font-medium text-purple-200 mb-1">Valid From</label>
                            <input
                                type="date"
                                name="validFrom"
                                id="validFrom"
                                value={formData.validFrom}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm bg-white dark:bg-white dark:bg-neutral-700 text-gray-900 dark:text-purple-100"
                            />
                        </div>
                        <div>
                            <label htmlFor="validUntil" className="block text-sm font-medium text-purple-200 mb-1">Valid Until</label>
                            <input
                                type="date"
                                name="validUntil"
                                id="validUntil"
                                value={formData.validUntil}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm bg-white dark:bg-white dark:bg-neutral-700 text-gray-900 dark:text-purple-100"
                            />
                        </div>
                    </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="minPurchaseAmount" className="block text-sm font-medium text-purple-200 mb-1">Min. Purchase Amount (Optional)</label>
                            <input
                                type="number"
                                name="minPurchaseAmount"
                                id="minPurchaseAmount"
                                value={formData.minPurchaseAmount}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm bg-white dark:bg-white dark:bg-neutral-700 text-purple-100 placeholder-gray-400 dark:placeholder-purple-300/50 dark:placeholder-gray-400 dark:placeholder-neutral-500"
                                placeholder="E.g., 50 (for $50 minimum)"
                            />
                        </div>
                        <div>
                            <label htmlFor="usageLimit" className="block text-sm font-medium text-purple-200 mb-1">Usage Limit (Optional)</label>
                            <input
                                type="number"
                                name="usageLimit"
                                id="usageLimit"
                                value={formData.usageLimit}
                                onChange={handleChange}
                                min="1"
                                step="1"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm bg-white dark:bg-white dark:bg-neutral-700 text-purple-100 placeholder-gray-400 dark:placeholder-purple-300/50 dark:placeholder-gray-400 dark:placeholder-neutral-500"
                                placeholder="E.g., 100 (leave blank for unlimited)"
                            />
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            id="isActive"
                            name="isActive"
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-purple-500 bg-white dark:bg-white dark:bg-neutral-700"
                        />
                        <label htmlFor="isActive" className="ml-2 block text-sm text-purple-100 text-gray-700 dark:text-purple-200">
                            Coupon is Active
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-purple-200 bg-gray-100 dark:bg-white dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-neutral-800 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-purple-600 hover:bg-blue-700 dark:hover:bg-purple-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-2 focus:ring-purple-500 dark:focus:ring-offset-neutral-800 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Coupon' : 'Save Changes')}
                        </button>
                    </div>
                </form>
                )}
            </div>
        </div>
    );
};

export default CouponFormModal;




