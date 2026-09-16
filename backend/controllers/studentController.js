const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const createStudent = async (req, res) => {
    try {

        const {
            name,
            rollNo,
            email,
            password,
            year,
            branch,
            block,
            profilePicture,
        } = req.body;

        // Validation
        if (
            !name ||
            !rollNo ||
            !email ||
            !password ||
            !year ||
            !branch
        ) {
            return res.status(400).json({
                message: "All required fields must be provided.",
            });
        }

        const rollExists = await Student.findOne({ rollNo });

        if (rollExists) {
            return res.status(400).json({
                message: "Roll Number already exists.",
            });
        }
        const emailExists = await Student.findOne({ email });

        if (emailExists) {
            return res.status(400).json({
                message: "Email already exists.",
            });
        }

      
        const hashedPassword = await bcrypt.hash(password, 10);

        
        const student = await Student.create({
            name,
            rollNo,
            email,
            password: hashedPassword,
            year,
            branch,
            block,
            profilePicture,
        });

        res.status(201).json({
            message: "Student created successfully.",
            student,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

const getAllStudents = async (req, res) => {
    try {

        let {
            search,
            year,
            branch,
            status,
            sort,
            page = 1,
            limit = 10,
        } = req.query;

        // Query Object
        let query = {};

        // Search
        if (search) {
            query.$or = [
                {
                    name: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    rollNo: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ];
        }

        // Filter by Year
        if (year) {
            query.year = Number(year);
        }

        // Filter by Branch
        if (branch) {
            query.branch = branch;
        }

        // Filter by Status
        if (status) {
            query.status = status;
        }

        // Sort
        let sortOption = {};

        if (sort === "asc") {
            sortOption.name = 1;
        } else if (sort === "desc") {
            sortOption.name = -1;
        } else if (sort === "newest") {
            sortOption.createdAt = -1;
        } else if (sort === "oldest") {
            sortOption.createdAt = 1;
        } else {
            sortOption.createdAt = -1;
        }

        page = Number(page);
        limit = Number(limit);

        const skip = (page - 1) * limit;

        const students = await Student.find(query)
            .select("-password")
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        const totalStudents = await Student.countDocuments(query);

        res.status(200).json({
            totalStudents,
            currentPage: page,
            totalPages: Math.ceil(totalStudents / limit),
            students,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

// Students fetching their own profile (fine balance, status, etc.) -
// scoped to req.user.id so a student can never fetch anyone else's record.
const getMyProfile = async (req, res) => {
    try {

        const student = await Student.findById(req.user.id).select("-password");

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found.",
            });
        }

        res.status(200).json(student);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

const getStudentById = async (req, res) => {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Student ID",
            });
        }

        const student = await Student.findById(id).select("-password");

        if (!student) {
            return res.status(404).json({
                message: "Student not found.",
            });
        }

        res.status(200).json(student);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};
const updateStudent = async (req, res) => {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Student ID",
            });
        }

        const student = await Student.findById(id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found.",
            });
        }

        const {
            name,
            year,
            branch,
            block,
            profilePicture,
        } = req.body;

        student.name = name ?? student.name;
        student.year = year ?? student.year;
        student.branch = branch ?? student.branch;
        student.block = block ?? student.block;
        student.profilePicture =
            profilePicture ?? student.profilePicture;

        await student.save();

        res.status(200).json({
            message: "Student updated successfully.",
            student,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

const blockStudent = async (req, res) => {
    try {

        const { id } = req.params;

        // Validate Student ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Student ID.",
            });
        }

        // Find Student
        const student = await Student.findById(id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found.",
            });
        }

        // Toggle Status
        if (student.status === "ACTIVE") {
            student.status = "BLOCKED";
        } else {
            student.status = "ACTIVE";
        }

        await student.save();

        res.status(200).json({
            message: `Student ${student.status.toLowerCase()} successfully.`,
            student,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

module.exports = {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    blockStudent,
    getMyProfile,
};