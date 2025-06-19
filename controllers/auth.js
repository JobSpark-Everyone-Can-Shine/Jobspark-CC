// controllers/userController.js
const pool = require("../models/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const {
  handleSuccess,
  handleFailed,
  formatDateToMySQL,
  handleSuccessPagination,
} = require("../utils/helper");

async function register(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      full_name,
      email,
      password,
      about_me,
      birth_date,
      gender,
      address,
      emergency_number,
      profile_img,
      hobby,
      special_ability,
      health_condition,
    } = req.body;

    console.log("req.body", req.body);
    const [userExists] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (userExists.length > 0) {
      return handleFailed(res, "User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [insertResult] = await pool.query(
      `INSERT INTO users (
        full_name, email, password, about_me, birth_date, gender,
        address, emergency_number, profile_img, hobby,
        special_ability, health_condition, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        email,
        hashedPassword,
        about_me,
        birth_date,
        gender,
        address,
        emergency_number,
        profile_img,
        hobby,
        special_ability,
        health_condition,
        "user",
      ]
    );

    const [newUserRows] = await pool.query(
      "SELECT id, full_name, email, created_at FROM users WHERE id = ?",
      [insertResult.insertId]
    );

    const payload = {
      user: {
        id: newUserRows[0].id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        handleSuccess(res, { ...newUserRows[0], token });
      }
    );
  } catch (err) {
    console.error(err.message);
    handleFailed(res, err.message);
  }
}

async function login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return handleFailed(res, errors.array(), 400);
    }

    const { email, password } = req.body;

    const [user] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (user.length === 0) {
      return handleFailed(res, "Invalid credentials", 400);
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return handleFailed(res, "Invalid credentials", 400);
    }

    const payload = {
      user: {
        id: user[0].id,
        role: user[0].role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        const userResponse = { ...user[0] };
        delete userResponse.password;
        handleSuccess(res, { ...userResponse, token });
      }
    );
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

async function logout(req, res) {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return handleFailed(res, "No token provided", 401);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await pool.query(
        `INSERT IGNORE INTO invalidated_tokens (token, user_id) VALUES (?, ?)`,
        [token, decoded.user.id]
      );

      await pool.query(
        `DELETE FROM invalidated_tokens WHERE invalidated_at < NOW() - INTERVAL 24 HOUR`
      );

      handleSuccess(res, { message: "Successfully logged out" });
    } catch (tokenError) {
      return handleFailed(res, "Invalid token", 401);
    }
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

async function getProfile(req, res) {
  try {
    const [user] = await pool.query("SELECT * FROM users WHERE id = ?", [
      req.user.id,
    ]);

    if (user.length === 0) {
      return handleFailed(res, "User not found", 404);
    }

    const userResponse = { ...user[0] };
    delete userResponse.password;

    handleSuccess(res, userResponse);
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

async function updateAbout(req, res) {
  try {
    const { about_me } = req.body;
    const [updateUser] = await pool.query(
      `UPDATE users 
       SET about_me = COALESCE(?, about_me), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [about_me, req.user.id]
    );

    if (updateUser.affectedRows === 0) {
      return handleFailed(res, "Bad Request", 400);
    }

    const [updatedUser] = await pool.query(
      "SELECT about_me FROM users WHERE id = ?",
      [req.user.id]
    );
    handleSuccess(res, updatedUser[0]);
  } catch (err) {
    console.error(err.message);
    handleFailed(res);
  }
}

async function updatePassword(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return handleFailed(res, errors.array(), 400);
    }

    const { old_password, new_password } = req.body;

    const [user] = await pool.query("SELECT password FROM users WHERE id = ?", [
      req.user.id,
    ]);

    if (user.length === 0) {
      return handleFailed(res, "Bad Request", 400);
    }

    const isMatch = await bcrypt.compare(old_password, user[0].password);
    if (!isMatch) {
      return handleFailed(res, "Password Not Same", 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      req.user.id,
    ]);

    handleSuccess(res);
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

