const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// Create Admin (Super Admin access)
const createAdmin = async (req, res) => {
    try {
        const { name, email, password, role, profilePicture } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required.",
            });
        }

        const adminExists = await Admin.findOne({ email: email.toLowerCase() });

        if (adminExists) {
            return res.status(400).json({
                message: "Admin with this email already exists.",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await Admin.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || "ADMIN",
            profilePicture: profilePicture || "",
            status: "ACTIVE",
        });

        const adminResponse = admin.toObject();
        delete adminResponse.password;

        res.status(201).json({
            message: "Admin created successfully.",
            admin: adminResponse,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// Get All Admins with Filtering & Pagination
const getAllAdmins = async (req, res) => {
    try {
        let { search, role, status, sort, page = 1, limit = 10 } = req.query;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        if (role) {
            query.role = role;
        }

        if (status) {
            query.status = status;
        }

        let sortOption = { createdAt: -1 };
        if (sort === "asc") sortOption.name = 1;
        if (sort === "desc") sortOption.name = -1;
        if (sort === "oldest") sortOption.createdAt = 1;

        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit;

        const admins = await Admin.find(query)
            .select("-password")
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        const totalAdmins = await Admin.countDocuments(query);

        res.status(200).json({
            totalAdmins,
            currentPage: page,
            totalPages: Math.ceil(totalAdmins / limit),
            admins,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// Get Admin By ID
const getAdminById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Admin ID.",
            });
        }

        const admin = await Admin.findById(id).select("-password");

        if (!admin) {
            return res.status(404).json({
                message: "Admin not found.",
            });
        }

        res.status(200).json(admin);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// Update Admin
const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Admin ID.",
            });
        }

        const admin = await Admin.findById(id);

        if (!admin) {
            return res.status(404).json({
                message: "Admin not found.",
            });
        }

        const { name, email, role, profilePicture, password } = req.body;

        if (name) admin.name = name;
        if (email) admin.email = email.toLowerCase();
        if (role && ["SUPER_ADMIN", "ADMIN"].includes(role)) admin.role = role;
        if (profilePicture !== undefined) admin.profilePicture = profilePicture;

        if (password) {
            admin.password = await bcrypt.hash(password, 10);
        }

        await admin.save();

        const updatedAdmin = admin.toObject();
        delete updatedAdmin.password;

        res.status(200).json({
            message: "Admin updated successfully.",
            admin: updatedAdmin,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// Toggle Block / Activate Admin Status
const blockAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Admin ID.",
            });
        }

        const admin = await Admin.findById(id);

        if (!admin) {
            return res.status(404).json({
                message: "Admin not found.",
            });
        }

        // Prevent self-blocking
        if (req.user && req.user.id.toString() === id.toString()) {
            return res.status(400).json({
                message: "You cannot block your own admin account.",
            });
        }

        admin.status = admin.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
        await admin.save();

        res.status(200).json({
            message: `Admin status changed to ${admin.status.toLowerCase()} successfully.`,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                status: admin.status,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// Delete Admin
const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Admin ID.",
            });
        }

        if (req.user && req.user.id.toString() === id.toString()) {
            return res.status(400).json({
                message: "You cannot delete your own admin account.",
            });
        }

        const admin = await Admin.findByIdAndDelete(id);

        if (!admin) {
            return res.status(404).json({
                message: "Admin not found.",
            });
        }

        res.status(200).json({
            message: "Admin deleted successfully.",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    createAdmin,
    getAllAdmins,
    getAdminById,
    updateAdmin,
    blockAdmin,
    deleteAdmin,
};
