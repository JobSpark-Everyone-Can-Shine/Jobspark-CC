const {
  handleSuccess,
  handleFailed,
  handleFailedPagination,
  handleSuccessPagination,
  checkAuth,
} = require("../utils/helper");
const pool = require("../models/db");
const { getProfileFunc } = require("./auth");
const { default: axios } = require("axios");
const baseURL = process.env.MODEL_URL;

async function getJobs(req, res) {
  const { search, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit) || 0;
  let filter = "";

  try {
    const isAuth = await checkAuth(req, res);
    if (isAuth === "Invalid or expired token") {
      return handleFailed(res, "Invalid or expired token", 401);
    }

    if (isAuth && !search) {
      const profile = await getProfileFunc(req, res);
      const response = await axios(`${baseURL}/recommend`, {
        method: "POST",
        data: {
          minat: profile.hobby,
          kemampuan: profile.special_ability,
          kondisi: profile.health_condition,
        },
      });

      const jobNameList = response.data?.data?.map(e => e.Nama_Pekerjaan) || [];
      const companyNameList = response.data?.data?.map(e => e.Perusahaan) || [];

      if (jobNameList.length === 0) {
        return handleFailedPagination(res, "No job recommendations found", 404);
      }

      const placeholdersJob = jobNameList.map(() => '?').join(',');
      const placeholdersCompany = companyNameList.map(() => '?').join(',');

      const jobsQuery = `
        SELECT id, job_name, image, company_name, location, 
               position, job_type, salary
        FROM jobs
        WHERE job_name IN (${placeholdersJob}) AND company_name IN (${placeholdersCompany})
        ORDER BY created_at DESC
      `;

      const [rows] = await pool.query(
        jobsQuery,
        [...jobNameList, ...companyNameList]
      );

      if (rows.length === 0) {
        return handleFailedPagination(res, "Jobs Is Empty", 404);
      }

      const paginationInfo = {
        total_data: rows.length,
        total_pages: 1,
        current_page: 1,
        limit: 9999,
      };

      return handleSuccessPagination(res, rows, paginationInfo);
    } else {
      if (search) {
        const likeSearch = `%${search}%`;
        filter = `
          WHERE job_name LIKE ? 
             OR company_name LIKE ? 
             OR job_description LIKE ?
        `;
      }

      const totalCountQuery = `
        SELECT COUNT(*) as count 
        FROM jobs 
        ${filter}
      `;

      const jobsQuery = `
        SELECT id, job_name, image, company_name, location, 
               position, job_type, salary
        FROM jobs
        ${filter}
        ORDER BY created_at DESC
        LIMIT ?
        OFFSET ?
      `;

      const queryParams = search
        ? [likeSearch, likeSearch, likeSearch, parseInt(limit), offset]
        : [parseInt(limit), offset];

      const countParams = search
        ? [likeSearch, likeSearch, likeSearch]
        : [];

      const [[totalCountResult], [rows]] = await Promise.all([
        pool.query(totalCountQuery, countParams),
        pool.query(jobsQuery, queryParams),
      ]);

      if (rows.length === 0) {
        return handleFailedPagination(res, "Jobs Is Empty", 404);
      }

      const totalData = totalCountResult[0]?.count || 0;

      const paginationInfo = {
        total_data: parseInt(totalData),
        total_pages: Math.ceil(totalData / parseInt(limit)),
        current_page: parseInt(page),
        limit: parseInt(limit),
      };

      return handleSuccessPagination(res, rows, paginationInfo);
    }
  } catch (err) {
    console.error(err.message);
    return handleFailedPagination(res);
  }
}

async function getJobDetail(req, res) {
  try {
    const id = req.params.id;
    const [rows] = await pool.query("SELECT * FROM jobs WHERE id = ?", [id]);

    if (rows.length === 0) {
      return handleFailed(res, "Job Not Found", 404, {});
    }

    handleSuccess(res, rows[0]);
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

async function applyJob(req, res) {
  try {
    const user_id = req.user.id;
    const { jobs_id, resume_id } = req.body;

    const [[jobExists]] = await pool.query("SELECT * FROM jobs WHERE id = ?", [jobs_id]);

    if (!jobExists) {
      return handleFailed(res, "Job not found", 404);
    }

    const [[existingApplication]] = await pool.query(
      "SELECT * FROM job_history WHERE user_id = ? AND jobs_id = ?",
      [user_id, jobs_id]
    );

    if (existingApplication) {
      return handleFailed(res, "You have already applied to this job", 400);
    }

    await pool.query(
      `INSERT INTO job_history (
        user_id, 
        jobs_id, 
        resume_id, 
        status
      ) 
      VALUES (?, ?, ?, ?)`,
      [user_id, jobs_id, resume_id, "PENDING"]
    );

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