async function insertUserWorkExperience(req, res) {
  try {
    const user_id = req.user.id;
    let { job_title, company, start_date, end_date, description } = req.body;

    if (start_date) start_date = formatDateToMySQL(start_date);
    if (end_date) end_date = formatDateToMySQL(end_date);

    await pool.query(
      "INSERT INTO user_work_experience (user_id, job_title, company, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?)",
      [user_id, job_title, company, start_date, end_date, description]
    );

    handleSuccess(res);
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

async function getProfileFunc(req, res) {
  try {
    const [user] = await pool.query("SELECT * FROM users WHERE id = ?", [
      req.user.id,
    ]);

    if (user.length === 0) {
      return handleFailed(res, "User not found", 404);
    }

    const userResponse = { ...user[0] };
    delete userResponse.password;

    return userResponse;
  } catch (err) {
    console.error(err.message);
    return false;
  }
}

// superadmin
async function getCompanyList(req, res) {
  try {
    const role = req.user.role;
    if (role !== "superadmin") {
      return handleFailed(res, "Unauthorized", 401);
    }

    // Get query parameters
    const { page = 1, limit = 10, name = "" } = req.query;
    const offset = (page - 1) * limit;

    // Build the query
    let query = "SELECT id, full_name as company_name, profile_img FROM users WHERE role = ?";
    const queryParams = ["admin"];

    // Add name filter if provided
    if (name) {
      query += " AND full_name LIKE ?";
      queryParams.push(`%${name}%`);
    }

    // Add pagination
    query += " LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    // Get paginated data
    const [users] = await pool.query(query, queryParams);

    if (users.length === 0) {
      return handleFailed(res, "Company not found", 404);
    }

    // Get total count for pagination info
    let countQuery = "SELECT COUNT(*) as total FROM users WHERE role = ?";
    const countParams = ["admin"];

    if (name) {
      countQuery += " AND full_name LIKE ?";
      countParams.push(`%${name}%`);
    }

    const [totalCount] = await pool.query(countQuery, countParams);
    const total = totalCount[0].total;

    const pagination = {
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    };

    handleSuccessPagination(res, users, pagination);
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

async function registerCompany(req, res) {
  try {
    const role = req.user.role;
    if (role !== "superadmin") {
      return handleFailed(res, "Unauthorized", 401);
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      full_name,
      email,
      password,
      address,
      emergency_number,
      profile_img,
    } = req.body;

    console.log("req.body", req.body);
    const [userExists] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (userExists.length > 0) {
      return handleFailed(res, "User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [insertResult] = await pool.query(
      `INSERT INTO users (
        full_name, email, password,
        address, emergency_number, profile_img, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        email,
        hashedPassword,
        address,
        emergency_number,
        profile_img,
        "admin",
      ]
    );

    const [newUserRows] = await pool.query(
      "SELECT id, full_name, email, created_at FROM users WHERE id = ?",
      [insertResult.insertId]
    );

    const payload = {
      user: {
        id: newUserRows[0].id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        handleSuccess(res, { ...newUserRows[0], token });
      }
    );
  } catch (err) {
    console.error(err.message);
    handleFailed(res, err.message);
  }
}

async function detailCompanyAdmin(req, res) {
  try {
    const role = req.user.role;
    const id = req.params.id;
    if (role !== "superadmin") {
      return handleFailed(res, "Unauthorized", 401);
    }

    const [company] = await pool.query(
      "SELECT id, full_name as company_name, email, address, emergency_number as phone, profile_img FROM users WHERE id = ? and role = ?",
      [id, "admin"]
    );

    console.log(id);

    if (company.length === 0) {
      return handleFailed(res, "company not found", 404);
    }

    handleSuccess(res, company[0]);
  } catch (err) {
    console.error(err.message);
    return handleFailed(res);
  }
}

async function deleteCompanyAdmin(req, res) {
  try{
    const role = req.user.role;
    if (role !== "superadmin") {
      return handleFailed(res, "Unauthorized", 401);
    }
    const id = req.params.id;
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    handleSuccess(res, "Company deleted successfully");
  }catch(err){
    console.error(err.message);
    return handleFailed(res);
  }
}

async function updateCompanyDetail(req, res) {
  try {
    const role = req.user.role;
    if (role !== "superadmin") {
      return handleFailed(res, "Unauthorized", 401);
    }
    const { full_name, email, address, emergency_number, profile_img } =
      req.body;

    // Ambil data user lama
    const [oldUserResult] = await pool.query(
      "SELECT email FROM users WHERE id = ?",
      [req.params.id]
    );
    const oldUser = oldUserResult[0];

    // Siapkan parameter dan query dinamis
    let query = "UPDATE users SET ";
    const params = [];
    const updates = [];

    // Tambahkan field yang akan diupdate
    if (full_name !== undefined) {
      updates.push("full_name = ?");
      params.push(full_name);
    }

    console.log(email, oldUser.email)

    // Hanya update email jika berbeda dengan yang lama dan tidak undefined
    if (email !== undefined && email !== oldUser.email) {
      updates.push("email = ?");
      params.push(email);
    }

    if (address !== undefined) {
      updates.push("address = ?");
      params.push(address);
    }

    if (emergency_number !== undefined) {
      updates.push("emergency_number = ?");
      params.push(emergency_number);
    }

    if (profile_img !== undefined) {
      updates.push("profile_img = ?");
      params.push(profile_img);
    }

    // Jika tidak ada field yang diupdate, kembalikan error
    if (updates.length === 0) {
      return handleFailed(res, "No fields to update", 400);
    }

    // Tambahkan updated_at dan where clause
    updates.push("updated_at = CURRENT_TIMESTAMP");
    query += updates.join(", ") + " WHERE id = ?";
    params.push(req.user.id);

    // Eksekusi query
    const [updateUser] = await pool.query(query, params);

    if (updateUser.affectedRows === 0) {
      return handleFailed(res, "Bad Request", 400);
    }

    handleSuccess(res, "");
  } catch (err) {
    console.error(err.message);
    if(err.message.includes(err.message)) return handleFailed(res, "Email Sudah Terdaftar", 400);
    handleFailed(res);
  }
}

// superadmin

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateAbout,
  updatePassword,
  insertUserWorkExperience,
  getProfileFunc,
  getCompanyList,
  registerCompany,
  detailCompanyAdmin,
  updateCompanyDetail,
  deleteCompanyAdmin
};
