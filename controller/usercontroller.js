const bcrypt = require("bcryptjs");
const { sign } = require("jsonwebtoken");
const { prisma } = require("../lib/prisma");


const getAllUsers = async (req, res) => {
    try {

        const users = await prisma.user.findMany({

            include: {

                doctor: {
                    include: {
                        specialty: true,
                        registration: true
                    }
                },

                patient: true

            },

            orderBy: {
                createdAt: "desc"
            }

        });

        const formattedUsers = users.map(user => {

            const { password, ...rest } = user;

            return rest;

        });

        return res.status(200).json({

            success: true,

            message: "Users retrieved successfully.",

            total: formattedUsers.length,

            users: formattedUsers

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to retrieve users."

        });

    }
};


const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const userId = Number(id);

        if (!Number.isInteger(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID.",
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
                updatedAt: true,

                patient: true,

                doctor: {
                    include: {
                        specialty: true,
                        registration: true,
                    },
                },

                wallet: true,
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
            message: "User retrieved successfully.",
            user,
        });

    } catch (error) {
        console.error("Get User By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user.",
        });
    }
};

const updateUser = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            firstName,
            lastName,
            email,
            phone,
        } = req.body;


        const existingUser = await prisma.user.findUnique({
            where: {
                id: Number(id),
            },
        });


        if (!existingUser) {
            return res.status(404).json({
                message: "User not found.",
            });
        }



        const updatedUser = await prisma.user.update({

            where: {
                id: Number(id),
            },


            data: {
                firstName,
                lastName,
                email,
                phone,
            },


            include: {
                role: true,
            },

        });



        res.status(200).json({
            message: "User updated successfully.",
            user: updatedUser,
        });



    } catch (error) {

        console.error("Update User Error:", error);


        res.status(500).json({
            message: "Failed to update user.",
            error: error.message,
        });

    }
};



const updatePassword = async (req, res) => {

    try {

        const { id } = req.params;

        const { oldPassword, newPassword } = req.body;


        const user = await prisma.user.findUnique({
            where: {
                id: Number(id)
            }
        });


        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }



        const passwordMatch = await bcrypt.compare(
            oldPassword,
            user.password
        );


        if (!passwordMatch) {

            return res.status(401).json({
                message: "Old password is incorrect."
            });

        }



        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );



        await prisma.user.update({

            where: {
                id: Number(id)
            },

            data: {
                password: hashedPassword
            }

        });



        res.status(200).json({
            message: "Password updated successfully."
        });



    } catch (error) {

        console.error("Password Update Error:", error);


        res.status(500).json({
            message: "Failed to update password.",
            error: error.message
        });

    }

};


const getMyProfile = async (req, res) => {
  try {

    console.log("Authenticated user:", req.user);

    const userId = Number(req.user.id);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID."
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,

        patient: {
          select: {
            id: true,
            gender: true,
            dob: true,
            nationality: true,
            state: true,
            address: true,
            bvnVerified: true
          }
        },

        doctor: {
          select: {
            id: true,
            experience: true,
            qualification: true,
            bio: true,
            status: true,

            specialty: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully.",
      data: user
    });

  } catch (error) {

    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve profile."
    });
  }
};





module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    updatePassword,
    getMyProfile
};

