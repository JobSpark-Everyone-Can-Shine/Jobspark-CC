const { body } = require("express-validator");
const jwt = require("jsonwebtoken");
const pool = require("../models/db");


const handleSuccess = (res, obj) => {
  res.status(200).send({
    status: 200,
    message: "SUCCESS",
    data: obj,
  });
};

const handleSuccessPagination = (res, data, pagination) => {
  res.status(200).send({
    status: 200,
    message: "SUCCESS",
    data,
    pagination,
  });
};

const handleFailed = (
  res,
  message = "Internal Server Error",
  statusCode = 500,
  obj = null
) => {
  res.status(statusCode).send({
    status: statusCode,
    message: message,
    data: obj,
  });
};

const handleFailedPagination = (
  res,
  message = "Internal Server Error",
  statusCode = 500,
  data = [],
  pagination = null
) => {
  res.status(statusCode).send({
    status: statusCode,
    message: message,
    data,
    pagination,
  });
};

const registerValidation = [
  body("full_name").not().isEmpty().trim().escape(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("birth_date").optional().isDate(),
  body("emergency_number").optional().isMobilePhone(),
  body("profile_img").optional().isURL(),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").not().isEmpty(),
];

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return handleFailed(res, "Access denied. No token provided", 401);
    }

    if (!authHeader.startsWith("Bearer ")) {
      return handleFailed(res, "Invalid token format. Use Bearer token", 401);
    }

    const token = authHeader.split(" ")[1];

    try {
      const invalidatedToken = await pool.query(
        "SELECT * FROM invalidated_tokens WHERE token = $1",
        [token]
      );

      if (invalidatedToken.rows.length > 0) {
        return handleFailed(res, "Token has been invalidated", 401);
      }
    } catch (err) {
      console.error(err.message);
      return handleFailed(res);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user;
      next();
    } catch (err) {
      return handleFailed(res, "Invalid or expired token", 401);
    }
  } catch (error) {
    return handleFailed(res, "Authentication error", 500);
  }
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};


const checkAuth = async (req, res) => {
  try {
    const authHeader = req.header("Authorization");

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user;
      return true
    } catch (err) {
      return "Invalid or expired token" 
    }
  } catch (error) {
    return false
  }
};

module.exports = {
  handleSuccess,
  handleSuccessPagination,
  handleFailed,
  handleFailedPagination,
  registerValidation,
  loginValidation,
  auth,
  formatBytes,
  checkAuth
};
