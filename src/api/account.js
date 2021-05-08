const { Router } = require("express");

const { User } = require("../entities/index.js");
const { authenticateRequest } = require("../auth/index.js");
const Response = require("./../response/index.js");

const { stringFields } = require("../utils/index.js");

const router = Router();
const { BadRequest, OK, NoContent, Unauthorized } = Response;

// Create Account
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

// @ Get User by username
router.get("/:username", authenticateRequest, async (req, res, next) => {
  // If the requested profile is of authenticated user then show private info else only public

  const { username } = req.params;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      res.dispatch(new NoContent("User does not exist"));
    } else {
      if (req.user.username === username) {
        res.dispatch(new OK({ data: user.getProfile() }));
      } else {
        res.dispatch(new OK({ data: user.getPublicProfile() }));
      }
    }
  } catch (err) {
    next(err);
  }
});

// @ Update User
router.patch("/", authenticateRequest, async (req, res, next) => {
  // Updated Info
  const { name, username, avatar } = req.body;

  try {
    const user = await User.findOne({
      username: req.user.username,
    });

    if (!user) {
      res.dispatch(new NoContent("User does not exist"));
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
        new BadRequest(`Please provide valid ${stringFields(err.errors)}`)
      );
    else next(err);
  }
});

// @ Update User password
router.patch("/password", authenticateRequest, async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const { username } = req.user;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      res.dispatch(new NoContent("User does not exist"));
      return;
    } else {
      if (user.isValidPassword(currentPassword)) {
        user.setPassword(newPassword);
      } else {
        res.dispatch(new Unauthorized("Current password is incorrect."));
      }
    }
  } catch (err) {
    next(err);
  }
});

// @ Delete account by username
router.delete("/", authenticateRequest, async (req, res, next) => {
  const { username } = req.user;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      res.dispatch(new BadRequest("User does not exist with given username"));
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

module.exports = router;
