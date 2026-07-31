const express = require("express");

const router = express.Router();

const { addBook,getAllBooks,getBookById } = require("../controllers/bookController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.post(
    "/",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    addBook
);

router.get(
    "/",
    protect,
    authorize("SUPER_ADMIN", "ADMIN", "STUDENT"),
    getAllBooks
);

router.get(
    "/:id",
    protect,
    authorize("SUPER_ADMIN", "ADMIN", "STUDENT"),
    getBookById
),

module.exports = router;