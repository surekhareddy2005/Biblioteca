const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const loginStudent = async (req, res) => {
    try {

        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                message: "Roll Number and Password are required.",
            });
        }

        // Find Student
        const student = await Student.findOne({ email });

        if (!student) {
            return res.status(404).json({
                message: "Student not found.",
            });
        }

        // Blocked Student
        if (student.status === "BLOCKED") {
            return res.status(403).json({
                message: "Your account has been blocked. Contact the library administrator.",
            });
        }

        // Compare Password
        const isMatch = await bcrypt.compare(
            password,
            student.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid credentials.",
            });
        }

        // Generate Token
        const token = jwt.sign(
            {
                id: student._id,
                role: "STUDENT",
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.status(200).json({
            message: "Student login successful.",
            token,
            student: {
                id: student._id,
                name: student.name,
                rollNo: student.rollNo,
                email: student.email,
                branch: student.branch,
                year: student.year,
            },
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

module.exports = {
    loginStudent,
};