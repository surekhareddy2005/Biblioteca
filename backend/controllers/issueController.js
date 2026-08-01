const mongoose = require("mongoose");

const Issue = require("../models/Issue");
const Student = require("../models/Student");
const Book = require("../models/Book");

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
     


     // calculate due date
     const issueDate = new Date();

    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate()+15);

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

const fine = lateDays > 0 ? lateDays * 10 : 0;


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

        await book.save();

        res.status(200).json({
            message: "Book returned successfully.",
            fine,
            issue,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};



module.exports = {
    issueBook,
    returnBook,

};