const { Router } = require("express");
const jwt = require("jsonwebtoken");

const { User } = require("../entities/index.js");
const {
  createSession,
  destroySession,
  authenticate,
} = require("../auth/index.js");
const Response = require("../response/index.js");

const { stringFields } = require("../utils/index.js");

const router = Router();
const { BadRequest, OK, NotFound, Unauthorized } = Response;

// [POST] Create Account
router.post("/register", async (req, res, next) => {
  const { name, username, email, password } = req.body;

  try {
    const user = new User({
      name,
      username,
      email,
      password,
    });
    await user.validate();

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      let msg = "";
      if (existingUser.email === email)
        msg = "The email already has a registered account";
      else msg = "Username not available";
      res.dispatch(new BadRequest(msg));
    }

    await user.setPassword(password);
    await user.save();

    res.dispatch(new OK({ data: user.getProfile() }));
  } catch (err) {
    if (err.name === "ValidationError") {
      res.dispatch(
        new BadRequest(`Please provide valid ${stringFields(err.errors)}`)
      );
    } else next(err);
  }
});

// @ [GET] Get User profile by username
router.get(
  "/:username",
  authenticate((delegateResponse = true)),
  async (req, res, next) => {
    // If the requested profile is of authenticated user then show private info else only public
    const { username } = req.params;

    try {
      const user = await User.findOne({ username });

      if (!user) {
        res.dispatch(new NotFound("User does not exist"));
        return;
      } else {
        if (req.user?.username === username) {
          res.dispatch(new OK({ data: user.getProfile() }));
        } else {
          res.dispatch(new OK({ data: user.getPublicProfile() }));
        }
      }
    } catch (err) {
      console.log(err.name, err.message);
      next(err);
    }
  }
);

// @ [PATCH] Update User profile
router.patch("/profile", authenticate(), async (req, res, next) => {
  const { name, username, avatar, bio } = req.body;

  try {
    const user = await User.findOne({
      username: req.user.username,
    });

    if (!user) {
      res.dispatch(new NotFound("User does not exist"));
      return;
    } else {
      // Change this approach & check username availability prior to changing
      user.name = name ? name : user.name;
      user.username = username ? username : user.username;

      await user.validate();
      await user.save();

      res.dispatch(new OK({ data: user.getProfile() }));
    }
  } catch (err) {
    if (err.name === "ValidationError")
      res.dispatch(
        new BadRequest(
          `Please provide ${
            Object.keys(err.errors).length === 1 ? "a" : ""
          } valid ${stringFields(err.errors)}`
        )
      );
    else next(err);
  }
});

// @ [PATCH] Update User password
router.patch("/password", authenticate(), async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const { username } = req.user;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      res.dispatch(new BadRequest("Unknown user"));
      return;
    } else {
      if (await user.isValidPassword(currentPassword)) {
        await user.setPassword(newPassword);
        await user.save();
        res.dispatch(new OK("Password was changed successfully"));
      } else {
        res.dispatch(new Unauthorized("Current password is incorrect."));
      }
    }
  } catch (err) {
    next(err);
  }
});

// TODO: @ [PATCH] Update user email, triggering email verification
router.patch("/email", authenticate(), async (req, res, next) => {});

// @ Delete account by username
router.delete("/", authenticate(), async (req, res, next) => {
  const { username } = req.user;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      res.dispatch(new BadRequest("Unknown user"));
      return;
    } else {
      await User.deleteOne({ username });
      res.dispatch(new OK({ data: user.getProfile() }));

      // Delete users plans as well
    }
  } catch (err) {
    next(err);
  }
});

// [POST] Logs in user and creates a session
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

// [GET] Logs out user and destroys the session
router.get("/logout", authenticate(), async (req, res, next) => {
  try {
    console.log(req.token);
    await destroySession(req.token);
    res.dispatch(new OK());
  } catch (err) {
    next(err);
  }
});

// TODO: [GET] Verify email address from req initiated by opening link sent of email
router.get("/verify", async (req, res) => {
  /* 
  Email Verification Token
  {username, email}
  */

  const { t: token } = req.query;

  try {
    const { username, email } = jwt.verify(token, process.env.SECRET_KEY);

    const user = await User.findOne({ username });

    if (!user) {
      res.dispatch(new BadRequest());
      return;
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
