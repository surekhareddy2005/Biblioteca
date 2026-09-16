const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");


const {
    reserveBook,  getAllReservations,getReservationById , cancelReservation
} = require("../controllers/reservationController");

router.post(
    "/",
    protect,
    authorize("SUPER_ADMIN", "ADMIN", "STUDENT"),
    reserveBook
);

router.get(
    "/",
    protect,
    authorize("SUPER_ADMIN", "ADMIN", "STUDENT"),
    getAllReservations
);

router.get(
    "/:id",
    protect,
    authorize("SUPER_ADMIN", "ADMIN", "STUDENT"),
    getReservationById
);

router.put(
    "/cancel/:id",
    protect,
    authorize("SUPER_ADMIN", "ADMIN", "STUDENT"),
    cancelReservation
);


module.exports = router;