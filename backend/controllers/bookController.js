const Book = require("../models/Book");
const mongoose=require("mongoose");

const addBook = async (req, res) => {
    try {
        const {
            title,
            author,
            isbn,
            branch,
            category,
            description,
            totalCopies,
            availableCopies,
            coverImage,
        } = req.body;

        const effectiveBranch = branch || category;

        if (
            !title ||
            !author ||
            !isbn ||
            !effectiveBranch ||
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
            branch: effectiveBranch,
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

        let {
            search,
            branch,
            sort,
            page = 1,
            limit = 10,
        } = req.query;

        // Query Object
        let query = {};

        // Search by Title, Author or ISBN
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { author: { $regex: search, $options: "i" } },
                { isbn: { $regex: search, $options: "i" } },
            ];
        }

        // Filter by Branch
        if (branch) {
            query.branch = branch;
        }

        // Sort Options
        let sortOption = {};

        if (sort === "asc") {
            sortOption.title = 1;
        } else if (sort === "desc") {
            sortOption.title = -1;
        } else if (sort === "newest") {
            sortOption.createdAt = -1;
        } else if (sort === "oldest") {
            sortOption.createdAt = 1;
        } else {
            sortOption.createdAt = -1;
        }

        // Pagination
        page = Number(page);
        limit = Number(limit);

        const skip = (page - 1) * limit;

        const books = await Book.find(query)
            .populate("createdBy", "name email role")
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        const totalBooks = await Book.countDocuments(query);

        res.status(200).json({
            totalBooks,
            currentPage: page,
            totalPages: Math.ceil(totalBooks / limit),
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