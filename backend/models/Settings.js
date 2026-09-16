const mongoose = require("mongoose");

// Singleton document (always looked up/created with key: "GLOBAL") holding
// library-wide rules that used to be hardcoded - the fine charged per day
// overdue, and how many days a student gets before a book is due.
const settingsSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            default: "GLOBAL",
            unique: true,
        },

        finePerDay: {
            type: Number,
            required: true,
            min: 0,
            default: 10,
        },

        issueDurationDays: {
            type: Number,
            required: true,
            min: 1,
            default: 15,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Settings", settingsSchema);