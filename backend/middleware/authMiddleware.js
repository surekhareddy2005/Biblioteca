
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Student = require("../models/Student");

const protect = async (req, res, next) => {

    try {

        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                message: "Access Denied. No token provided.",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        let user;

        if (decoded.role === "STUDENT") {
            user = await Student.findById(decoded.id);
        } else {
            user = await Admin.findById(decoded.id);
        }

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists.",
            });
        }

        if (user.status === "BLOCKED") {
            return res.status(403).json({
                message: "Your account has been blocked.",
            });
        }

        req.user = {
            id: user._id,
            role: decoded.role,
        };

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or Expired Token",
        });

    }

};

module.exports = protect;