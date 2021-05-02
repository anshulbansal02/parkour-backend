const { Router } = require("express");
const { User } = require("../entities/index.js");

const { stringFields } = require("../utils/index.js");

const router = Router();

// Authentication Middlewares

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
      res.status(400);
      if (existingUser.email === email)
        throw new Error("A user is already registered with the given email.");
      else if (existingUser.username === username)
        throw new Error("Username is not available.");
    }

    await user.setPassword(password);
    await user.save();

    res.json({
      status: "OK",
      data: user.getProfile(),
    });
  } catch (err) {
    res.status(400);
    if (err.name === "ValidationError") {
      next(new Error(`Please provide valid ${stringFields(err.errors)}`));
    } else next(err);
  }
});

// @ Get User by username
router.get("/:username", async (req, res, next) => {
  // Include private info if authenticated else public only

  const { username } = req.params;

  try {
    const user = await User.findOne(
      {
        username,
      },
      { name: 1, username: 1, email: 1, avatar: 1, verified: 1 }
    );

    if (!user) {
      throw new Error("User does not exist with given username");
    } else {
      res.json({
        status: "OK",
        data: user,
      });
    }
  } catch (err) {
    next(err);
  }
});

// @ Update User
router.patch("/:username", async (req, res, next) => {
  const { name, username, email, avatar } = req.body;

  try {
    const user = await User.findOne({
      username: req.params.username,
    });

    if (!user) {
      throw new Error("User does not exist with given username");
    } else {
      // Change this approach & check username availability prior to changing
      user.name = name ? name : user.name;
      user.username = username ? username : user.username;
      user.email = email ? email : user.email;

      // Check if email was changed
      if (user.isModified("email")) {
        // trigger email verification
      }

      await user.validate();
      await user.save();

      res.json({
        status: "OK",
        data: user.getProfile(),
      });
    }
  } catch (err) {
    res.status(400);

    if (err.name === "ValidationError")
      next(new Error(`Please provide valid ${stringFields(err.errors)}`));

    next(err);
  }
});

router.patch("/:username/password", async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      throw new Error("User does not exist with given username");
    } else {
      if (user.isValidPassword(currentPassword)) {
        user.setPassword(newPassword);
      } else {
        res.json({
          status: "Unauthorized",
          message: "Current password is incorrect",
        });
      }
    }
  } catch (err) {
    next(err);
  }
});

// @ Delete account by username
router.delete("/:username", async (req, res, next) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      res.status(400);
      throw new Error("User does not exist with given username");
    } else {
      await User.deleteOne({ username });
      res.json({
        status: "OK",
        data: user.getProfile(),
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
