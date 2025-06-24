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

      const jobNameList =
        response.data?.data?.map((e) => e.Nama_Pekerjaan) || [];
      const companyNameList =
        response.data?.data?.map((e) => e.Perusahaan) || [];

      if (jobNameList.length === 0) {
        return handleFailedPagination(res, "No job recommendations found", 404);
      }

      const placeholdersJob = jobNameList.map(() => "?").join(",");
      const placeholdersCompany = companyNameList.map(() => "?").join(",");

      const jobsQuery = `
        SELECT a.id, a.job_name, a.image, b.full_name as company_name, a.location, 
               a.position, a.job_type, a.salary
        FROM jobs a
        inner join users b
        on a.company_id = b.id
        WHERE job_name IN (${placeholdersJob}) AND company_name IN (${placeholdersCompany}) and a.status = 'ACTIVE'
        ORDER BY created_at DESC
      `;

      const [rows] = await pool.query(jobsQuery, [
        ...jobNameList,
        ...companyNameList,
      ]);

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
        filter = `
          and a.job_name LIKE ? 
             OR b.full_name LIKE ? 
             OR a.job_description LIKE ?'
        `;
      }

      const totalCountQuery = `
        SELECT COUNT(*) as count  
        FROM jobs where status = 'ACTIVE'
        ${filter}
      `;

      const jobsQuery = `
        SELECT a.id, a.job_name, a.image, b.full_name as company_name, a.location, 
               a.position, a.job_type, a.salary
        FROM jobs a
        inner join users b
        on a.company_id = b.id
        where a.status = 'ACTIVE'
        ${filter}
        ORDER BY a.created_at DESC
        LIMIT ?
        OFFSET ?
      `;

      console.log(jobsQuery)

      const queryParams = search
        ? [likeSearch, likeSearch, likeSearch, parseInt(limit), offset]
        : [parseInt(limit), offset];

      const countParams = search ? [likeSearch, likeSearch, likeSearch] : [];

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

async function getJobAdmin(req, res) {
  try {
    const id = req.user.id;
    const role = req.user.role;
     if (role !== "admin") {
      return handleFailed(res, "Unauthorized", 401);
    }
    const [rows] = await pool.query(
      "SELECT a.id, a.job_name, a.image, b.full_name as company_name, a.location, a.position, a.job_type, a.salary from jobs a inner join users b on a.company_id = b.id WHERE a.company_id = ? and a.status = ?",
      [id, "ACTIVE"]
    );

    if (rows.length === 0) {
      return handleFailed(res, "Job Not Found", 404, {});
    }

    handleSuccess(res, rows);
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

async function getJobDetailAdmin(req, res) {
  try{
    const id = req.params.id
    const role = req.user.role;
    if (role !== "admin") {
      return handleFailed(res, "Unauthorized", 401);
    }

    const [applicant] = await pool.query(
      `SELECT a.id, a.status, a.applied_at, b.full_name, b.health_condition, b.hobby, b.special_ability, c.file_path as resume_path FROM job_history a 
      inner join users b 
      on a.user_id = b.id 
      inner join resume c 
      on a.resume_id = c.id 
      inner join jobs d
      on a.jobs_id = d.id
      WHERE d.id = ?`,
      [id]
    );

    const [rows] = await pool.query(
      `SELECT a.id, a.job_name, a.job_description, a.image, b.full_name as company_name, a.location, a.min_experience, a.position, a.job_type, a.salary, a.created_at from jobs a 
      inner join users b 
      on a.company_id = b.id 
      WHERE a.id = ? and a.status = ?`,
      [id, "ACTIVE"]
    );

    if (rows.length === 0) {
      return handleFailed(res, "Job Not Found", 404, {});
    }

    handleSuccess(res, {...rows[0], applicant});
  } catch(err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

async function setStatusJobApplicationAdmin(req, res) {
  try{
    const {id, status} = req.body;
    const role = req.user.role;
    if (role !== "admin") {
      return handleFailed(res, "Unauthorized", 401);
    }

    if(status !== "APPROVE" && status !== "REJECT") {
      return handleFailed(res, "Status Not Valid", 400);
    }

    await pool.query("UPDATE job_history SET status = ? WHERE id = ?", [status, id]);
    handleSuccess(res, "Set Status Success");
  } catch(err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

async function insertJobAdmin(req, res) {
  try {
    const id = req.user.id;
    const role = req.user.role;
    const {
      job_name,
      image,
      job_description,
      location,
      position,
      qualification,
      min_experience,
      job_type,
      salary,
    } = req.body;

    if (role !== "admin") {
      return handleFailed(res, "Unauthorized", 401);
    }

    const [rows] = await pool.query(
      "INSERT INTO jobs (company_id, job_name, image, job_description, location, position, qualification, min_experience, job_type, salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, job_name, image, job_description, location, position, qualification, min_experience, job_type, salary]
    );

    handleSuccess(res, "Insert Success");
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

async function deleteJobAdmin(req, res) {
  try {
    const id = req.params.id;
    const role = req.user.role;
    const company_id = req.user.id;
    if(role !== "admin") {
      return handleFailed(res, "Unauthorized", 401);
    }
    await pool.query("UPDATE jobs SET status = ? WHERE id = ? and company_id = ?", ["INACTIVE", id, company_id]);
    handleSuccess(res, "Delete Success");
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
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

    const [[jobExists]] = await pool.query("SELECT * FROM jobs WHERE id = ?", [
      jobs_id,
    ]);

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
  getJobAdmin,
  insertJobAdmin,
  deleteJobAdmin,
  getJobDetailAdmin,
  setStatusJobApplicationAdmin
};
