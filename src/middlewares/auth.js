const jwt = require("jsonwebtoken");

const { Session } = require("../entities/index.js");

const { SECRET_KEY } = process.env;

function authenticate(delegateResponse = false) {
  return async function (req, res, next) {
    function handleUnauthorizedResponse() {
      if (delegateResponse) {
        next();
      } else {
        res.dispatch.Unauthorized();
      }
    }

    const authHeader = req.header("Authorization");
    const accessToken = authHeader?.split(" ")[1];

    if (!accessToken) {
      handleUnauthorizedResponse();
      return;
    }

    // Check if token is revoked in redis cache

    try {
      const payload = jwt.verify(token, SECRET_KEY);

      req.authenticatedUser = payload;
      req.accessToken = accessToken;
    } catch (err) {
      if (err.name === "JsonWebTokenError") handleUnauthorizedResponse();
      else next();
    }
  };
}

async function createRefreshToken(user) {
  const payload = {
    username: user.username,
    email: user.email,
  };

  const token = jwt.sign(payload, user.password);
  await new Session({ token }).save();

  return token;
}

async function createAccessToken(refreshToken, user) {
  if (await Session.exists({ token: refreshToken })) {
    const payload = {
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      username: user.username,
      email: user.email,
    };
    const token = jwt.sign(payload, SECRET_KEY);
    return token;
  }
}

async function createSession(payload) {
  const token = jwt.sign(payload, process.env.SECRET_KEY);

  const session = new Session({ token });

  await session.validate();
  await session.save();

  return token;
}

async function destroySession(token) {
  await Session.deleteOne({ _id: token });
}

module.exports = { createSession, authenticate, destroySession };
