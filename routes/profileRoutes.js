const express = require("express");

const router = express.Router();

const {
  getProfile,
  updateProfile,
} = require("../controller/profilecontroller");

const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getProfile);

router.put("/", authMiddleware, updateProfile);

module.exports = router;