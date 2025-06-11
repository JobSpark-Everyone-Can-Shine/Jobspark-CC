const { handleSuccess, handleFailed } = require("../utils/helper");
const pool = require("../models/db"); // Pastikan ini menggunakan mysql2/promise

async function healthCon(req, res) {
  try {
    const [rows] = await pool.query("SELECT id, health_condition FROM health_condition");

    if (rows.length === 0) {
      return handleFailed(res, "Health Condition Is Empty", 404, []);
    }

    handleSuccess(res, rows);
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

module.exports = {
  healthCon
};
