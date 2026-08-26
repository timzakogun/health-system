const express = require("express");
const { approveDoctor, rejectDoctor, getPendingRequests } = require("../controller/admincontroller");

const verifyToken = require("../middleware/verifyToken");
const authorize = require("../middleware/authorize");
const validateRequest = require("../middleware/validateRequest");

const { Router } = express;
const router = Router();

router.patch("/requests/:id/approve", verifyToken,
    authorize("ADMIN"), approveDoctor);

router.patch("/requests/:id/reject", verifyToken,
    authorize("ADMIN"), rejectDoctor);

router.get("/requests", verifyToken, authorize("ADMIN"), getPendingRequests);

module.exports = router;
