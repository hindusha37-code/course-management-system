
const express = require("express");
const router = express.Router();

const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getOverview,
  getMyReport
} = require("../controllers/reportController");

router.get(
  "/overview",
  roleMiddleware(["admin"]),
  getOverview
);

router.get(
  "/my",
  roleMiddleware(["student"]),
  getMyReport
);

module.exports = router;
