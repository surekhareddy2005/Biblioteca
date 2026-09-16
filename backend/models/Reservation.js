const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
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

        reservationDate: {
            type: Date,
            default: Date.now,
        },

        notificationDate: {
            type: Date,
            default: null,
        },

        expiryDate: {
            type: Date,
            default: null,
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "NOTIFIED",
                "COLLECTED",
                "EXPIRED",
                "CANCELLED",
            ],
            default: "PENDING",
        },
    },
    {
        timestamps: true,
    }
);



module.exports = mongoose.model(
    "Reservation",
    reservationSchema,
   
);