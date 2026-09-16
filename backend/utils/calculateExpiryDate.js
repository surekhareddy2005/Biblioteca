const Holiday = require("../models/Holiday");

const calculateExpiryDate = async (startDate = new Date()) => {

    let expiryDate = new Date(startDate);

    // Add 24 Hours
    expiryDate.setDate(expiryDate.getDate() + 1);

    while (true) {

        const day = expiryDate.getDay();

        // Skip Saturday (6) and Sunday (0)
        if (day === 0 || day === 6) {
            expiryDate.setDate(expiryDate.getDate() + 1);
            continue;
        }

        // Check Holiday
        const startOfDay = new Date(expiryDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(expiryDate);
        endOfDay.setHours(23, 59, 59, 999);

        const holiday = await Holiday.findOne({
            date: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        });

        if (holiday) {
            expiryDate.setDate(expiryDate.getDate() + 1);
            continue;
        }

        break;
    }

    return expiryDate;
};

module.exports = calculateExpiryDate;