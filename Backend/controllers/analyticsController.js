import orderModel from '../models/order-model.js';
import productModel from '../models/product-model.js';
import userModel from '../models/users-model.js';
import categoryModel from '../models/category-model.js';
import mongoose from 'mongoose';

// Get comprehensive sales analytics
export const getSalesAnalytics = async (req, res, next) => {
    try {
        const { startDate, endDate, category } = req.query;
        
        // Build date filter
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);
        
        // Build order query
        const orderQuery = dateFilter.$gte || dateFilter.$lte
            ? { orderDate: dateFilter }
            : {};
        
        // Fetch all orders with populated data
        const orders = await orderModel.find(orderQuery)
            .populate('user', 'fullname email username')
            .populate({
                path: 'items.product',
                select: 'name price category image',
                populate: {
                    path: 'category',
                    select: 'name slug'
                }
            })
            .sort({ orderDate: -1 });
        
        // Filter by category if specified
        let filteredOrders = orders;
        if (category) {
            filteredOrders = orders.filter(order => 
                order.items.some(item => 
                    item.product?.category?.slug === category || 
                    item.product?.category?._id?.toString() === category
                )
            );
        }
        
        // Calculate basic metrics
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = filteredOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Calculate revenue by date range (daily, weekly, or monthly based on range)
        const revenueByDate = calculateRevenueByDate(filteredOrders, startDate, endDate);
        
        // Top selling products
        const topProducts = await getTopProducts(filteredOrders);
        
        // Sales by category
        const salesByCategory = await getSalesByCategory(filteredOrders);
        
        // Top customers
        const topCustomers = getTopCustomers(filteredOrders);
        
        // Order statistics
        const orderStats = getOrderStatistics(filteredOrders);
        
        // Recent orders
        const recentOrders = filteredOrders.slice(0, 10).map(order => ({
            _id: order._id,
            orderDate: order.orderDate,
            customer: order.user?.fullname || order.user?.email || 'Unknown',
            totalAmount: order.totalAmount,
            status: order.orderStatus,
            itemCount: order.items.length
        }));
        
        res.json({
            success: true,
            analytics: {
                overview: {
                    totalRevenue,
                    totalOrders,
                    avgOrderValue,
                    dateRange: {
                        start: startDate || 'All time',
                        end: endDate || 'Present'
                    }
                },
                revenueByDate,
                topProducts,
                salesByCategory,
                topCustomers,
                orderStats,
                recentOrders
            }
        });
        
    } catch (error) {
        console.error('Error fetching sales analytics:', error);
        next(error);
    }
};

