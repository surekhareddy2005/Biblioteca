const express = require("express");

const router = express.Router();

const {
    createHoliday,
    getAllHolidays,
    updateHoliday,
    deleteHoliday,
} = require("../controllers/holidayController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.post(
    "/",
    protect,
    authorize("SUPER_ADMIN"),
    createHoliday
);

router.get(
    "/",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    getAllHolidays
);

router.put(
    "/:id",
    protect,
    authorize("SUPER_ADMIN"),
    updateHoliday
);

router.delete(
    "/:id",
    protect,
    authorize("SUPER_ADMIN"),
    deleteHoliday
);

module.exports = router;