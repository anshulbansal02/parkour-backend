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
  const { name, email, password } = req.body;

  try {
    const user = new User({
      name,
      tempEmail: email,
      username: email.split("@")[0], // Generate random username
      password,
    });

    if (await User.findOne({ email })) {
      res.dispatch.BadRequest("The email already has a registered account");
    }

    await user.setPassword(password);

    await user.save();

    res.dispatch.OK({ data: user.profile });
  } catch (err) {
    if (err.name === "ValidationError") {
      res.dispatch.BadRequest(
        `Please provide valid ${stringFields(
          err.errors,
          false,
          (lastWord = "and")
        )}`
      );
    } else next(err);
  }
});

// @ [GET] Get User profile by username
router.get(
  "/profile/:username",
  authenticate((delegateResponse = true)),
  async (req, res, next) => {
    const { username } = req.params;
    let user;

    try {
      if (req.authenticatedUser?.username === username) {
        user = await User.getProfile(username);
      } else {
        user = await User.getPublicProfile(username);
      }

      !user
        ? res.dispatch.NotFound("User does not exist")
        : res.dispatch.OK({ data: user });
    } catch (err) {
      next(err);
    }
  }
);

// @ [PATCH] Update User profile
router.patch("/profile", authenticate(), async (req, res, next) => {
  const { name, bio } = req.body;

  try {
    const user = await User.findOne({
      username: req.authenticatedUser.username,
    });

    if (!user) {
      res.dispatch.NotFound("User does not exist");
      return;
    }

    user.name = name !== undefined ? name : user.name;
    user.bio = bio !== undefined ? bio : user.bio;

    await user.save();

    res.dispatch.OK({ data: user.profile });
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
router.patch(
  "/profile/avatar",
  authenticate(),
  avatarFileware,
  async (req, res, next) => {
    const { username } = req.authenticatedUser;
    const { filename: avatarFile } = req.file;

    try {
      const user = await User.findOne({ username });
      user.avatar = avatarFile;

      await user.save();
    } catch (err) {
      next(err);
    }
  }
);

router.patch("/username", authenticate(), async (req, res, next) => {
  const { newUsername } = req.body;

  try {
    if (await User.exists({ username: newUsername })) {
      res.dispatch.Conflict("Username is taken");
    } else {
      const user = await User.findOne({
        username: req.authenticatedUser.username,
      });
      user.username = newUsername;
      await user.save();

      res.dispatch.OK({ data: user.profile });
    }
  } catch (err) {
    if (err.name === "ValidationError") {
      res.dispatch.BadRequest(`Please provide a valid username`);
    } else next(err);
  }
});

// TODO: @ [PATCH] Update user email, triggering email verification
router.patch("/email", authenticate(), async (req, res, next) => {});

// @ [PATCH] Update User password
router.patch("/password", authenticate(), async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const { username } = req.authenticatedUser;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      res.dispatch.BadRequest("User does not exist");
      return;
    } else {
      if (await user.isValidPassword(currentPassword)) {
        await user.setPassword(newPassword);
        await user.save();
        res.dispatch.OK("Password was changed successfully");
      } else {
        res.dispatch.Forbidden("Current password is incorrect");
      }
    }
  } catch (err) {
    next(err);
  }
});

// @ Delete account by username
router.post("/deactivate", authenticate(), async (req, res, next) => {
  const { username } = req.authenticatedUser;

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
router.post("/authenticate", async (req, res, next) => {
  // Takes username and password and creates refresh token session and return same

  const { username, password } = req.body;

  if (!(username || password)) {
    res.dispatch.BadRequest("Please provide valid username and password");
    return;
  }

  try {
    const user = await User.findOne({ username });
    if (user && (await user.isValidPassword(password))) {
      const token = await createSession({ username });
      res.dispatch.OK({ token });
    } else {
      res.dispatch.Unauthorized("Incorrect credentials");
    }
  } catch (err) {
    return next(err);
  }
});

router.get("/access-token", async (req, rest, next) => {
  // Takes refresh token and issues short lived access tokens
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
