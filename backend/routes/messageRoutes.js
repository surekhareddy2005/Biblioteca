const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getMessagesForBook,
    postMessage,
    reportMessage,
    deleteMessage,
    getReportedMessages,
    dismissReports,
} = require("../controllers/messageController");

// Admin moderation queue (must come before the /:id routes)
router.get(
    "/reported",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    getReportedMessages
);

// Public discussion thread for a book - anyone signed in can read/post
router.get(
    "/book/:bookId",
    protect,
    authorize("SUPER_ADMIN", "ADMIN", "STUDENT"),
    getMessagesForBook
);

router.post(
    "/book/:bookId",
    protect,
    authorize("SUPER_ADMIN", "ADMIN", "STUDENT"),
    postMessage
);

// Report a message
router.post(
    "/:id/report",
    protect,
    authorize("SUPER_ADMIN", "ADMIN", "STUDENT"),
    reportMessage
);

// Delete a message (moderation only)
router.delete(
    "/:id",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    deleteMessage
);

// Dismiss reports on a message (keep the message, clear the flag)
router.delete(
    "/:id/reports",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    dismissReports
);

module.exports = router;