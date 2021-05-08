const { Router } = require("express");

const { User } = require("../entities/index.js");
const {
  createSession,
  destroySession,
  authenticate,
} = require("./../auth/index.js");
const Response = require("./../response/index.js");
const { OK, Unauthorized } = Response;

const router = Router();

// Authentication Middlewares

router.post("/login", async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (await user.isValidPassword(password)) {
      const token = await createSession({ username });
      res.dispatch(new OK({ token }));
    } else {
      res.dispatch(new Unauthorized("Incorrect credentials"));
    }
  } catch (err) {
    return next(err);
  }
});

router.get("/logout", authenticate(), async (req, res, next) => {
  try {
    console.log(req.token);
    await destroySession(req.token);
    res.dispatch(new OK());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
