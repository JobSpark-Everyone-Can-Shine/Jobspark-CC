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

async function getChat(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM chat");

    if (rows.length === 0) {
      return handleFailed(res, "Chat Is Empty", 404, []);
    }

    handleSuccess(res, rows);
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

async function postChat(req, res) {
  try {
    const message = req.body.message;
    const name = req.body.name;

    if (!message || !name) {
      return handleFailed(res, "Message and Name are required", 400);
    }

    await pool.query("insert into chat (message, name) values (?, ?)", [message, name]);

    handleSuccess(res, "Insert Success");
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

module.exports = {
  healthCon,
  getChat,
  postChat
};
