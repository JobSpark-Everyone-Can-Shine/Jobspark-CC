const { handleSuccess, handleFailed } = require("../utils/helper");
const pool = require("../models/db");


async function healthCon (req, res) {
    try {
      const healthCon = await pool.query("SELECT id, health_condition FROM health_condition");
  
      if (healthCon.rows.length === 0) {
        return handleFailed(res, "Health Condition Is Empty", 404, []);
      }
      
      handleSuccess(res, healthCon.rows); 
    } catch (err) {
        console.error(err.message);
        return handleFailed(res);
    }
  }

  module.exports = {
    healthCon
  }