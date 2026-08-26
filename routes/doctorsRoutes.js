const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/verifyToken");
const authorize = require("../middleware/authorize");

const {
  getDoctors,
  getDoctorById,
} = require("../controller/doctorController");


// Patients can see available doctors
router.get(
  "/",
  authenticate,
  authorize("PATIENT"),
  getDoctors
);


// Patients can view a doctor's profile
router.get(
  "/:id",
  authenticate,
  authorize("PATIENT"),
  getDoctorById
);


module.exports = router;