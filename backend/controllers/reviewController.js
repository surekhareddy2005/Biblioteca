const mongoose = require("mongoose");
const Review = require("../models/Review");
const Book = require("../models/Book");
const Issue = require("../models/Issue");

// GET /api/reviews/book/:bookId - list reviews + rating summary for a book
const getReviewsForBook = async (req, res) => {
    try {
        const { bookId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({
                message: "Invalid Book ID.",
            });
        }

        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({
                message: "Book not found.",
            });
        }

        const reviews = await Review.find({ book: bookId })
            .populate("student", "name rollNo branch")
            .sort({ createdAt: -1 });

        const totalReviews = reviews.length;

        const averageRating =
            totalReviews === 0
                ? 0
                : reviews.reduce((sum, review) => sum + review.rating, 0) /
                  totalReviews;

        let myReview = null;

        if (req.user.role === "STUDENT") {
            const mine = reviews.find(
                (review) =>
                    review.student &&
                    review.student._id.toString() === req.user.id.toString()
            );
            myReview = mine || null;
        }

        res.status(200).json({
            totalReviews,
            averageRating: Number(averageRating.toFixed(2)),
            myReview,
            reviews,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// POST /api/reviews/book/:bookId - student creates or updates their review
const upsertReview = async (req, res) => {
    try {
        const { bookId } = req.params;
        const { rating, reviewText } = req.body;

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({
                message: "Invalid Book ID.",
            });
        }

        const numericRating = Number(rating);

        if (!numericRating || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({
                message: "Rating must be a number between 1 and 5.",
            });
        }

        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({
                message: "Book not found.",
            });
        }

        // Only students who have actually issued (currently or previously)
        // this book are allowed to rate/review it.
        const hasTakenBook = await Issue.findOne({
            student: req.user.id,
            book: bookId,
            status: { $in: ["ISSUED", "RETURNED"] },
        });

        if (!hasTakenBook) {
            return res.status(403).json({
                message:
                    "You can only rate or review a book after issuing it from the library.",
            });
        }

        const review = await Review.findOneAndUpdate(
            { book: bookId, student: req.user.id },
            {
                rating: numericRating,
                reviewText: (reviewText || "").trim(),
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        ).populate("student", "name rollNo branch");

        res.status(200).json({
            message: "Review submitted successfully.",
            review,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// DELETE /api/reviews/:id - student can remove their own review,
// admins can remove any review as a moderation action
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Review ID.",
            });
        }

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                message: "Review not found.",
            });
        }

        const isOwner = review.student.toString() === req.user.id.toString();
        const isAdmin = req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: "You are not authorized to delete this review.",
            });
        }

        await review.deleteOne();

        res.status(200).json({
            message: "Review deleted successfully.",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    getReviewsForBook,
    upsertReview,
    deleteReview,
};