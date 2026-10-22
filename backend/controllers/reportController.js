
const Report = require("../models/reportModel");

const getOverview = async (req, res) => {
  try {
    const report = await Report.getOverview();

    return res.status(200).json({
      message: "Admin report retrieved successfully",
      report
    });
  } catch (error) {
    console.error("Admin report error:", error.message);

    return res.status(500).json({
      message: "Unable to generate admin report"
    });
  }
};

const getMyReport = async (req, res) => {
  try {
    // The ID comes from the verified JWT, not the request body.
    const studentId = req.user.id;

    const report = await Report.getMyReport(studentId);

    return res.status(200).json({
      message: "Student report retrieved successfully",
      report
    });
  } catch (error) {
    console.error("Student report error:", error.message);

    return res.status(500).json({
      message: "Unable to generate student report"
    });
  }
};

module.exports = {
  getOverview,
  getMyReport
};
