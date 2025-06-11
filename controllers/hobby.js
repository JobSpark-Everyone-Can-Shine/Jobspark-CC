const { handleSuccess, handleFailed } = require("../utils/helper");
const pool = require("../models/db"); // Harus mysql2/promise

async function getHobby(req, res) {
  try {
    const [rows] = await pool.query("SELECT id, hobby_name FROM hobby");

    if (rows.length === 0) {
      return handleFailed(res, "Hobby Is Empty", 404, []);
    }

    handleSuccess(res, rows);
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

module.exports = {
  getHobby
};
