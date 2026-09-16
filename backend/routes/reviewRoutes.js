const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getReviewsForBook,
    upsertReview,
    deleteReview,
} = require("../controllers/reviewController");

router.get(
    "/book/:bookId",
    protect,
    authorize("SUPER_ADMIN", "ADMIN", "STUDENT"),
    getReviewsForBook
);

router.post(
    "/book/:bookId",
    protect,
    authorize("STUDENT"),
    upsertReview
);

router.delete(
    "/:id",
    protect,
    authorize("SUPER_ADMIN", "ADMIN", "STUDENT"),
    deleteReview
);

module.exports = router;