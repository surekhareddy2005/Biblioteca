const cron = require("node-cron");

const Reservation = require("../models/Reservation");


const calculateExpiryDate = require("./calculateExpiryDate");
const sendEmail = require("./sendEmail");

cron.schedule("* * * * *", async () => {

    console.log("Checking Expired Reservations...");

    try {

        const today = new Date();

        // Find all notified reservations whose expiry has passed
        const expiredReservations = await Reservation.find({
            status: "NOTIFIED",
            expiryDate: { $lt: today },
        }).populate("student", "name email")
        .populate("book", "title");

        for (const reservation of expiredReservations) {

            // Mark current reservation as expired
            reservation.status = "EXPIRED";

            await reservation.save();

            // Find next waiting student
            const nextReservation = await Reservation.findOne({
                book: reservation.book,
                status: "PENDING",
            })
                .sort({
                    reservationDate: 1,
                })
                .populate("student", "name email")
                .populate("book", "title");

            if (!nextReservation) {
                continue;
            }

            const notificationDate = new Date();

            const expiryDate = await calculateExpiryDate(notificationDate);

            nextReservation.status = "NOTIFIED";
            nextReservation.notificationDate = notificationDate;
            nextReservation.expiryDate = expiryDate;

            await nextReservation.save();

            const formattedExpiry = expiryDate.toLocaleString("en-IN", {
              dateStyle: "medium",
            timeStyle: "short",
             });

            // Send Email
               await sendEmail(
    nextReservation.student.email,
    "Book Available for Collection",
    `Hello ${nextReservation.student.name},

Your reserved book "${nextReservation.book.title}" is now available.

Please collect it before:

${formattedExpiry}

Thank you,
Library Team`
);

            console.log(
                `Notification sent to ${nextReservation.student.email}`
            );
        }

    } catch (error) {

        console.log(error.message);

    }

});
