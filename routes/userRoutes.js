const express = require("express");
const { getAllUsers,
    getUserById,
    updateUser,
    updatePassword,
    getMyProfile
} = require("../controller/usercontroller");

const verifyToken = require("../middleware/verifyToken");
const { Router } = express;
const router = Router();


router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.put("/:id/password", updatePassword);
router.get(
    "/me",
    verifyToken,
    getMyProfile
);


module.exports = router;