import express from 'express';
import { 
    getSalesAnalytics, 
    getRevenueTrends, 
    exportSalesData 
} from '../controllers/analyticsController.js';
import isLoggedin from '../middleware/isLoggedin.js';
import isOwner from '../middleware/isOwner.js';

const router = express.Router();

// All analytics routes require owner authentication only
// isOwner middleware already validates the token and checks for owner privileges
router.use(isOwner);

// Get comprehensive sales analytics
// Query params: startDate, endDate, category
router.get('/sales', getSalesAnalytics);

// Get revenue trends (month-over-month comparison)
router.get('/trends', getRevenueTrends);

// Export sales data
// Query params: startDate, endDate, format (json/csv)
router.get('/export', exportSalesData);

export default router;