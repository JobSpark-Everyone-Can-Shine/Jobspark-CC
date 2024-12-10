// controllers/userController.js
const pool = require("../models/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { handleSuccess, handleFailed } = require("../utils/helper");

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

    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userExists.rows.length > 0) {
      return handleFailed(res, "User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO users (
              full_name, email, password, about_me, birth_date, gender,
              address, emergency_number, profile_img, hobby,
              special_ability, health_condition
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
          RETURNING id, full_name, email, created_at`,
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
      ]
    );

    const payload = {
      user: {
        id: newUser.rows[0].id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        handleSuccess(res, { ...newUser.rows[0], token });
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

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return handleFailed(res, "Invalid credentials", 400);
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return handleFailed(res, "Invalid credentials", 400);
    }

    const payload = {
      user: {
        id: user.rows[0].id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        const userResponse = { ...user.rows[0] };
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
        `INSERT INTO invalidated_tokens (token, user_id) 
               VALUES ($1, $2)
               ON CONFLICT (token) DO NOTHING`,
        [token, decoded.user.id]
      );

      await pool.query(
        `DELETE FROM invalidated_tokens 
               WHERE invalidated_at < NOW() - INTERVAL '24 hours'`
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
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.user.id,
    ]);

    if (user.rows.length === 0) {
      return handleFailed(res, "User not found", 404);
    }

    const userResponse = { ...user.rows[0] };
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
    const updateUser = await pool.query(
      `UPDATE users 
          SET 
          about_me = COALESCE($1, about_me),
          updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING about_me`,
      [about_me, req.user.id]
    );

    if (updateUser.rows.length === 0) {
      return handleFailed(res, "Bad Request", 400);
    }

    const userResponse = { ...updateUser.rows[0] };

    handleSuccess(res, userResponse);
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

    const user = await pool.query("SELECT password FROM users WHERE id = $1", [
      req.user.id,
    ]);

    if (user.rows.length === 0) {
      return handleFailed(res, "Bad Request", 400);
    }

    const isMatch = await bcrypt.compare(old_password, user.rows[0].password);
    if (!isMatch) {
      return handleFailed(res, "Password Not Same", 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await pool.query("update users set password = $1 WHERE id = $2", [
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
    const  user_id  = req.user.id;

    const { job_title, company, start_date, end_date, description } = req.body;

    await pool.query(
      "INSERT INTO user_work_experience (user_id, job_title, company, start_date, end_date, description) VALUES ($1, $2, $3, $4, $5, $6)",
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
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.user.id,
    ]);

    if (user.rows.length === 0) {
      return handleFailed(res, "User not found", 404);
    }

    const userResponse = { ...user.rows[0] };
    delete userResponse.password;

    return userResponse
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
  getProfileFunc
};
