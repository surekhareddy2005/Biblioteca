const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const {issueBook,returnBook,getAllIssues,getIssueById}=require("../controllers/issueController")

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

router.get(
    "/",
    protect,
    authorize("SUPER_ADMIN", "ADMIN", "STUDENT"),
    getAllIssues
);

router.get(
    "/:id",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    getIssueById
);



module.exports = router;