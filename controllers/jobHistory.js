const { handleSuccess, handleFailed } = require("../utils/helper");
const pool = require("../models/db"); // mysql2/promise pool

async function getHJobHist(req, res) {
  try {
    const user_id = req.user.id;

    const [rows] = await pool.query(
      `
      SELECT 
        a.id, a.status, c.file_path as resume_path, a.applied_at, 
        b.job_name, b.image, d.full_name as company_name, b.location, 
        b.position, b.job_type, b.salary 
      FROM job_history a 
      INNER JOIN jobs b ON a.jobs_id = b.id
      INNER JOIN resume c ON a.resume_id = c.id,
      INNER JOIN users d ON a.user_id = d.id
      WHERE a.user_id = ?
    `,
      [user_id]
    );

    handleSuccess(res, rows);
  } catch (error) {
    console.error(error.message);
    return handleFailed(res);
  }
}

async function getJoHistbDetail(req, res) {
  try {
    const id = req.params.id;

    const [rows] = await pool.query(
      `
      SELECT 
        a.id, a.status, c.file_path as resume_path, a.applied_at, 
        b.job_name, b.image, b.company_name, b.location, 
        b.position, b.job_type, b.salary 
      FROM job_history a 
      INNER JOIN jobs b ON a.jobs_id = b.id
      INNER JOIN resume c ON a.resume_id = c.id 
      WHERE a.id = ?
    `,
      [id]
    );

    if (rows.length === 0) {
      return handleFailed(res, "Job History Not Found", 404, {});
    }

    handleSuccess(res, rows[0]);
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

module.exports = {
  getHJobHist,
  getJoHistbDetail,
};
