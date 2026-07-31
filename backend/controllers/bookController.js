const Book = require("../models/Book");

const addBook = async (req, res) => {
    try {
        const {
            title,
            author,
            isbn,
            branch,
            description,
            totalCopies,
            availableCopies,
            coverImage,
        } = req.body;

        if (
            !title ||
            !author ||
            !isbn ||
            !branch ||
            !totalCopies ||
            availableCopies === undefined
        ) {
            return res.status(400).json({
                message: "All required fields must be provided.",
            });
        }

        // Check Duplicate ISBN
        const bookExists = await Book.findOne({ isbn });

        if (bookExists) {
            return res.status(400).json({
                message: "Book with this ISBN already exists.",
            });
        }

        // Create Book
        const book = await Book.create({
            title,
            author,
            isbn,
            branch,
            description,
            totalCopies,
            availableCopies,
            coverImage,
            createdBy: req.user.id,
        });

        res.status(201).json({
            message: "Book added successfully.",
            book,
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const getAllBooks = async (req, res) => {
    try {

        const books = await Book.find().populate(
            "createdBy",
            "name email role"
        );

        res.status(200).json({
            count: books.length,
            books,
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    addBook,
    getAllBooks,
};