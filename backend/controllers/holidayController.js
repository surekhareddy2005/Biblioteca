const Holiday = require("../models/Holiday");
const mongoose = require("mongoose");

// Compares calendar dates only (ignores time-of-day), so "today" is
// allowed and anything strictly before today is rejected.
const isPastDate = (dateInput) => {
    const incoming = new Date(dateInput);
    incoming.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return incoming < today;
};

const createHoliday = async (req, res) => {
    try {

        const {
            date,
            name,
            description,
        } = req.body;

        if (!date || !name) {
            return res.status(400).json({
                message: "Date and Holiday Name are required.",
            });
        }

        if (isPastDate(date)) {
            return res.status(400).json({
                message: "Cannot add a holiday for a past date.",
            });
        }

        const holidayExists = await Holiday.findOne({
            date,
        });

        if (holidayExists) {
            return res.status(400).json({
                message: "Holiday already exists.",
            });
        }

        const holiday = await Holiday.create({
            date,
            name,
            description,
        });

        res.status(201).json({
            message: "Holiday created successfully.",
            holiday,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

const getAllHolidays = async (req, res) => {
    try {

        const holidays = await Holiday.find().sort({
            date: 1,
        });

        res.status(200).json({
            totalHolidays: holidays.length,
            holidays,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

const updateHoliday = async (req, res) => {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Holiday ID.",
            });
        }

        const holiday = await Holiday.findById(id);

        if (!holiday) {
            return res.status(404).json({
                message: "Holiday not found.",
            });
        }

        const {
            date,
            name,
            description,
        } = req.body;

        if (date && isPastDate(date)) {
            return res.status(400).json({
                message: "Cannot move a holiday to a past date.",
            });
        }

        if (date) holiday.date = date;
        if (name) holiday.name = name;
        if (description !== undefined)
            holiday.description = description;

        await holiday.save();

        res.status(200).json({
            message: "Holiday updated successfully.",
            holiday,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

const deleteHoliday = async (req, res) => {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Holiday ID.",
            });
        }

        const holiday = await Holiday.findById(id);

        if (!holiday) {
            return res.status(404).json({
                message: "Holiday not found.",
            });
        }

        await holiday.deleteOne();

        res.status(200).json({
            message: "Holiday deleted successfully.",
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

module.exports = {
    createHoliday,
    getAllHolidays,
    updateHoliday,
    deleteHoliday,
};