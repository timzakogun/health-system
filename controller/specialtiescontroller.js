const { prisma } = require("../lib/prisma");



const getSpecialties = async (req, res) => {
  try {
    const specialties = await prisma.specialty.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            doctors: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: specialties,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch specialties",
    });
  }
};


module.exports = {
    getSpecialties
}