const express = require("express");

const router = express.Router();

const { addBook,getAllBooks } = require("../controllers/bookController");

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

module.exports = router;