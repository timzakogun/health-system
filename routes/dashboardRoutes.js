const express = require("express");

const router = express.Router();

const {
    getAdminDashboard,
    getDoctorDashboard,
    getPatientDashboard
} = require("../controller/dashboardController");

const verifyToken = require("../middleware/verifyToken");
const authorize = require("../middleware/authorize");

router.get(
    "/admin",
    verifyToken,
    authorize("ADMIN"),
    getAdminDashboard
);

router.get(
    "/doctor",
    verifyToken,
    authorize("DOCTOR"),
    getDoctorDashboard
);

router.get(
    "/patient",
    verifyToken,
    authorize("PATIENT"),
    getPatientDashboard
);

module.exports = router;