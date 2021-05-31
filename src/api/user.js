const { Router } = require("express");
const jwt = require("jsonwebtoken");

const { User } = require("../entities/index.js");

const { fileware, auth } = require("../middlewares/index.js");
const { createSession, destroySession, authenticate } = auth;

const { stringFields } = require("../utils/index.js");
const { mimeTypes } = require("../constants/index.js");

const router = Router();

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
      res.dispatch.BadRequest(msg);
    }

    await user.setPassword(password);
    await user.save();

    res.dispatch.OK({ data: user.getProfile() });
  } catch (err) {
    if (err.name === "ValidationError") {
      res.dispatch.BadRequest(
        `Please provide valid ${stringFields(err.errors)}`
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
        res.dispatch.NotFound("User does not exist");
        return;
      } else {
        if (req.user?.username === username) {
          res.dispatch.OK({ data: user.getProfile() });
        } else {
          res.dispatch.OK({ data: user.getPublicProfile() });
        }
      }
    } catch (err) {
      next(err);
    }
  }
);

// @ [PATCH] Update User profile
router.patch("/profile", authenticate(), async (req, res, next) => {
  const { name, username, bio } = req.body;

  try {
    const user = await User.findOne({
      username: req.user.username,
    });

    if (!user) {
      res.dispatch.NotFound("User does not exist");
      return;
    } else {
      // Change this approach & check username availability prior to changing
      user.name = name ? name : user.name;
      user.username = username ? username : user.username;

      await user.validate();
      await user.save();

      res.dispatch.OK({ data: user.getProfile() });
    }
  } catch (err) {
    if (err.name === "ValidationError")
      res.dispatch.BadRequest(
        `Please provide ${
          Object.keys(err.errors).length === 1 ? "a" : ""
        } valid ${stringFields(err.errors)}`
      );
    else next(err);
  }
});

const avatarFileware = fileware("avatar", 1024 * 1024 * 5, mimeTypes.image);

router.put(
  "/profile/avatar",
  authenticate(),
  avatarFileware,
  async (req, res, next) => {
    const { username } = req.user;
    const { filename: avatarFile } = req.file;

    try {
      const user = await User.findOne({ username });
      user.avatar = avatarFile;

      await user.validate();
      await user.save();
    } catch (err) {
      next(err);
    }
  }
);

// @ [PATCH] Update User password
router.patch("/password", authenticate(), async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const { username } = req.user;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      res.dispatch.BadRequest("Unknown user");
      return;
    } else {
      if (await user.isValidPassword(currentPassword)) {
        await user.setPassword(newPassword);
        await user.save();
        res.dispatch.OK("Password was changed successfully");
      } else {
        res.dispatch.Unauthorized("Current password is incorrect.");
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
      res.dispatch.BadRequest("Unknown user");
      return;
    } else {
      await User.deleteOne({ username });
      res.dispatch.OK({ data: user.getProfile() });

      // Delete users plans as well
    }
  } catch (err) {
    next(err);
  }
});

// [POST] Logs in user and creates a session
router.post("/login", async (req, res, next) => {
  const { username, password } = req.body;

  if (!(username || password)) {
    res.dispatch.BadRequest("Username & Password are required to login");
    return;
  }

  try {
    const user = await User.findOne({ username });
    if (await user.isValidPassword(password)) {
      const token = await createSession({ username });
      res.dispatch.OK({ token });
    } else {
      res.dispatch.Unauthorized("Incorrect credentials");
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
    res.dispatch.OK();
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
      res.dispatch.BadRequest();
      return;
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
