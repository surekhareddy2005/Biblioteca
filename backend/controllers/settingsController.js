const Settings = require("../models/Settings");

// Fetches the singleton settings document, creating it with defaults
// the very first time it's needed (fresh installs, or before any Super
// Admin has visited the settings page yet).
const getOrCreateSettings = async () => {
    let settings = await Settings.findOne({ key: "GLOBAL" });

    if (!settings) {
        settings = await Settings.create({ key: "GLOBAL" });
    }

    return settings;
};

// GET /api/settings - view current fine/issue-duration rules
const getSettings = async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// PUT /api/settings - Super Admin updates the fine/issue-duration rules
const updateSettings = async (req, res) => {
    try {
        const { finePerDay, issueDurationDays } = req.body;

        if (finePerDay === undefined && issueDurationDays === undefined) {
            return res.status(400).json({
                message: "Provide at least one of finePerDay or issueDurationDays to update.",
            });
        }

        if (finePerDay !== undefined) {
            const numericFine = Number(finePerDay);
            if (Number.isNaN(numericFine) || numericFine < 0) {
                return res.status(400).json({
                    message: "Fine per day must be a number greater than or equal to 0.",
                });
            }
        }

        if (issueDurationDays !== undefined) {
            const numericDays = Number(issueDurationDays);
            if (!Number.isInteger(numericDays) || numericDays < 1) {
                return res.status(400).json({
                    message: "Return period must be a whole number of at least 1 day.",
                });
            }
        }

        const settings = await getOrCreateSettings();

        if (finePerDay !== undefined) settings.finePerDay = Number(finePerDay);
        if (issueDurationDays !== undefined) settings.issueDurationDays = Number(issueDurationDays);
        settings.updatedBy = req.user.id;

        await settings.save();

        res.status(200).json({
            message: "Library settings updated successfully.",
            settings,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getOrCreateSettings,
};