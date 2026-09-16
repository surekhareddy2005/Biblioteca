const mongoose = require("mongoose");
const Message = require("../models/Message");
const Book = require("../models/Book");
const Student = require("../models/Student");

// Helper: fetch a display name for whoever is posting/reporting.
// Admins/Super Admins are shown by their role, not their personal name,
// so the library staff speak with one consistent voice in the chat.
const getAuthorName = async (userId, role) => {
    if (role === "STUDENT") {
        const student = await Student.findById(userId);
        return student ? student.name : "Unknown Student";
    }
    if (role === "SUPER_ADMIN") {
        return "Super Admin";
    }
    return "Admin";
};

const isAdminRole = (role) => role === "ADMIN" || role === "SUPER_ADMIN";

// Shape a message for the response, hiding reporter identities from
// non-admins while still letting everyone know a message was reported.
const shapeMessage = (message, viewerIsAdmin) => {
    const obj = message.toObject();

    if (!viewerIsAdmin) {
        obj.reportCount = obj.reports ? obj.reports.length : 0;
        delete obj.reports;
    }

    return obj;
};

// GET /api/messages/book/:bookId - public discussion thread for a book
const getMessagesForBook = async (req, res) => {
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

        const messages = await Message.find({ book: bookId }).sort({
            createdAt: 1,
        });

        const viewerIsAdmin = isAdminRole(req.user.role);

        const shaped = messages.map((message) =>
            shapeMessage(message, viewerIsAdmin)
        );

        res.status(200).json({
            totalMessages: shaped.length,
            messages: shaped,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// POST /api/messages/book/:bookId - anyone (student or admin) can post
const postMessage = async (req, res) => {
    try {
        const { bookId } = req.params;
        const { content } = req.body;

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({
                message: "Invalid Book ID.",
            });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({
                message: "Message content is required.",
            });
        }

        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({
                message: "Book not found.",
            });
        }

        const authorName = await getAuthorName(req.user.id, req.user.role);

        const message = await Message.create({
            book: bookId,
            authorId: req.user.id,
            authorRole: req.user.role,
            authorName,
            content: content.trim(),
        });

        res.status(201).json({
            message: "Message posted successfully.",
            data: shapeMessage(message, isAdminRole(req.user.role)),
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// POST /api/messages/:id/report - anyone can flag a message for review
const reportMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Message ID.",
            });
        }

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                message: "A reason is required to report a message.",
            });
        }

        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({
                message: "Message not found.",
            });
        }

        if (isAdminRole(message.authorRole)) {
            return res.status(403).json({
                message: "Messages from library staff cannot be reported.",
            });
        }

        const alreadyReported = message.reports.some(
            (report) => report.reportedBy.toString() === req.user.id.toString()
        );

        if (alreadyReported) {
            return res.status(400).json({
                message: "You have already reported this message.",
            });
        }

        const reporterName = await getAuthorName(req.user.id, req.user.role);

        message.reports.push({
            reportedBy: req.user.id,
            reportedByRole: req.user.role,
            reportedByName: reporterName,
            reason: reason.trim(),
        });

        await message.save();

        res.status(200).json({
            message: "Message reported. Our admins will review it.",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// DELETE /api/messages/:id - admin only moderation action
const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Message ID.",
            });
        }

        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({
                message: "Message not found.",
            });
        }

        await message.deleteOne();

        res.status(200).json({
            message: "Message deleted successfully.",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// GET /api/messages/reported - admin moderation queue, across all books
const getReportedMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            "reports.0": { $exists: true },
        })
            .populate("book", "title author")
            .sort({ updatedAt: -1 });

        // Self-heal any older reports saved before we tracked reporter
        // names, so admins never see a bare "Unknown" reporter.
        for (const message of messages) {
            let changed = false;

            for (const report of message.reports) {
                if (!report.reportedByName || report.reportedByName === "Unknown") {
                    report.reportedByName = await getAuthorName(
                        report.reportedBy,
                        report.reportedByRole
                    );
                    changed = true;
                }
            }

            if (changed) {
                await message.save();
            }
        }

        const shaped = messages
            .map((message) => shapeMessage(message, true))
            .sort((a, b) => b.reportCount - a.reportCount);

        res.status(200).json({
            totalReported: shaped.length,
            messages: shaped,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// DELETE /api/messages/:id/reports - dismiss all reports on a message
// (a moderation false-alarm) without deleting the message or blocking anyone
const dismissReports = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Message ID.",
            });
        }

        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({
                message: "Message not found.",
            });
        }

        message.reports = [];
        await message.save();

        res.status(200).json({
            message: "Report dismissed. The message stays in the discussion.",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    getMessagesForBook,
    postMessage,
    reportMessage,
    deleteMessage,
    getReportedMessages,
    dismissReports,
};