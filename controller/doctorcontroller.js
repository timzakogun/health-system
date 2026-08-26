const { prisma } = require("../lib/prisma");

/**
 * GET /api/doctors
 *
 * Get all verified and available doctors.
 *
 * Optional query parameters:
 * ?specialtyId=1
 * ?search=john
 */
const getDoctors = async (req, res) => {
  try {
    const { specialtyId, search } = req.query;

    // Validate specialtyId if supplied
    if (specialtyId && isNaN(Number(specialtyId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid specialty ID.",
      });
    }

    const doctors = await prisma.doctor.findMany({
      where: {
        // Doctor must be available
        status: "AVAILABLE",

        // Doctor's credentials must be approved
        registration: {
          status: "APPROVED",
        },

        // Filter by specialty when supplied
        ...(specialtyId
          ? {
              specialtyId: Number(specialtyId),
            }
          : {}),

        // Search by first or last name
        ...(search
          ? {
              user: {
                OR: [
                  {
                    firstName: {
                      contains: search,
                    },
                  },
                  {
                    lastName: {
                      contains: search,
                    },
                  },
                ],
              },
            }
          : {}),
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

        specialty: true,

        registration: {
          select: {
            status: true,
          },
        },
      },

      orderBy: {
        experience: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Doctors retrieved successfully.",
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error("Get Doctors Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve doctors.",
    });
  }
};


/**
 * GET /api/doctors/:id
 *
 * Get one verified doctor by ID.
 */
const getDoctorById = async (req, res) => {
  try {
    const doctorId = Number(req.params.id);

    if (isNaN(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID.",
      });
    }

    const doctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,

        // Doctor must be available
        status: "AVAILABLE",

        // Credentials must be approved
        registration: {
          status: "APPROVED",
        },
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

        specialty: true,

        registration: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or not verified.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor profile retrieved successfully.",
      data: doctor,
    });
  } catch (error) {
    console.error("Get Doctor By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve doctor profile.",
    });
  }
};


module.exports = {
  getDoctors,
  getDoctorById,
};