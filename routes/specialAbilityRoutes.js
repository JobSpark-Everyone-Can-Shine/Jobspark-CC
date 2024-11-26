const express = require("express");
const router = express.Router();
const { auth } = require("../utils/helper");
const specialAbilityController = require("../controllers/specialAbility");

router.get("/", auth, specialAbilityController.getSpecialAbility);

module.exports = router;


