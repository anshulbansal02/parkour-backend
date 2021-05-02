const { Router } = require("express");
const { User } = require("../entities/index.js");

const { stringFields } = require("../utils/index.js");

const router = Router();

// Authentication Middlewares

const usernameTaken = async (username) => {
  return !!(await User.findOne({ username }));
};

router.get("/usernameTaken/:username", async (req, res, next) => {
  try {
    if (await usernameTaken(req.params.username))
      res.json({
        status: "OK",
        data: true,
      });
    else {
      res.json({
        status: "OK",
        data: false,
      });
    }
  } catch (err) {
    next(err);
  }
});
module.exports = router;
