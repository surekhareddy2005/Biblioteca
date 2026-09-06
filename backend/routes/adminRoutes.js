const express = require("express");
const router = express.Router();

const {
    createAdmin,
    getAllAdmins,
    getAdminById,
    updateAdmin,
    blockAdmin,
    deleteAdmin,
} = require("../controllers/adminController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// All admin management routes require SUPER_ADMIN authorization
router.use(protect);
router.use(authorize("SUPER_ADMIN"));

router.post("/", createAdmin);
router.get("/", getAllAdmins);
router.get("/:id", getAdminById);
router.put("/:id", updateAdmin);
router.put("/block/:id", blockAdmin);
router.delete("/:id", deleteAdmin);

module.exports = router;
