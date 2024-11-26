const { handleSuccess, handleFailed } = require("../utils/helper");
const pool = require("../models/db");


async function getSpecialAbility(req, res) {
    try {
      const specialAbility = await pool.query("SELECT id, special_ability FROM special_ability");
  
      if (specialAbility.rows.length === 0) {
        return handleFailed(res, "Special Ability Is Empty", 404, []);
      }
      
      handleSuccess(res, specialAbility.rows); 
    } catch (err) {
        console.error(err.message);
        return handleFailed(res);
    }
  }

  module.exports = {
    getSpecialAbility
  }