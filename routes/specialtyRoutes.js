const express = require("express");

const router = express.Router();

const {
    getSpecialties,
} = require("../controller/specialtiescontroller");

const verifyToken = require("../middleware/verifyToken");
const authorize = require("../middleware/authorize");


router.get(
    "/",
    verifyToken,
    authorize("PATIENT"),
    getSpecialties
);
module.exports = router;