const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const Student= require("../models/Student");
const generateToken = require("../utils/generateToken");

const createSuperAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const adminExists = await Admin.findOne({ email });

        if (adminExists) {
            return res.status(400).json({
                message: "Admin already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const superAdmin = await Admin.create({
            name,
            email,
            password: hashedPassword,
            role: "SUPER_ADMIN",
        });

        res.status(201).json({
            message: "Super Admin created successfully",
            superAdmin,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const login=async (req,res)=>{
    try{
    const{email,password,role} = req.body;

    if(!email || !password || !role){
        return res.status(400).json({
                message: "All fields are required",
            });
    }

    let user;

     if (role === "SUPER_ADMIN" || role === "ADMIN") {
            user = await Admin.findOne({ email });

            if (!user) {
                return res.status(404).json({
                    message: "Admin not found",
                });
            }

            if (user.role !== role) {
                return res.status(403).json({
                    message: "Invalid role",
                });
            }
        }

        else if (role === "STUDENT") {
            user = await Student.findOne({ email });

            if (!user) {
                return res.status(404).json({
                    message: "Student not found",
                });
            }

            if (user.status === "BLOCKED") {
                return res.status(403).json({
                    message: "Your account has been blocked",
                });
            }
        } else {
            return res.status(400).json({
                message: "Invalid role",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        const token = generateToken(user._id, role);

        res.status(200).json({
            message: "Login Successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role,
            },
        });
}
    catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }

}

module.exports = {
    createSuperAdmin,
    login,
};