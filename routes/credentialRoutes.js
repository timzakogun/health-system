const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken")
const authenticate = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  getAllCredentials,
  rejectCredential,
  approveCredential,
  getPendingCredentials,
  submitFileCredential,
  submitTextCredential,
  // uploadCredential,
} = require("../controller/credentialController");


/*
|--------------------------------------------------------------------------
| USER
|--------------------------------------------------------------------------
*/

// Upload credential
// router.post(
//   "/",
//   authenticate,
//   upload.single("file"),
//   uploadCredential
// );

// Get logged-in user's credentials
router.get(
  "/my",
  authenticate,
  getAllCredentials
);

router.post("/submit-text", verifyToken, submitTextCredential); // For BVN / Address text
router.post("/submit-file", verifyToken, upload.single("file"), submitFileCredential); // For ID / Proof of Address files


/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
*/

// Get pending credentials
router.get(
  "/admin/pending",
  authenticate,
  getPendingCredentials
);

// Approve credential
router.patch(
  "/admin/:id/approve",
  authenticate,
  approveCredential
);

// Reject credential
router.patch(
  "/admin/:id/reject",
  authenticate,
  rejectCredential
);




module.exports = router;   