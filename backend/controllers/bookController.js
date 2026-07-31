const Book = require("../models/Book");
const mongoose=require("mongoose");

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
const getBookById = async (req, res) => {
    try {

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Book ID"
            });
        }
        

        const book = await Book.findById(req.params.id)
            .populate("createdBy", "name email role");

        if (!book) {
            return res.status(404).json({
                message: "Book not found."
            });
        }

        res.status(200).json(book);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const updateBook = async (req, res) => {
    try {

        const { id } = req.params;

         if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Book ID"
            });
        }


        const updatedBook = await Book.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedBook) {
            return res.status(404).json({
                message: "Book not found."
            });
        }

        res.status(200).json({
            message: "Book updated successfully.",
            updatedBook,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};


const deleteBook = async (req, res) => {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Book ID",
            });
        }

        const book = await Book.findById(id);

        if (!book) {
            return res.status(404).json({
                message: "Book not found.",
            });
        }

        await book.deleteOne();

        res.status(200).json({
            message: "Book deleted successfully.",
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
    getBookById,
    updateBook,
    deleteBook,
};