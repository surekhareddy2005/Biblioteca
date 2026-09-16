const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },

        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true,
        },

        issueDate: {
            type: Date,
            default: Date.now,
        },

        dueDate: {
            type: Date,
            required: true,
        },

        returnDate: {
            type: Date,
            default: null,
        },

        status: {
            type: String,
            enum: ["ISSUED", "RETURNED", "OVERDUE"],
            default: "ISSUED",
        },

        fine: {
            type: Number,
            default: 0,
        },

        finePaid: {
            type: Boolean,
            default: false,
        },

        finePaidDate: {
            type: Date,
            default: null,
        },

        finePaidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
        },

        // Set once the "book due tomorrow" reminder email has gone out,
        // so the daily cron never emails the same student twice for the
        // same loan even if it runs more than once on a given day.
        reminderSent: {
            type: Boolean,
            default: false,
        },

        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
        },

        returnedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Issue", issueSchema);