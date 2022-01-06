const { Router } = require("express");
const jwt = require("jsonwebtoken");

const { User } = require("../entities/index.js");

const { userIdMap } = require("./../services/index.js");

const { Fileware, Auth, ValidateBody } = require("../middlewares/index.js");
const {
  createSession,
  revokeSession,
  createAccessToken,
  renewSession,
  authenticate,
} = Auth;

const { generateUsername } = require("../utils/index.js");
const { mimeTypes, reMap } = require("../constants/index.js");
const Joi = require("joi");

const router = Router();

function sendEmailVerification(user) {
  const token = jwt.sign({ email: user.email }, process.env.SECRET_KEY);

  const emailMessage = `
  Verify your email at
  http://localhost:4000/api/users/verify/email/${token}/
  `;
  console.log(emailMessage);
}

// [POST] Create Account
router.post(
  "/register",
  ValidateBody({
    name: Joi.string().regex(reMap.name).required().messages({
      "string.pattern.base": "'name' must only contain alphabets",
    }),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
  async (req, res, next) => {
    const { name, email, password } = req.body;

    try {
      const existingUser = await User.findOne({ email });

      let user,
        triggerEmailVerification = false;

      if (existingUser) {
        if (existingUser.verified) {
          res.dispatch.BadRequest("The email already has a registered account");
          return;
        } else {
          user = new User({
            name,
            email,
            password,
            username: existingUser.username,
          });
          await User.deleteOne({ _id: existingUser.userId });

          if (user.createdAt + 60 * 60 < new Date()) {
            triggerEmailVerification = true;
          }
        }
      } else {
        user = new User({
          name,
          email,
          password,
          username: generateUsername(name),
        });
        triggerEmailVerification = true;
      }

      await user.save();

      await userIdMap.set(user.userId, user.username);

      res.dispatch.OK({ data: user.profile });

      if (triggerEmailVerification) sendEmailVerification(user);
    } catch (error) {
      next(error);
    }
  }
);

// @ [GET] Get User profile by username
router.get(
  "/profile/:username",
  authenticate((delegateResponse = true)),
  async (req, res, next) => {
    const { username } = req.params;

    const authUsername = await userIdMap.get(
      req.authenticatedUser?.userId || ""
    );

    let user;
    try {
      if (authUsername === username) {
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
router.patch(
  "/profile",
  authenticate(),
  ValidateBody({
    name: Joi.string().regex(reMap.name).messages({
      "string.pattern.base": "'name' must only contain alphabets",
    }),
    bio: Joi.string().max(200).allow(""),
  }),
  async (req, res, next) => {
    const { name, bio } = req.body;
    try {
      const userId = req.authenticatedUser?.userId || "";

      const user = await User.findOne({
        _id: userId,
      });

      user.set({
        ...(name !== undefined ? { name } : null),
        ...(bio !== undefined ? { bio } : null),
      });

      await user.save();

      res.dispatch.OK({ data: user.profile });
    } catch (err) {
      next(err);
    }
  }
);

const avatarFileware = Fileware("avatar", 1024 * 1024 * 5, mimeTypes.image);
router.patch(
  "/profile/avatar",
  authenticate(),
  avatarFileware,
  async (req, res, next) => {
    const userId = req.authenticatedUser?.userId || "";
    const { filename: avatarFile } = req.file;

    try {
      const user = await User.findOne({ userId });
      user.avatar = avatarFile;

      await user.save();
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/username",
  authenticate(),
  ValidateBody({
    newUsername: Joi.string().regex(reMap.username).required().messages({
      "string.pattern.base":
        "'newUsername' must start only with an alphabet or _ (underscore)",
    }),
  }),
  async (req, res, next) => {
    const { newUsername } = req.body;

    try {
      if (await User.exists({ username: newUsername })) {
        res.dispatch.Conflict("Username is taken");
      } else {
        const user = await User.findOne({
          _id: req.authenticatedUser.userId,
        });
        user.username = newUsername;

        await userIdMap.set(user.userId, newUsername);

        await user.save();

        res.dispatch.OK({ data: user.profile });
      }
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/availability/email",
  ValidateBody({
    email: Joi.string().email().required(),
  }),
  async (req, res, next) => {
    const { email } = req.body;

    try {
      const isAvailable = await User.exists({ email });
      res.dispatch.OK({ available: !isAvailable });
    } catch (err) {
      next(err);
    }
  }
);

// TODO: @ [PATCH] Update user email, triggering email verification
router.patch(
  "/email",
  authenticate(),
  ValidateBody({
    newEmail: Joi.string().email().required(),
  }),
  async (req, res, next) => {
    const { newEmail } = req.body;

    try {
      if (await User.exists({ email: newEmail })) {
        res.dispatch.Conflict(
          "Email is already registered with some other account"
        );
      } else {
        const user = await User.findOne({
          _id: req.authenticatedUser.userId,
        });

        user.tempEmail = newEmail;
        await user.save();

        // Trigger email verification

        res.dispatch.Accepted("Verify email to update email address");

        sendEmailVerification(user);
      }
    } catch (err) {
      next(err);
    }
  }
);

// @ [PATCH] Update User password
router.patch(
  "/password",
  authenticate(),
  ValidateBody({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
  }),
  async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const { userId } = req.authenticatedUser;

    try {
      const user = await User.findOne({ userId });

      if (await user.isValidPassword(currentPassword)) {
        await user.setPassword(newPassword);
        await user.save();
        res.dispatch.OK("Password was changed successfully");
      } else {
        res.dispatch.Forbidden("Current password is incorrect");
      }
    } catch (err) {
      next(err);
    }
  }
);

// @ Delete account by username
router.post(
  "/deactivate",
  authenticate(),
  ValidateBody({
    username: Joi.string().regex(reMap.username).required(),
  }),
  async (req, res, next) => {
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
  }
);

// Authorisation and Authentication APIs

// [POST] Logs in user and creates a session
router.post(
  "/authenticate",
  ValidateBody(
    {
      username: Joi.string(),
      email: Joi.string(),
      password: Joi.string()
        .required()
        .messages({ "any.required": "provide valid password" }),
    },
    ["username", "email"],
    "provide valid username or email"
  ),
  async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
      const user = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (user && (await user.isValidPassword(password))) {
        if (user.verified) {
          const tokens = await createSession(req, user);
          res.dispatch.OK(tokens);
        } else {
          res.dispatch.Forbidden({
            message:
              "Please complete email verification before signing in by clicking on the link sent to your registered email address.",
          });
        }
      } else {
        res.dispatch.Unauthorized("Incorrect credentials");
      }
    } catch (err) {
      return next(err);
    }
  }
);

// [GET] Creates new access token for given session token
router.get("/access-token", async (req, res, next) => {
  if (!req.token) {
    res.dispatch.Unauthorized(
      "Provide bearer refresh token in authorization header"
    );
    return;
  }

  try {
    const access_token = await createAccessToken(req.token);
    res.dispatch.OK({ access_token });
  } catch (err) {
    if (err.name == "TokenError") res.dispatch.BadRequest(err.message);
    else next(err);
  }
});

// [GET] Renews session token
router.get("/renew-session", async (req, res, next) => {
  if (!req.token) {
    res.dispatch.Unauthorized(
      "Provide bearer refresh token in authorization header"
    );
    return;
  }

  try {
    const session_token = await renewSession(req.token);
    res.dispatch.OK({ session_token });
  } catch (err) {
    if (err.name == "TokenError") res.dispatch.BadRequest(err.message);
    else next(err);
  }
});

// [GET] Logs out user and destroys the session
router.post("/logout", authenticate(), async (req, res, next) => {
  const { sessionToken } = req.body;
  try {
    await revokeSession(sessionToken);
    res.dispatch.OK();
  } catch (err) {
    next(err);
  }
});

// [GET] Verify email by token
router.get("/verify/email/:token", async (req, res, next) => {
  const { token } = req.params;

  try {
    const { email } = jwt.verify(token, process.env.SECRET_KEY);

    const user = await User.findOne({ email });

    if (!user) {
      res.dispatch.Unauthorized();
      return;
    }

    if (!user.verified) {
      user.verified = true;
      await user.save();
      res.dispatch.OK(`Email address ${email} is verified.`);
    } else {
      res.dispatch.Forbidden(`${email} was already verified.`);
    }
  } catch (err) {
    next(err);
  }
});

router.post("/request-verification/email", async (req, res, next) => {
  const { email } = req.body;
  res.dispatch.OK(email);
});

router.get("/auth-test", authenticate(), async (req, res, next) => {
  res.dispatch.OK("You are authenticated!");
});

module.exports = router;
