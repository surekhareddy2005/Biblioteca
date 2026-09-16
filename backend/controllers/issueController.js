const mongoose = require("mongoose");
const Issue = require("../models/Issue");
const Student = require("../models/Student");
const Book = require("../models/Book");
const Reservation = require("../models/Reservation");
const calculateExpiryDate = require("../utils/calculateExpiryDate");
const calculateDueDate = require("../utils/calculateDueDate");
const sendEmail = require("../utils/sendEmail");
const { getOrCreateSettings } = require("./settingsController");

const issueBook = async (req, res) => {
    try {


        // check that fields are entered
        const { studentId, bookId } = req.body;

        if (!studentId || !bookId) {
            return res.status(400).json({
                message: "Student ID and Book ID are required.",
            });
        }


        // check that both the id's are in the format
        if (
            !mongoose.Types.ObjectId.isValid(studentId) ||
            !mongoose.Types.ObjectId.isValid(bookId)
        ) {
            return res.status(400).json({
                message: "Invalid Student ID or Book ID.",
            });
        }


        //check if the student is present
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                message: "Student not found.",
            });
        }


        //check if the student is active or not
        if (student.status === "BLOCKED") {
            return res.status(403).json({
                message: "Student account is blocked.",
            });
        }

        const book = await Book.findById(bookId);


        // check if the book is available
        if (!book) {
            return res.status(404).json({
                message: "Book not found.",
            });
        }


        //check for availablecopies
        if (book.availableCopies <= 0) {
            return res.status(400).json({
                message: "Book is currently unavailable.",
            });
        }

        //check for duplicatecopies
        const alreadyIssued = await Issue.findOne({
            student: studentId,
            book: bookId,
            status: "ISSUED",
        });
        if (alreadyIssued) {
            return res.status(400).json({
                message: "This book is already issued to the student.",
            });
        }


        // check for issue limit
        const issuedBooks = await Issue.countDocuments({
            student: studentId,
            status: "ISSUED",
        });

        if (issuedBooks >= 3) {
            return res.status(400).json({
                message: "Student has reached the maximum issue limit.",
            });
        }



        // calculate due date using the Super Admin's configured return
        // period, rolled forward past weekends/holidays so it always
        // lands on a day the library is actually open
        const settings = await getOrCreateSettings();

        const issueDate = new Date();

        const dueDate = await calculateDueDate(issueDate, settings.issueDurationDays);

        const issue = await Issue.create({
            student: studentId,
            book: bookId,
            issueDate,
            dueDate,
            issuedBy: req.user.id,
        });


        book.availableCopies--;

        await book.save();

        res.status(201).json({
            message: "Book issued successfully.",
            issue,
        });




    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};
