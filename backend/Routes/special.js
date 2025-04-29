const express = require("express");
const router = express.Router();
const { bluemedixProducts, popularProducts, todaySpecialProducts } = require("../Services/productService");

router.get('/bluemedix-products', async (req, res) => {
    try {
        
        const result = await bluemedixProducts(req, res); // Pass req, res
        return res.json(result)
    } catch (error) {
        console.error("Error in /top/delivered-products endpoint:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/popular-products', async (req, res) => {
    try {
        const result = await popularProducts(req, res); // Pass req, res
        return res.json(result)
    } catch (error) {
        console.error("Error in /top/delivered-products endpoint:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/today-special', async (req, res) => {
    try {
       
        const result = await todaySpecialProducts(req, res); // Pass req, res
        return res.json(result)
    } catch (error) {
        console.error("Error in /top/delivered-products endpoint:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;