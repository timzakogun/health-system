const express = require("express");
const { getWallet, topUpWallet, getSavedCards } = require("../controller/walletcontroller");


const {Router} = express;
const router = Router();

router.get("/", getWallet);
router.post("/topup", topUpWallet);
router.get("/cards", getSavedCards);

module.exports = router;