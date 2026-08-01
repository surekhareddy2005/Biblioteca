const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const {issueBook,returnBook}=require("../controllers/issueController")

router.post(
    "/",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    issueBook
);

router.put(
    "/:id",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    returnBook
);


module.exports = router;