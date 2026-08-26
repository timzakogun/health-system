const { prisma } = require("../lib/prisma");
const fs = require("fs");
const path = require("path");



const uploadCredential = async (req, res) => {
  try {
    const { credentialType } = req.body;

    if (!credentialType) {
      return res.status(400).json({
        success: false,
        message: "Credential type is required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Credential file is required.",
      });
    }

    const userId = Number(req.user.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid user.",
      });
    }

    const credential = await prisma.credential.create({
      data: {
        userId,
        type: credentialType,
        fileUrl: `/uploads/credentials/${req.file.filename}`,
        fileName: req.file.originalname,
        status: "PENDING",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Credential uploaded successfully. Awaiting admin verification.",
      credential,
    });
  } catch (error) {
    console.error("UPLOAD CREDENTIAL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload credential.",
    });
  }
};



// Submit BVN or Address Text
const submitTextCredential = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { type, value } = req.body; // type: "BVN" or "PROOF_OF_ADDRESS_TEXT"

    if (!type || !value) {
      return res.status(400).json({ success: false, message: "Credential type and value are required." });
    }

    const credential = await prisma.credential.create({
      data: {
        userId,
        type,
        value,
        status: "PENDING",
      },
    });

    return res.status(201).json({
      success: true,
      message: `${type} submitted successfully. Awaiting admin review.`,
      credential,
    });
  } catch (error) {
    console.error("Submit Text Credential Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Submit File-based Credentials (ID Document, Proof of Address Image)
const submitFileCredential = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { type } = req.body; // type: "ID_DOCUMENT" or "PROOF_OF_ADDRESS_IMAGE"

    if (!type || !req.file) {
      return res.status(400).json({ success: false, message: "Credential type and file are required." });
    }

    const credential = await prisma.credential.create({
      data: {
        userId,
        type,
        fileUrl: `/uploads/credentials/${req.file.filename}`,
        fileName: req.file.originalname,
        status: "PENDING",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Credential document uploaded successfully. Awaiting admin review.",
      credential,
    });
  } catch (error) {
    console.error("Submit File Credential Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};


const getMyCredentials = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const credentials = await prisma.credential.findMany({
      where: {
        userId,
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      credentials,
    });
  } catch (error) {
    console.error("GET MY CREDENTIALS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve credentials.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| ADMIN - GET PENDING CREDENTIALS
|--------------------------------------------------------------------------
*/

const getPendingCredentials = async (req, res) => {
  try {
    const credentials = await prisma.credential.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        uploadedAt: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      count: credentials.length,
      credentials,
    });
  } catch (error) {
    console.error("GET PENDING CREDENTIALS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pending credentials.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| ADMIN - APPROVE CREDENTIAL
|--------------------------------------------------------------------------
*/

const approveCredential = async (req, res) => {
  try {
    const credentialId = Number(req.params.id);

    if (!Number.isInteger(credentialId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid credential ID.",
      });
    }

    const credential = await prisma.credential.findUnique({
      where: {
        id: credentialId,
      },
    });

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: "Credential not found.",
      });
    }

    if (credential.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Credential has already been approved.",
      });
    }

    const updatedCredential =
      await prisma.credential.update({
        where: {
          id: credentialId,
        },
        data: {
          status: "APPROVED",
          reviewedBy: Number(req.user.id),
          reviewedAt: new Date(),
          reviewNote: null,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Credential approved successfully.",
      credential: updatedCredential,
    });
  } catch (error) {
    console.error("APPROVE CREDENTIAL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to approve credential.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| ADMIN - REJECT CREDENTIAL
|--------------------------------------------------------------------------
*/

const rejectCredential = async (req, res) => {
  try {
    const credentialId = Number(req.params.id);
    const { reviewNote } = req.body;

    if (!Number.isInteger(credentialId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid credential ID.",
      });
    }

    if (!reviewNote) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason is required.",
      });
    }

    const credential = await prisma.credential.findUnique({
      where: {
        id: credentialId,
      },
    });

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: "Credential not found.",
      });
    }

    const updatedCredential =
      await prisma.credential.update({
        where: {
          id: credentialId,
        },
        data: {
          status: "REJECTED",
          reviewedBy: Number(req.user.id),
          reviewedAt: new Date(),
          reviewNote,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Credential rejected successfully.",
      credential: updatedCredential,
    });
  } catch (error) {
    console.error("REJECT CREDENTIAL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject credential.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN - GET ALL CREDENTIALS (FILTERABLE OPTIONAL)
|--------------------------------------------------------------------------
*/

const getAllCredentials = async (req, res) => {
  try {
    const { status, type } = req.query;

    // Build dynamic filter conditions
    const whereClause = {};
    if (status) {
      whereClause.status = status.toUpperCase();
    }
    if (type) {
      whereClause.type = type.toUpperCase();
    }

    const credentials = await prisma.credential.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: credentials.length,
      credentials,
    });
  } catch (error) {
    console.error("GET ALL CREDENTIALS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve credentials.",
    });
  }
};

module.exports = {
  getAllCredentials,
  rejectCredential,
  approveCredential,
  getPendingCredentials,
  submitFileCredential,
  submitTextCredential,
  uploadCredential,

};