const { handleSuccess, handleFailed } = require("../utils/helper");
const pool = require("../models/db");

async function getHJobHist(res) {
    try {
        const job_history = await pool.query('SELECT * FROM job_history');
        const jobHistories = job_history.rows;
        res.status(200).json(jobHistories);
      } catch (error) {
        res.status(500).json({ message: 'Error retrieving job history', error });
      }
  }

  async function getJoHistbDetail(req, res) {
    try {
      const id = req.params.id;
      const job_history = await pool.query("SELECT * FROM job_history where id = $1", [id]);
  
      if (job_history.rows.length === 0) {
        return handleFailed(res, "Job History Not Found", 404, {});
      }
      const job_historyResponse = { ...job_history.rows[0] };
      handleSuccess(res, job_historyResponse);
    } catch (err) {
      console.error(err.message);
      return handleFailed(res);
    }
  }


  module.exports = {
    getHJobHist,
    getJoHistbDetail
  }