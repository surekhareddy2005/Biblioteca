const Holiday = require("../models/Holiday");

// Computes a book's due date as issueDate + durationDays, then rolls it
// forward (skipping Saturdays, Sundays, and registered holidays) until it
// lands on a day the library is actually open. This means the due date -
// and therefore the fine calculation and the "due tomorrow" reminder that
// follows it - never falls on a day the student had no way to act on.
const calculateDueDate = async (issueDate, durationDays) => {

    let dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + durationDays);

    while (true) {

        const day = dueDate.getDay();

        // Skip Saturday (6) and Sunday (0)
        if (day === 0 || day === 6) {
            dueDate.setDate(dueDate.getDate() + 1);
            continue;
        }

        const startOfDay = new Date(dueDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(dueDate);
        endOfDay.setHours(23, 59, 59, 999);

        const holiday = await Holiday.findOne({
            date: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        });

        if (holiday) {
            dueDate.setDate(dueDate.getDate() + 1);
            continue;
        }

        break;
    }

    return dueDate;
};

module.exports = calculateDueDate;