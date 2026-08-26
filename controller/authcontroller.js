const bcrypt = require("bcryptjs");
const { sign } = require("jsonwebtoken");
const { prisma } = require("../lib/prisma");
const crypto = require("crypto");


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        doctor: {
          include: {
            specialty: true,
            registration: true,
          },
        },
        patient: true,
        wallet: true,
      },
    });

    // User not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | GENERATE JWT
    |--------------------------------------------------------------------------
    */

    const token = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    /*
    |--------------------------------------------------------------------------
    | DOCTOR STATUS
    |--------------------------------------------------------------------------
    */

    let accountMessage = "Login successful.";

    if (user.role === "DOCTOR") {
      if (!user.doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor profile not found.",
        });
      }

      switch (user.doctor.status) {
        case "PENDING":
          accountMessage =
            "Login successful. Your registration is awaiting admin approval.";
          break;

        case "REJECTED":
          accountMessage =
            "Login successful. Your registration has been rejected.";
          break;

        case "UNAVAILABLE":
          accountMessage =
            "Login successful. Your account is currently unavailable.";
          break;

        case "AVAILABLE":
          accountMessage = "Login successful.";
          break;

        default:
          accountMessage = "Login successful.";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | REMOVE SENSITIVE INFORMATION
    |--------------------------------------------------------------------------
    */

    const {
      password: _password,
      resetToken,
      resetTokenExpires,
      ...userWithoutSensitiveData
    } = user;

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,
      message: accountMessage,

      // JWT
      token,

      // User ID
      userId: user.id,

      // Role
      role: user.role,

      // Doctor status
      doctorStatus:
        user.role === "DOCTOR"
          ? user.doctor?.status
          : null,

      // User
      user: userWithoutSensitiveData,
    });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};




const register = async (req, res) => {
  try {
    const {
      role,
      firstName,
      lastName,
      email,
      password,
      phone,

      // Patient fields
      gender,
      dob,
      nationality,
      state,
      address,
      bvn,

      // Doctor fields
      specialtyId,
      experience,
      qualification,
      bio,
      licenseNumber,
      certificate,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required.",
      });
    }

    if (!["PATIENT", "DOCTOR"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "First name, last name, email and password are required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK EXISTING USER
    |--------------------------------------------------------------------------
    */

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | HASH PASSWORD
    |--------------------------------------------------------------------------
    */

    const hashedPassword = await bcrypt.hash(password, 10);

    /*
    |--------------------------------------------------------------------------
    | TRANSACTION
    |--------------------------------------------------------------------------
    */

    const result = await prisma.$transaction(async (tx) => {

      /*
      |--------------------------------------------------------------------------
      | CREATE USER
      |--------------------------------------------------------------------------
      */

      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          phone,
          role,
        },
      });

      /*
      |--------------------------------------------------------------------------
      | CREATE WALLET
      |--------------------------------------------------------------------------
      |
      | Every registered user gets a wallet.
      |
      */

      const wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          currency: "NGN",
        },
      });

      /*
      |--------------------------------------------------------------------------
      | PATIENT REGISTRATION
      |--------------------------------------------------------------------------
      */

      if (role === "PATIENT") {

        const patient = await tx.patient.create({
          data: {
            userId: user.id,
            gender,
            dob: dob ? new Date(dob) : null,
            nationality,
            state,
            address,
            bvn,
          },
        });

        return {
          user,
          patient,
          wallet,
        };
      }

      /*
      |--------------------------------------------------------------------------
      | DOCTOR VALIDATION
      |--------------------------------------------------------------------------
      */

      if (!specialtyId) {
        const error = new Error(
          "Specialty is required for doctor registration."
        );

        error.statusCode = 400;

        throw error;
      }

      if (!licenseNumber) {
        const error = new Error(
          "License number is required for doctor registration."
        );

        error.statusCode = 400;

        throw error;
      }

      if (!certificate) {
        const error = new Error(
          "Certificate is required for doctor registration."
        );

        error.statusCode = 400;

        throw error;
      }

      /*
      |--------------------------------------------------------------------------
      | FIND SPECIALTY
      |--------------------------------------------------------------------------
      */

      const specialty = await tx.specialty.findUnique({
        where: {
          id: Number(specialtyId),
        },
      });

      if (!specialty) {
        const error = new Error(
          "Specialty not found."
        );

        error.statusCode = 404;

        throw error;
      }

      /*
      |--------------------------------------------------------------------------
      | CREATE DOCTOR
      |--------------------------------------------------------------------------
      */

      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          specialtyId: Number(specialtyId),
          experience: experience
            ? Number(experience)
            : null,
          qualification,
          bio,
          status: "PENDING",
        },
      });

      /*
      |--------------------------------------------------------------------------
      | CREATE REGISTRATION REQUEST
      |--------------------------------------------------------------------------
      */

      const request =
        await tx.registrationRequest.create({
          data: {
            doctorId: doctor.id,
            licenseNumber,
            certificate,
            status: "PENDING",
          },
        });

      return {
        user,
        doctor,
        request,
        wallet,
      };
    });

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,
      message: `${role} registered successfully.`,
      data: result,
    });

  } catch (error) {
    console.error("Registration Error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Registration failed.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
*/


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // Prevent user enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, an OTP has been sent.",
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // OTP expires in 5 minutes
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetOtp: otp,
        resetOtpExpires: otpExpires,
      },
    });

    /*
    |--------------------------------------------------------------------------
    | SEND OTP TO EMAIL
    |--------------------------------------------------------------------------
    */

    // Your email service goes here.
    // Example:
    //
    // await sendResetOtpEmail(user.email, otp);

    console.log(`Password reset OTP for ${email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, an OTP has been sent.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP and new password are required.",
      });
    }

    if (otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "OTP must be 6 digits.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or email.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK OTP
    |--------------------------------------------------------------------------
    */

    if (!user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({
        success: false,
        message: "No password reset OTP found. Please request a new OTP.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK OTP EXPIRATION
    |--------------------------------------------------------------------------
    */

    if (new Date() > user.resetOtpExpires) {
      // Clear expired OTP
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          resetOtp: null,
          resetOtpExpires: null,
        },
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK OTP VALUE
    |--------------------------------------------------------------------------
    */

    if (user.resetOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | HASH NEW PASSWORD
    |--------------------------------------------------------------------------
    */

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    /*
    |--------------------------------------------------------------------------
    | UPDATE PASSWORD AND REMOVE OTP
    |--------------------------------------------------------------------------
    */

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetOtp: null,
        resetOtpExpires: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword,
};

