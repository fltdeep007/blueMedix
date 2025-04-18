// topSellingRoutes.js
const express = require('express');
const router = express.Router();
const { check, query, validationResult } = require('express-validator');
const { getTopSellingProducts } = require('../Controllers/transactionController');
// const auth = require('../middleware/auth');
// const adminAuth = require('../middleware/adminAuth');

/**
 * @route   GET /api/analytics/top-products
 * @desc    Get top selling products (defaults to current month)
 * @access  Private/Admin
 */
router.get('/top-products', 
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { year, month, limit = 5 } = req.query;
      
      // If year and month are not provided, use current month
      const currentDate = new Date();
      const parsedYear = year ? parseInt(year) : currentDate.getFullYear();
      const parsedMonth = month ? parseInt(month) : currentDate.getMonth() + 1; // +1 because getMonth() is 0-indexed
      const parsedLimit = parseInt(limit);

      const result = await getTopSellingProducts(parsedYear, parsedMonth, parsedLimit);
      
      if (result.success) {
        return res.json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Server error in top products route:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error occurred while fetching top products' 
      });
    }
  }
);

module.exports = router;



