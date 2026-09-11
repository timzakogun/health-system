const express = require("express");
const router = express.Router();
const { getConversations, getMessages, sendMessage } = require("../controller/chatcontroller");
// Assumes you have an authentication middleware protecting routes
const { authenticateToken } = require("../middleware/authMiddleware"); 

// router.use(authenticateToken);kt

router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);
router.post("/:conversationId/messages", sendMessage);

module.exports = router;