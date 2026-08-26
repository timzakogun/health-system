const bcrypt = require("bcryptjs");
const { sign } = require("jsonwebtoken");
const { prisma } = require("../lib/prisma");


// const createUser = async (req, res) => {
//     try {
//         const {
//             firstName,
//             lastName,
//             email,
//             password,
//             phone,
//             roleId,
//         } = req.body;


//         // Validate required fields
//         if (!firstName || !lastName || !email || !password || !roleId) {
//             return res.status(400).json({
//                 message:
//                     "firstName, lastName, email, password and roleId are required.",
//             });
//         }


//         // Check if user already exists
//         const existingUser = await prisma.user.findUnique({
//             where: {
//                 email,
//             },
//         });


//         if (existingUser) {
//             return res.status(409).json({
//                 message: "User with this email already exists.",
//             });
//         }


//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);



//         // Create user
//         const user = await prisma.user.create({
//             data: {
//                 firstName,
//                 lastName,
//                 email,
//                 password: hashedPassword,
//                 phone,

//                 role: {
//                     connect: {
//                         id: Number(roleId),
//                     },
//                 },
//             },


//             include: {
//                 role: true,
//             },

//         });



//         // Remove password from response
//         const {
//             password: removedPassword,
//             ...userWithoutPassword
//         } = user;



//         res.status(201).json({
//             message: "User created successfully.",
//             user: userWithoutPassword,
//         });



//     } catch (error) {

//         console.error("Create User Error:", error);


//         res.status(500).json({
//             message: "Failed to create user.",
//             error: error.message,
//         });

//     }
// };
// const createUser = async (req, res) => {
//     try {

//         const {
//             firstName,
//             lastName,
//             email,
//             password,
//             phone,
//             roleId,
//         } = req.body;


//         if (!firstName || !lastName || !email || !password || !roleId) {
//             return res.status(400).json({
//                 message:
//                     "firstName, lastName, email, password and roleId are required.",
//             });
//         }


//         const existingUser = await prisma.user.findUnique({
//             where: {
//                 email,
//             },
//         });


//         if (existingUser) {
//             return res.status(409).json({
//                 message: "User already exists.",
//             });
//         }


//         const hashedPassword = await bcrypt.hash(password, 10);



//         // const user = await prisma.user.create({

//         //     data: {
//         //         firstName,
//         //         lastName,
//         //         email,
//         //         password: hashedPassword,
//         //         phone,
//         //         roleId: Number(roleId),
//         //     },

//         //     include: {
//         //         patient: true,
//         //         doctor: true,
//         //     },

//         // });

//         const user = await prisma.user.create({
//             data: {
//                 firstName,
//                 lastName,
//                 email,
//                 password: hashedPassword,
//                 phone,

//                 role: {
//                     connect: {
//                         id: Number(roleId),
//                     },
//                 },
//             },

//             include: {
//                 role: true,
//                 patient: true,
//                 doctor: true,
//             },
//         });



//         const {
//             password: removedPassword,
//             ...userData
//         } = user;



//         res.status(201).json({
//             message: "User created successfully.",
//             user: userData,
//         });



//     } catch (error) {

//         console.error("Create User Error:", error);

//         res.status(500).json({
//             message: "Failed to create user.",
//             error: error.message,
//         });

//     }
// };

// const createUser = async (req, res) => {
//     try {
//         const {
//             firstName,
//             lastName,
//             email,
//             password,
//             phone,
//             role,
//         } = req.body;

//         // Validate required fields
//         if (!firstName || !lastName || !email || !password || !role) {
//             return res.status(400).json({
//                 message:
//                     "firstName, lastName, email, password and role are required.",
//             });
//         }

//         // Validate role
//         const validRoles = ["ADMIN", "DOCTOR", "PATIENT"];

//         if (!validRoles.includes(role)) {
//             return res.status(400).json({
//                 message: "Invalid role.",
//             });
//         }

//         // Check if email already exists
//         const existingUser = await prisma.user.findUnique({
//             where: {
//                 email,
//             },
//         });

//         if (existingUser) {
//             return res.status(409).json({
//                 message: "User already exists.",
//             });
//         }

//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create User
//         const user = await prisma.user.create({
//             data: {
//                 firstName,
//                 lastName,
//                 email,
//                 password: hashedPassword,
//                 phone,
//                 role,
//             },

//             include: {
//                 patient: true,
//                 doctor: true,
//             },
//         });

//         // Remove password before returning response
//         const { password: removedPassword, ...userData } = user;

//         return res.status(201).json({
//             message: "User created successfully.",
//             user: userData,
//         });

//     } catch (error) {
//         console.error("Create User Error:", error);

//         return res.status(500).json({
//             message: "Failed to create user.",
//             error: error.message,
//         });
//     }
// };



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





// const getUserById = async (req, res) => {
//     try {
//         const { id } = req.params;


//         const user = await prisma.user.findUnique({
//             where: {
//                 id: Number(id),
//             },
//             include: {
//                 role: true,
//                 doctor: true,
//                 patient: true,
//             },
//         });


//         if (!user) {
//             return res.status(404).json({
//                 message: "User not found.",
//             });
//         }


//         res.status(200).json({
//             message: "User found.",
//             user,
//         });


//     } catch (error) {
//         console.error("Get User Error:", error);

//         res.status(500).json({
//             message: "Failed to retrieve user.",
//             error: error.message,
//         });
//     }
// };

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