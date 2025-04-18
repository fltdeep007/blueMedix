const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const ordersFile = "./db/orders.json";
const invoicesFile = "./db/invoices.json";

const readDB = path => JSON.parse(fs.readFileSync(path));
const writeDB = (path, data) => fs.writeFileSync(path, JSON.stringify(data, null, 2));

exports.placeOrder = (req, res) => {
  const { userId, products, payment_method, upi_id, prescription_image } = req.body;
  const orders = readDB(ordersFile);

  const newOrder = {
    id: uuidv4(),
    userId,
    products,
    payment_method,
    upi_id,
    prescription_image,
    status: "Processing",
    createdAt: new Date()
  };

  orders.push(newOrder);
  writeDB(ordersFile, orders);
  res.status(201).json({ msg: "Order placed", orderId: newOrder.id });
};

exports.generateInvoice = (req, res) => {
  const { orderId } = req.params;
  const orders = readDB(ordersFile);
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ msg: "Order not found" });

  const invoices = readDB(invoicesFile);
  const invoice = {
    id: uuidv4(),
    orderId,
    userId: order.userId,
    total: order.products.reduce((sum, p) => sum + (p.quantity * 100), 0),
    date: new Date()
  };
  invoices.push(invoice);
  writeDB(invoicesFile, invoices);
  res.json({ msg: "Invoice generated", invoice });
};

exports.getInvoiceDetails = (req, res) => {
  const invoices = readDB(invoicesFile);
  const invoice = invoices.find(inv => inv.id === req.params.invoiceId);
  if (!invoice) return res.status(404).json({ msg: "Invoice not found" });
  res.json(invoice);
};
