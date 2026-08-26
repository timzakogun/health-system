const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token is required.",
      });
    }

    
    

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is required.",
      });
    }

    

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    /*
    |--------------------------------------------------------------------------
    | VALIDATE JWT PAYLOAD
    |--------------------------------------------------------------------------
    */

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token: user ID is missing.",
      });
    }

    if (!decoded.role) {
      return res.status(401).json({
        success: false,
        message: "Invalid token: user role is missing.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | ATTACH USER TO REQUEST
    |--------------------------------------------------------------------------
    */

    req.user = decoded;

    console.log("Authenticated user:", req.user);

    next();

  } catch (error) {
    console.error("JWT Error:", error.name);
    console.error("JWT Message:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token has expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid access token.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

module.exports = verifyToken;