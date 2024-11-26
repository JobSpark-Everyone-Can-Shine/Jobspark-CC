const { handleSuccess, handleFailed } = require("../utils/helper");
const pool = require("../models/db");


async function getHobby(req, res) {
    try {
      const hobby = await pool.query("SELECT id, hobby_name FROM hobby");
  
      if (hobby.rows.length === 0) {
        return handleFailed(res, "Hobby Is Empty", 404, []);
      }
      
      const hobbyResponse = hobby.rows;
      handleSuccess(res, hobbyResponse);
    } catch (err) {
      console.error(err.message);
      return handleFailed(res);
    }
  }

  module.exports = {
    getHobby
  }