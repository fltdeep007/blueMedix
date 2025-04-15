const orderService = require('../Services/orderService');

const placeOrder = async (req, res) => {
  const { userId, sellerId, doctor, prescription_image, payment_method } = req.body;

  const result = await orderService.createOrderFromCart(userId, sellerId, doctor, prescription_image, payment_method);

  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(400).json({ message: result.message });
  }
};

const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const result = await orderService.updateOrderStatus(orderId, status);

    if (result.success) {
        res.status(200).json(result);
    } else {
        res.status(404).json({ message: result.message, orderid: orderId });
    }
};

const getOrderById = async (req, res) => {
    const { orderId } = req.params;

    const result = await orderService.getOrderById(orderId);

    if (result.success) {
        res.status(200).json(result);
    } else {
        res.status(404).json({ message: result.message });
    }
};

const getOrdersByCustomerId = async (req, res) => {
    const { userId } = req.params;

    const result = await orderService.getOrdersByCustomerId(userId);

    if (result.success) {
        res.status(200).json(result);
    } else {
        res.status(404).json({ message: result.message });
    }
};
const getOrderTrackingStatus = async (req, res) => {
    const { orderId } = req.params;

    const result = await orderService.trackOrder(orderId);

    if (result.success) {
        res.status(200).json(result);
    } else {
        res.status(404).json({ message: result.message });
    }
};

const getOrdersBySellerId = async (req, res) => {
    const { sellerId } = req.params;

    const result = await orderService.getOrdersBySellerId(sellerId);

    if (result.success) {
        res.status(200).json(result);
    } else {
        res.status(404).json({ message: result.message });
    }
};

const getOrders = async (req, res) => {
    const result = await orderService.getOrders();

    if (result.success) {
        res.status(200).json(result);
    } else {
        res.status(404).json({ message: result.message });
    }
};

const cancelOrder = async (req, res) => {
    const { orderId } = req.params;

    const result = await orderService.cancelOrder(orderId);

    if (result.success) {
        res.status(200).json(result);
    } else {
        res.status(404).json({ message: result.message });
    }
};




module.exports = {
    placeOrder,
    updateOrderStatus,
    getOrderById,
    getOrdersByCustomerId,
    getOrderTrackingStatus,
    getOrdersBySellerId,
    getOrders,
    cancelOrder
};
