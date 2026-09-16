const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        rollNo: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        year: {
            type: Number,
            required: true,
            enum: [1, 2, 3, 4],
          },

        branch: {
            type: String,
           required: true,
            enum: [
        "CSE",
        "CSE-AIML",
        "CSE-DS",
        "CSE-CS",
        "IT",
        "ECE",
        "EEE",
        "MECH",
        "CIVIL"
             ],
          },

        status: {
            type: String,
            enum: ["ACTIVE", "BLOCKED"],
            default: "ACTIVE",
        },

        fine: {
            type: Number,
            default: 0,
        },

        profilePicture: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Student", studentSchema);