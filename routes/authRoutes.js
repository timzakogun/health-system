const express = require("express");
const { login, forgotPassword, resetPassword, register } = require("../controller/authcontroller");
const validateRequest = require("../middleware/validateRequest");

const { Router } = express;
const router = Router();


router.post("/login", validateRequest(["email", "password"]), login);

router.post("/register", validateRequest([
  "role",
  "firstName",
  "lastName",
  "email",
  "password"
]), register);

router.post("/forgot-password", validateRequest(["email"]), forgotPassword);


router.post("/reset-password", validateRequest(["token", "newPassword"]), resetPassword);


module.exports = router;