const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
require("dotenv").config();
const router = express.Router();
const USERS_FILE = "./db/users.json";

// Register
router.post("/register", (req, res) => {
  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  const { name, password, e_mail, phone_no, ...rest } = req.body;

  if (users.find(u => u.phone_no === phone_no)) {
    return res.status(400).json({ msg: "User already exists" });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const newUser = {
    id: uuidv4(),
    name,
    password: hashed,
    e_mail,
    phone_no,
    ...rest
  };
  users.push(newUser);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  res.status(201).json({ msg: "Registered", userId: newUser.id });
});

// Login
router.post("/login", (req, res) => {
  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  const { phone_no, password } = req.body;

  const user = users.find(u => u.phone_no === phone_no);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ msg: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token });
});

module.exports = router;

