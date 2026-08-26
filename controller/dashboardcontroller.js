const { prisma } = require("../lib/prisma");


const getAdminDashboard = async (req, res) => {
    try {

        const [
            totalUsers,
            totalPatients,
            totalDoctors,
            pendingDoctors,
            availableDoctors,
            rejectedDoctors,
            recentUsers,
            pendingRequests,
            recentBookings
        ] = await Promise.all([

            // Total users
            prisma.user.count(),

            // Total patients
            prisma.user.count({
                where: {
                    role: "PATIENT"
                }
            }),

            // Total doctors
            prisma.user.count({
                where: {
                    role: "DOCTOR"
                }
            }),

            // Pending doctors
            prisma.doctor.count({
                where: {
                    status: "PENDING"
                }
            }),

            // Available doctors
            prisma.doctor.count({
                where: {
                    status: "AVAILABLE"
                }
            }),

            // Rejected doctors
            prisma.doctor.count({
                where: {
                    status: "REJECTED"
                }
            }),

            // Recent users
            prisma.user.findMany({
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    role: true,
                    createdAt: true
                },
                orderBy: {
                    createdAt: "desc"
                },
                take: 10
            }),

            // Pending doctor registration requests
            prisma.registrationRequest.findMany({
                where: {
                    status: "PENDING"
                },
                include: {
                    doctor: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    phone: true
                                }
                            },
                            specialty: true
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc"
                },
                take: 10
            }),

            // Recent bookings
            prisma.booking.findMany({
                include: {
                    patient: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    },

                    doctor: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true
                                }
                            },
                            specialty: true
                        }
                    }
                },

                orderBy: {
                    createdAt: "desc"
                },

                take: 10
            })

        ]);


        return res.status(200).json({

            success: true,

            message: "Admin dashboard retrieved successfully.",

            data: {

                statistics: {
                    totalUsers,
                    totalPatients,
                    totalDoctors,
                    pendingDoctors,
                    availableDoctors,
                    rejectedDoctors
                },

                recentUsers,

                pendingRequests,

                recentBookings

            }

        });

    } catch (error) {

        console.error(
            "Admin Dashboard Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Failed to retrieve admin dashboard data."

        });

    }
};



// =====================================================
// DOCTOR DASHBOARD
// =====================================================

const getDoctorDashboard = async (req, res) => {

    try {

        // authenticate middleware should provide req.user
        const userId = req.user.id;


        // Find doctor profile
        const doctor = await prisma.doctor.findUnique({

            where: {
                userId
            }

        });


        if (!doctor) {

            return res.status(404).json({

                success: false,

                message: "Doctor profile not found."

            });

        }


        // Date boundaries for today
        const startOfToday = new Date();

        startOfToday.setHours(
            0,
            0,
            0,
            0
        );


        const endOfToday = new Date();

        endOfToday.setHours(
            23,
            59,
            59,
            999
        );


        const [

            totalAppointments,

            pendingAppointments,

            completedAppointments,

            cancelledAppointments,

            todayAppointments,

            upcomingAppointments

        ] = await Promise.all([


            // Total appointments
            prisma.booking.count({

                where: {
                    doctorId: doctor.id
                }

            }),


            // Pending appointments
            prisma.booking.count({

                where: {
                    doctorId: doctor.id,
                    status: "PENDING"
                }

            }),


            // Completed appointments
            prisma.booking.count({

                where: {
                    doctorId: doctor.id,
                    status: "COMPLETED"
                }

            }),


            // Cancelled appointments
            prisma.booking.count({

                where: {
                    doctorId: doctor.id,
                    status: "CANCELLED"
                }

            }),


            // Today's appointments
            prisma.booking.findMany({

                where: {

                    doctorId: doctor.id,

                    bookingDate: {
                        gte: startOfToday,
                        lte: endOfToday
                    }

                },

                orderBy: {
                    bookingDate: "asc"
                },

                include: {

                    patient: {

                        include: {

                            user: {

                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    phone: true
                                }

                            }

                        }

                    }

                }

            }),


            // Upcoming appointments
            prisma.booking.findMany({

                where: {

                    doctorId: doctor.id,

                    bookingDate: {
                        gte: new Date()
                    }

                },

                orderBy: {
                    bookingDate: "asc"
                },

                take: 5,

                include: {

                    patient: {

                        include: {

                            user: {

                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    phone: true
                                }

                            }

                        }

                    }

                }

            })

        ]);


        return res.status(200).json({

            success: true,

            message: "Doctor dashboard retrieved successfully.",

            data: {

                statistics: {

                    totalAppointments,

                    pendingAppointments,

                    completedAppointments,

                    cancelledAppointments

                },

                todayAppointments,

                upcomingAppointments

            }

        });

    } catch (error) {

        console.error(
            "Doctor Dashboard Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Failed to retrieve doctor dashboard data."

        });

    }

};




const getPatientDashboard = async (req, res) => {

    try {

        // authenticate middleware should provide req.user
        const userId = req.user.id;


        // Find patient profile
        const patient = await prisma.patient.findUnique({

            where: {
                userId
            }

        });


        if (!patient) {

            return res.status(404).json({

                success: false,

                message: "Patient profile not found."

            });

        }


        const [

            totalBookings,

            upcomingBookings,

            completedBookings,

            cancelledBookings,

            nextAppointment,

            bookingHistory

        ] = await Promise.all([


            // Total bookings
            prisma.booking.count({

                where: {
                    patientId: patient.id
                }

            }),


            // Upcoming bookings
            prisma.booking.count({

                where: {

                    patientId: patient.id,

                    bookingDate: {
                        gte: new Date()
                    }

                }

            }),


            // Completed bookings
            prisma.booking.count({

                where: {

                    patientId: patient.id,

                    status: "COMPLETED"

                }

            }),


            // Cancelled bookings
            prisma.booking.count({

                where: {

                    patientId: patient.id,

                    status: "CANCELLED"

                }

            }),


            // Next appointment
            prisma.booking.findFirst({

                where: {

                    patientId: patient.id,

                    bookingDate: {
                        gte: new Date()
                    }

                },

                orderBy: {

                    bookingDate: "asc"

                },

                include: {

                    doctor: {

                        include: {

                            user: {

                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true
                                }

                            },

                            specialty: true

                        }

                    }

                }

            }),


            // Booking history
            prisma.booking.findMany({

                where: {

                    patientId: patient.id

                },

                orderBy: {

                    bookingDate: "desc"

                },

                take: 5,

                include: {

                    doctor: {

                        include: {

                            user: {

                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true
                                }

                            },

                            specialty: true

                        }

                    }

                }

            })

        ]);


        return res.status(200).json({

            success: true,

            message: "Patient dashboard retrieved successfully.",

            data: {

                statistics: {

                    totalBookings,

                    upcomingBookings,

                    completedBookings,

                    cancelledBookings

                },

                nextAppointment,

                bookingHistory

            }

        });

    } catch (error) {

        console.error(
            "Patient Dashboard Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Failed to retrieve patient dashboard data."

        });

    }

};



module.exports = {

    getAdminDashboard,

    getDoctorDashboard,

    getPatientDashboard

};