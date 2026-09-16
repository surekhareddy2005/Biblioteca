const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true,
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        reviewText: {
            type: String,
            default: "",
            trim: true,
            maxlength: 2000,
        },
    },
    {
        timestamps: true,
    }
);

// One review per student per book. Re-reviewing updates the existing review.
reviewSchema.index({ book: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);