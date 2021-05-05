const { Router } = require("express");

const { User } = require("../entities/index.js");
const { createSession } = require("./../auth/index.js");

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

router.post("/login", async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (await user.isValidPassword(password)) {
      const token = await createSession({ username });
      res.send({
        token,
      });
    } else {
      res.status(401);
      throw new Error("Unauthorized");
    }
  } catch (err) {
    return next(err);
  }
});

router.get("/logout", async (req, res, next) => {});

module.exports = router;
