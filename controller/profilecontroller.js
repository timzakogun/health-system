const { prisma } = require("../lib/prisma");

/*
|--------------------------------------------------------------------------
| GET USER PROFILE
|--------------------------------------------------------------------------
*/

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,

        patient: {
          select: {
            gender: true,
            dob: true,
            nationality: true,
            state: true,
          },
        },

        doctor: {
          select: {
            experience: true,
            qualification: true,
            bio: true,
            status: true,

            specialty: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully.",
      data: user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE PROFILE
|--------------------------------------------------------------------------
| Only phone and address can be changed.
|--------------------------------------------------------------------------
*/

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      phone,
      address,
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: {
        id: Number(userId),
      },

      data: {
        phone,
        address,
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        role: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


module.exports = {
  getProfile,
  updateProfile,
};