// Helper function to calculate revenue by date
function calculateRevenueByDate(orders, startDate, endDate) {
    const revenueMap = {};
    
    // Determine grouping (daily, weekly, or monthly)
    const daysDiff = startDate && endDate 
        ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
        : null;
    
    const groupBy = !daysDiff ? 'month' : daysDiff <= 31 ? 'day' : daysDiff <= 90 ? 'week' : 'month';
    
    orders.forEach(order => {
        const date = new Date(order.orderDate);
        let key;
        
        if (groupBy === 'day') {
            key = date.toISOString().split('T')[0];
        } else if (groupBy === 'week') {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
        } else {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
        
        revenueMap[key] = (revenueMap[key] || 0) + order.totalAmount;
    });
    
    return Object.entries(revenueMap)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .map(([date, revenue]) => ({ date, revenue }));
}

// Helper function to get top products
async function getTopProducts(orders) {
    const productStats = {};
    
    orders.forEach(order => {
        order.items.forEach(item => {
            const productId = item.product?._id?.toString();
            const productName = item.nameAtPurchase || item.product?.name || 'Unknown Product';
            
            if (!productId) return;
            
            if (!productStats[productId]) {
                productStats[productId] = {
                    productId,
                    name: productName,
                    quantity: 0,
                    revenue: 0,
                    image: item.product?.image || null,
                    category: item.product?.category?.name || 'Uncategorized'
                };
            }
            
            productStats[productId].quantity += item.quantity;
            productStats[productId].revenue += item.quantity * item.priceAtPurchase;
        });
    });
    
    return Object.values(productStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
}

// Helper function to get sales by category
async function getSalesByCategory(orders) {
    const categoryStats = {};
    
    orders.forEach(order => {
        order.items.forEach(item => {
            const categoryName = item.product?.category?.name || 'Uncategorized';
            const categoryId = item.product?.category?._id?.toString() || 'uncategorized';
            
            if (!categoryStats[categoryId]) {
                categoryStats[categoryId] = {
                    categoryId,
                    name: categoryName,
                    quantity: 0,
                    revenue: 0,
                    orderCount: 0
                };
            }
            
            categoryStats[categoryId].quantity += item.quantity;
            categoryStats[categoryId].revenue += item.quantity * item.priceAtPurchase;
        });
        
        // Count unique orders per category
        const categoriesInOrder = new Set();
        order.items.forEach(item => {
            const categoryId = item.product?.category?._id?.toString() || 'uncategorized';
            if (!categoriesInOrder.has(categoryId)) {
                categoriesInOrder.add(categoryId);
                if (categoryStats[categoryId]) {
                    categoryStats[categoryId].orderCount++;
                }
            }
        });
    });
    
    return Object.values(categoryStats)
        .sort((a, b) => b.revenue - a.revenue);
}

// Helper function to get top customers
function getTopCustomers(orders) {
    const customerStats = {};
    
    orders.forEach(order => {
        const userId = order.user?._id?.toString();
        const customerName = order.user?.fullname || order.user?.email || 'Unknown';
        
        if (!userId) return;
        
        if (!customerStats[userId]) {
            customerStats[userId] = {
                userId,
                name: customerName,
                email: order.user?.email || '',
                orderCount: 0,
                totalSpent: 0,
                avgOrderValue: 0
            };
        }
        
        customerStats[userId].orderCount++;
        customerStats[userId].totalSpent += order.totalAmount;
    });
    
    // Calculate average order value for each customer
    Object.values(customerStats).forEach(customer => {
        customer.avgOrderValue = customer.totalSpent / customer.orderCount;
    });
    
    return Object.values(customerStats)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);
}

// Helper function to get order statistics
function getOrderStatistics(orders) {
    const statusCounts = {};
    const paymentStatusCounts = {};
    
    orders.forEach(order => {
        const status = order.orderStatus || 'Processing';
        const paymentStatus = order.paymentStatus || 'pending';
        
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        paymentStatusCounts[paymentStatus] = (paymentStatusCounts[paymentStatus] || 0) + 1;
    });
    
    return {
        byOrderStatus: statusCounts,
        byPaymentStatus: paymentStatusCounts,
        totalProcessing: statusCounts['Processing'] || 0,
        totalDelivered: statusCounts['Delivered'] || 0,
        totalCancelled: statusCounts['Cancelled'] || 0
    };
}

// Get revenue trends (month-over-month comparison)
export const getRevenueTrends = async (req, res, next) => {
    try {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        
        const [currentMonthOrders, lastMonthOrders] = await Promise.all([
            orderModel.find({ 
                orderDate: { $gte: currentMonthStart },
                paymentStatus: 'paid'
            }),
            orderModel.find({ 
                orderDate: { $gte: lastMonthStart, $lte: lastMonthEnd },
                paymentStatus: 'paid'
            })
        ]);
        
        const currentRevenue = currentMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const lastRevenue = lastMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        const growth = lastRevenue > 0 
            ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 
            : 0;
        
        res.json({
            success: true,
            trends: {
                currentMonth: {
                    revenue: currentRevenue,
                    orders: currentMonthOrders.length,
                    avgOrderValue: currentMonthOrders.length > 0 ? currentRevenue / currentMonthOrders.length : 0
                },
                lastMonth: {
                    revenue: lastRevenue,
                    orders: lastMonthOrders.length,
                    avgOrderValue: lastMonthOrders.length > 0 ? lastRevenue / lastMonthOrders.length : 0
                },
                growth: {
                    revenue: growth,
                    orders: lastMonthOrders.length > 0 
                        ? ((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100 
                        : 0
                }
            }
        });
        
    } catch (error) {
        console.error('Error fetching revenue trends:', error);
        next(error);
    }
};

// Export sales data (for reports)
export const exportSalesData = async (req, res, next) => {
    try {
        const { startDate, endDate, format = 'json' } = req.query;
        
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);
        
        const orderQuery = dateFilter.$gte || dateFilter.$lte 
            ? { orderDate: dateFilter }
            : {};
        
        const orders = await orderModel.find(orderQuery)
            .populate('user', 'fullname email')
            .populate('items.product', 'name category')
            .sort({ orderDate: -1 });
        
        const exportData = orders.map(order => ({
            orderId: order._id,
            orderDate: order.orderDate,
            customer: order.user?.fullname || order.user?.email || 'Unknown',
            items: order.items.map(item => ({
                product: item.nameAtPurchase,
                quantity: item.quantity,
                price: item.priceAtPurchase
            })),
            totalAmount: order.totalAmount,
            status: order.orderStatus,
            paymentStatus: order.paymentStatus
        }));
        
        if (format === 'csv') {
            // Convert to CSV format
            const csv = convertToCSV(exportData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
            res.send(csv);
        } else {
            res.json({
                success: true,
                data: exportData,
                count: exportData.length
            });
        }
        
    } catch (error) {
        console.error('Error exporting sales data:', error);
        next(error);
    }
};

// Helper function to convert data to CSV
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = ['Order ID', 'Date', 'Customer', 'Total Amount', 'Status', 'Payment Status'];
    const rows = data.map(order => [
        order.orderId,
        new Date(order.orderDate).toLocaleDateString(),
        order.customer,
        order.totalAmount,
        order.status,
        order.paymentStatus
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}
