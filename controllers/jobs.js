const {
  handleSuccess,
  handleFailed,
  handleFailedPagination,
  handleSuccessPagination,
  checkAuth,
} = require("../utils/helper");
const pool = require("../models/db");
const { method } = require("lodash");
const { getProfileFunc } = require("./auth");
const { default: axios } = require("axios");
const baseURL = process.env.MODEL_URL;

async function getJobs(req, res) {
  const { search, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit) || 0;
  let filter = "";

  try {
    const isAuth = await checkAuth(req, res);
    if (isAuth == "Invalid or expired token") {
      handleFailed(res, "Invalid or expired token", 401);
      return;
    }

    if (isAuth && !search) {
      const profile = await getProfileFunc(req, res);
      const response = await axios(`${baseURL}/recommend`, {
        method: "POST",
        data: {
          minat: profile.interest,
          kemampuan: profile.special_ability,
          kondisi: profile.health_condition,
        },
      });

      const jobNameList = response.data?.data?.map(e => e.Nama_Pekerjaan) || [];
      const companyNameList = response.data?.data?.map(e => e.Perusahaan) || [];
      
      if (jobNameList.length === 0) {
        return handleFailedPagination(res, "No job recommendations found", 404);
      }

      
      const jobsQuery = `
        SELECT id, job_name, image, company_name, location, 
               position, job_type, salary
        FROM jobs
        WHERE job_name = ANY($1) and company_name = ANY($2)
        ORDER BY created_at DESC
      `;

      const jobs = await pool.query(jobsQuery, [jobNameList, companyNameList]);

      if (jobs.rows.length === 0) {
        return handleFailedPagination(res, "Jobs Is Empty", 404);
      }

      const paginationInfo = {
        total_data: jobs.rows.length,
        total_pages: 1,
        current_page: 1,
        limit: 9999,
      };

      return handleSuccessPagination(res, jobs.rows, paginationInfo);
    } else {
      if (search) {
        filter = `WHERE job_name ILIKE '%${search}%' 
                    OR company_name ILIKE '%${search}%' 
                    OR job_description ILIKE '%${search}%'`;
      }

      const totalCountQuery = `
          SELECT COUNT(*) 
          FROM jobs 
          ${filter}
        `;

      const jobsQuery = `
          SELECT id, job_name, image, company_name, location, 
                 position, job_type, salary
          FROM jobs
          ${filter}
          ORDER BY created_at DESC
          LIMIT $1
          OFFSET $2
        `;

      const [totalCount, jobs] = await Promise.all([
        pool.query(totalCountQuery),
        pool.query(jobsQuery, [limit, offset]),
      ]);

      if (jobs.rows.length === 0) {
        return handleFailedPagination(res, "Jobs Is Empty", 404);
      }

      const paginationInfo = {
        total_data: parseInt(totalCount.rows[0].count),
        total_pages: Math.ceil(
          parseInt(totalCount.rows[0].count) / parseInt(limit)
        ),
        current_page: parseInt(page),
        limit: parseInt(limit),
      };
      handleSuccessPagination(res, jobs.rows, paginationInfo);

      return;
    }
  } catch (err) {
    console.error(err.message);
    return handleFailedPagination(res);
  }
}

async function getJobDetail(req, res) {
  try {
    const id = req.params.id;
    const job = await pool.query("SELECT * FROM jobs where id = $1", [id]);

    if (job.rows.length === 0) {
      return handleFailed(res, "Job Not Found", 404, {});
    }

    const jobResponse = { ...job.rows[0] };
    handleSuccess(res, jobResponse);
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

async function applyJob(req, res) {
  try {
    const user_id = req.user.id;
    const { jobs_id, resume_id } = req.body;

    const jobExists = await pool.query("SELECT * FROM jobs WHERE id = $1", [
      jobs_id,
    ]);

    if (jobExists.rows.length === 0) {
      return handleFailed(res, "Job not found", 404);
    }

    const existingApplication = await pool.query(
      "SELECT * FROM job_history WHERE user_id = $1 AND jobs_id = $2",
      [user_id, jobs_id]
    );

    if (existingApplication.rows.length > 0) {
      return handleFailed(res, "You have already applied to this job", 400);
    }

    await pool.query(
      `INSERT INTO job_history (
        user_id, 
        jobs_id, 
        resume_id, 
        status
      ) 
      VALUES ($1, $2, $3, $4);`,
      [user_id, jobs_id, resume_id, "PENDING"]
    );

    console.log(3);

    handleSuccess(res);
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

module.exports = {
  getJobs,
  getJobDetail,
  applyJob,
};
