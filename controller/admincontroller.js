const { prisma } = require("../lib/prisma");

const jwt = require("jsonwebtoken");

const approveDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        const registrationId = Number(id);

        if (!Number.isInteger(registrationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration request ID.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | FIND REGISTRATION REQUEST
        |--------------------------------------------------------------------------
        */

        const request = await prisma.registrationRequest.findUnique({
            where: {
                id: registrationId,
            },
            include: {
                doctor: true,
            },
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Registration request not found.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | CHECK IF ALREADY APPROVED
        |--------------------------------------------------------------------------
        */

        if (request.status === "APPROVED") {
            return res.status(400).json({
                success: false,
                message: "Doctor has already been approved.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | GET USER
        |--------------------------------------------------------------------------
        */

        const doctor = request.doctor;

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found.",
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: doctor.userId,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Doctor user account not found.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | APPROVE DOCTOR
        |--------------------------------------------------------------------------
        */

        await prisma.$transaction(async (tx) => {

            // Approve registration request
            await tx.registrationRequest.update({
                where: {
                    id: registrationId,
                },
                data: {
                    status: "APPROVED",
                },
            });

            // Make doctor available
            await tx.doctor.update({
                where: {
                    id: doctor.id,
                },
                data: {
                    status: "AVAILABLE",
                },
            });

        });

        /*
        |--------------------------------------------------------------------------
        | GENERATE JWT
        |--------------------------------------------------------------------------
        */

        const token = jwt.sign(
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
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({
            success: true,
            message: "Doctor approved successfully.",

            token,

            userId: user.id,

            doctorId: doctor.id,

            data: {
                registrationRequestId: registrationId,
                doctorId: doctor.id,
                userId: user.id,
                registrationStatus: "APPROVED",
                doctorStatus: "AVAILABLE",
            },
        });

    } catch (error) {
        console.error("Approve Doctor Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};


// const approveDoctor = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const request = await prisma.registrationRequest.findUnique({
//             where: {
//                 id: Number(id),
//             },
//             include: {
//                 doctor: true,
//             },
//         });

//         if (!request) {
//             return res.status(404).json({
//                 message: "Registration request not found.",
//             });
//         }

//         if (request.status === "APPROVED") {
//             return res.status(400).json({
//                 message: "Doctor has already been approved.",
//             });
//         }

//         await prisma.$transaction(async (tx) => {
//             await tx.registrationRequest.update({
//                 where: {
//                     id: Number(id),
//                 },
//                 data: {
//                     status: "APPROVED",
//                 },
//             });

//             await tx.doctor.update({
//                 where: {
//                     id: request.doctorId,
//                 },
//                 data: {
//                     status: "AVAILABLE",
//                 },
//             });
//         });

//         return res.status(200).json({
//             success: true,
//             message: "Doctor approved successfully.",
//         });

//     } catch (error) {
//         console.error("Approve Doctor Error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Internal server error.",
//         });
//     }
// };

const rejectDoctor = async (req, res) => {
    try {

        const { id } = req.params;
        const { reason } = req.body;

        const request = await prisma.registrationRequest.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!request) {
            return res.status(404).json({
                message: "Registration request not found."
            });
        }

        await prisma.$transaction(async (tx) => {

            await tx.registrationRequest.update({
                where: {
                    id: Number(id)
                },
                data: {
                    status: "REJECTED"
                }
            });

            await tx.doctor.update({
                where: {
                    id: request.doctorId
                },
                data: {
                    status: "REJECTED"
                }
            });

        });

        return res.status(200).json({
            message: "Doctor registration rejected.",
            reason
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Internal server error."
        });

    }
};

const getPendingRequests = async (req, res) => {
    try {
        const requests = await prisma.registrationRequest.findMany({
            where: {
                status: "PENDING"
            },
            include: {
                doctor: {
                    include: {
                        user: true,
                        specialty: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            message: "Pending registration requests retrieved successfully.",
            data: requests
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error."
        });
    }

};

const verifyDoctor = async (req, res) => {
    try {
        const doctorId = Number(req.params.id);
        const { status, adminComment } = req.body;

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be APPROVED or REJECTED",
            });
        }

        const doctor = await prisma.doctor.findUnique({
            where: {
                id: doctorId,
            },

            include: {
                registration: true,
            },
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        if (!doctor.registration) {
            return res.status(400).json({
                success: false,
                message: "Doctor has no registration request",
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            const registration = await tx.registrationRequest.update({
                where: {
                    doctorId: doctorId,
                },

                data: {
                    status,
                    adminComment: adminComment || null,
                    processedAt: new Date(),
                },
            });

            const updatedDoctor = await tx.doctor.update({
                where: {
                    id: doctorId,
                },

                data: {
                    status: status === "APPROVED"
                        ? "AVAILABLE"
                        : "REJECTED",
                },
            });

            return {
                registration,
                doctor: updatedDoctor,
            };
        });

        return res.status(200).json({
            success: true,
            message:
                status === "APPROVED"
                    ? "Doctor credentials verified successfully"
                    : "Doctor registration rejected",

            data: result,
        });
    } catch (error) {
        console.error("Verify doctor error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to verify doctor",
        });
    }
};


module.exports = {
    approveDoctor,
    rejectDoctor,
    getPendingRequests,
    verifyDoctor
};