const { handleSuccess, handleFailed } = require("../utils/helper");
const pool = require("../models/db");

async function getHJobHist(req,res) {
    try {
      const user_id = req.user.id;
        const job_history = await pool.query('SELECT a.id, a.status, a.applied_at, b.job_name, b.image, b.company_name, b.location, b.position, b.job_type, b.salary FROM job_history a inner join jobs b on a.jobs_id = b.id where a.user_id = $1', [user_id]);
        const jobHistories = job_history.rows;
        handleSuccess(res, jobHistories);
      } catch (error) {
        console.error(error.message);
        return handleFailed(res);
      }
  }

  async function getJoHistbDetail(req, res) {
    try {
      const id = req.params.id;
      const job_history = await pool.query("SELECT a.id, a.status, a.applied_at, b.job_name, b.image, b.company_name, b.location, b.position, b.job_type, b.salary FROM job_history a inner join jobs b on a.jobs_id = b.id WHERE a.id = $1", [id]);
  
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