const returnBook = async (req, res) => {
    try {

        const { id } = req.params;

        // Validate Issue ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Issue ID.",
            });
        }

        // Find Issue
        const issue = await Issue.findById(id);

        if (!issue) {
            return res.status(404).json({
                message: "Issue record not found.",
            });
        }

        // Already Returned
        if (issue.status === "RETURNED") {
            return res.status(400).json({
                message: "Book has already been returned.",
            });
        }

        // Find Book
        const book = await Book.findById(issue.book);

        if (!book) {
            return res.status(404).json({
                message: "Book not found.",
            });
        }

        // Return Date
        const returnDate = new Date();

        // Fine Calculation

        const dueDate = new Date(issue.dueDate);
        const returnedDate = new Date(returnDate);

        dueDate.setHours(0, 0, 0, 0);
        returnedDate.setHours(0, 0, 0, 0);

        const oneDay = 1000 * 60 * 60 * 24;

        const lateDays = Math.floor(
            (returnedDate - dueDate) / oneDay
        );

        const settings = await getOrCreateSettings();
        const fine = lateDays > 0 ? lateDays * settings.finePerDay : 0;


        const student = await Student.findById(issue.student);

        if (fine > 0) {
            student.fine += fine;
            await student.save();
        }

        // Update Issue
        issue.returnDate = returnDate;
        issue.status = "RETURNED";
        issue.fine = fine;
        issue.returnedBy = req.user.id;

        await issue.save();

        // Increase Available Copies
        book.availableCopies++;

        // Check Reservation Queue
        const reservation = await Reservation.findOne({
            book: book._id,
            status: "PENDING",
        })
            .populate("student", "name email")
            .populate("book", "title")
            .sort({
                reservationDate: 1,
            });

        if (reservation) {

            const expiryDate = await calculateExpiryDate(returnDate);

            reservation.status = "NOTIFIED";
            reservation.notificationDate = returnDate;
            reservation.expiryDate = expiryDate;

            await reservation.save();

               const formattedExpiry = reservation.expiryDate.toLocaleString("en-IN", {
                          dateStyle: "medium",
                        timeStyle: "short",
                         });
            
                        // Send Email
              await sendEmail(
    reservation.student.email,
    "Book Available for Collection",
    `Hello ${reservation.student.name},

Your reserved book "${reservation.book.title}" is now available.

Please collect it before:

${formattedExpiry}

Thank you,
Library Team`
);

        }

        await book.save();

        res.status(200).json({
            message: "Book returned successfully.",
            fine,
            issue,
            reservation,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};


// PUT /api/issues/:id/pay-fine - admin records that a student has paid off
// the fine for a specific returned book. Decrements the student's running
// balance (never below 0) so "Outstanding Fine" stays accurate, and keeps
// a per-record paid/unpaid trail instead of one opaque running total.
const markFinePaid = async (req, res) => {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Issue ID.",
            });
        }

        const issue = await Issue.findById(id);

        if (!issue) {
            return res.status(404).json({
                message: "Issue record not found.",
            });
        }

        if (!issue.fine || issue.fine <= 0) {
            return res.status(400).json({
                message: "This issue record has no fine to pay.",
            });
        }

        if (issue.finePaid) {
            return res.status(400).json({
                message: "This fine has already been marked as paid.",
            });
        }

        const student = await Student.findById(issue.student);

        if (!student) {
            return res.status(404).json({
                message: "Student not found.",
            });
        }

        issue.finePaid = true;
        issue.finePaidDate = new Date();
        issue.finePaidBy = req.user.id;
        await issue.save();

        student.fine = Math.max(0, student.fine - issue.fine);
        await student.save();

        res.status(200).json({
            message: `Fine of ₹${issue.fine} marked as paid.`,
            issue,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

const getAllIssues = async (req, res) => {
    try {

        let {
            search,
            status,
            sort,
            page = 1,
            limit = 10,
        } = req.query;

        page = Number(page);
        limit = Number(limit);

        let query = {};

        // Students may only ever see their own issue history, regardless
        // of any other filters they pass.
        if (req.user.role === "STUDENT") {
            query.student = req.user.id;
        }

        // Filter by Status
        if (status && status !== "OVERDUE") {
            query.status = status;
        }

        // Sort
        let sortOption = {};

        if (sort === "oldest") {
            sortOption.createdAt = 1;
        } else {
            sortOption.createdAt = -1;
        }

        const skip = (page - 1) * limit;

        let issues = await Issue.find(query)
            .populate("student", "name rollNo year branch")
            .populate("book", "title author")
            .populate("issuedBy", "name")
            .populate("returnedBy", "name")
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        const today = new Date();

        issues = issues.map((issue) => {

            const issueObj = issue.toObject();

            if (
                issueObj.status === "ISSUED" &&
                issueObj.dueDate < today
            ) {
                issueObj.displayStatus = "OVERDUE";
            } else {
                issueObj.displayStatus = issueObj.status;
            }

            return issueObj;
        });

        // Search
        if (search) {

            const value = search.toLowerCase();

            issues = issues.filter((issue) => {

                return (
                    issue.student.name.toLowerCase().includes(value) ||
                    issue.student.rollNo.toLowerCase().includes(value) ||
                    issue.book.title.toLowerCase().includes(value)
                );

            });

        }

        // Filter Overdue
        if (status === "OVERDUE") {

            issues = issues.filter(
                (issue) => issue.displayStatus === "OVERDUE"
            );

        }

        const totalIssues = issues.length;

        res.status(200).json({
            totalIssues,
            currentPage: page,
            totalPages: Math.ceil(totalIssues / limit),
            issues,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

const getIssueById = async (req, res) => {
    try {

        const { id } = req.params;

        // Validate Issue ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Issue ID.",
            });
        }

        // Find Issue
        const issue = await Issue.findById(id)
            .populate("student", "name rollNo email year branch block status fine")
            .populate("book", "title author isbn branch")
            .populate("issuedBy", "name email role")
            .populate("returnedBy", "name email role");

        if (!issue) {
            return res.status(404).json({
                message: "Issue record not found.",
            });
        }

        // Calculate Display Status
        const issueObj = issue.toObject();

        if (
            issueObj.status === "ISSUED" &&
            issueObj.dueDate < new Date()
        ) {
            issueObj.displayStatus = "OVERDUE";
        } else {
            issueObj.displayStatus = issueObj.status;
        }

        res.status(200).json(issueObj);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};



module.exports = {
    issueBook,
    returnBook,
    markFinePaid,
    getAllIssues,
    getIssueById,

};