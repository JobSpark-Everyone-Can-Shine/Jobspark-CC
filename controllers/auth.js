// controllers/userController.js
const pool = require("../models/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const {
  handleSuccess,
  handleFailed,
  formatDateToMySQL,
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        "user"
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

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateAbout,
  updatePassword,
  insertUserWorkExperience,
  getProfileFunc,
};
