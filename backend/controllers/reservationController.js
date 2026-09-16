const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Student = require("../models/Student");
const Book = require("../models/Book");
const Issue = require("../models/Issue");


const reserveBook = async (req, res) => {
    try {

        const { studentId, bookId } = req.body;

        //check for required fields
        if (!studentId || !bookId) {
            return res.status(400).json({
                message: "Student ID and Book ID are required.",
            });
        }


        //check for correct objectid's -- validate id's

        if (
            !mongoose.Types.ObjectId.isValid(studentId) ||
            !mongoose.Types.ObjectId.isValid(bookId)
        ) {
            return res.status(400).json({
                message: "Invalid Student ID or Book ID.",
            });
        }



        // check if student exist or not
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                message: "Student not found.",
            });
        }


        //check is student is blocked
        if (student.status === "BLOCKED") {
            return res.status(403).json({
                message: "Blocked students cannot reserve books.",
            });
        }


        // check if book exist
        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({
                message: "Book not found.",
            });
        }


        //check for no available copies
        if (book.availableCopies > 0) {
            return res.status(400).json({
                message: "Book is available. Please issue it instead of reserving.",
            });
        }


        // check the current student does not reserve the same book
        const alreadyReserved = await Reservation.findOne({
            student: studentId,
            book: bookId,
            status: {
                $in: ["PENDING", "NOTIFIED"],
            },
        });

        if (alreadyReserved) {
            return res.status(400).json({
                message: "Book already reserved.",
            });
        }


        //check the book is not issued 
        const alreadyIssued = await Issue.findOne({
            student: studentId,
            book: bookId,
            status: "ISSUED",
        });

        if (alreadyIssued) {
            return res.status(400).json({
                message: "Book is already issued to the student.",
            });
        }



        const reservation = await Reservation.create({
            student: studentId,
            book: bookId,
        });

        res.status(201).json({
            message: "Book reserved successfully.",
            reservation,
        });



    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};


const getAllReservations = async (req, res) => {
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

        // Filter
        if (status) {
            query.status = status;
        }

        // Sort
        let sortOption = {};

        if (sort === "newest") {
            sortOption.reservationDate = -1;
        } else {
            sortOption.reservationDate = 1;
        }

        const skip = (page - 1) * limit;

        let reservations = await Reservation.find(query)
            .populate("student", "name rollNo year branch")
            .populate("book", "title author")
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        // Search
        if (search) {

            const value = search.toLowerCase();

            reservations = reservations.filter((reservation) => {

                return (
                    reservation.student.name.toLowerCase().includes(value) ||
                    reservation.student.rollNo.toLowerCase().includes(value) ||
                    reservation.book.title.toLowerCase().includes(value) ||
                    reservation.book.author.toLowerCase().includes(value)
                );

            });

        }

        // Queue Position
       reservations = await Promise.all(
    reservations.map(async (reservation) => {

        const queue = await Reservation.find({
            book: reservation.book._id,
            status: {
                $in: ["PENDING", "NOTIFIED"],
            },
        }).sort({
            reservationDate: 1,
        });

        const position =
            queue.findIndex(
                (item) =>
                    item._id.toString() === reservation._id.toString()
            ) + 1;

        const reservationObj = reservation.toObject();

        reservationObj.queuePosition = position;

        return reservationObj;
    })
);

        const totalReservations = reservations.length;

        res.status(200).json({
            totalReservations,
            currentPage: page,
            totalPages: Math.ceil(totalReservations / limit),
            reservations,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

const getReservationById = async (req, res) => {
    try {

        const { id } = req.params;

        // Validate Reservation ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Reservation ID.",
            });
        }

        // Find Reservation
        const reservation = await Reservation.findById(id)
            .populate("student", "name rollNo email year branch block status")
            .populate("book", "title author isbn branch");

        if (!reservation) {
            return res.status(404).json({
                message: "Reservation not found.",
            });
        }

        res.status(200).json({
            reservation,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};


const cancelReservation = async (req, res) => {
    try {

        const { id } = req.params;

        // Validate Reservation ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Reservation ID.",
            });
        }

        // Find Reservation
        const reservation = await Reservation.findById(id);

        if (!reservation) {
            return res.status(404).json({
                message: "Reservation not found.",
            });
        }

        // Already Cancelled
        if (reservation.status === "CANCELLED") {
            return res.status(400).json({
                message: "Reservation is already cancelled.",
            });
        }

        // Already Collected
        if (reservation.status === "COLLECTED") {
            return res.status(400).json({
                message: "Collected reservation cannot be cancelled.",
            });
        }

        // Already Expired
        if (reservation.status === "EXPIRED") {
            return res.status(400).json({
                message: "Expired reservation cannot be cancelled.",
            });
        }

        // Cancel Reservation
        reservation.status = "CANCELLED";

        await reservation.save();

        res.status(200).json({
            message: "Reservation cancelled successfully.",
            reservation,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

module.exports = {
    reserveBook,
    getAllReservations,
    getReservationById,
    cancelReservation,

};