const express = require("express");
const router = express.Router();

const { getSettings, updateSettings } = require("../controllers/settingsController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.get(
    "/",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    getSettings
);

router.put(
    "/",
    protect,
    authorize("SUPER_ADMIN"),
    updateSettings
);

module.exports = router;