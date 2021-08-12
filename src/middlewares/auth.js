const jwt = require("jsonwebtoken");
const useragent = require("express-useragent");

const { Session } = require("../entities/index.js");

const { REFRESH_TOKEN_KEY, ACCESS_TOKEN_KEY } = process.env;

function tokenParser(req, res, next) {
  const authHeader = req.header("Authorization");
  const token = authHeader?.split(" ")[1];

  req.token = token;
  next();
}

function authenticate(delegateResponse = false) {
  return async function (req, res, next) {
    function handleUnauthorizedResponse(message) {
      if (delegateResponse) {
        next();
      } else {
        res.dispatch.Unauthorized(message);
      }
    }

    if (!req.token) {
      handleUnauthorizedResponse(
        "Provide bearer access token in authorzation header"
      );
      return;
    }

    // Check if token is revoked in redis cache

    try {
      const payload = jwt.verify(req.token, ACCESS_TOKEN_KEY);

      req.authenticatedUser = payload;

      next();
    } catch (err) {
      if (err.name === "JsonWebTokenError")
        handleUnauthorizedResponse("Invalid access token");
      if (err.name === "TokenExpiredError")
        handleUnauthorizedResponse("The access token has expired");
      else next(err);
    }
  };
}

async function createSession(req, user) {
  const payload = {
    userId: user.userId,
  };

  const token = jwt.sign(payload, REFRESH_TOKEN_KEY);

  const clientInfo = useragent.parse(req.header("user-agent"));

  const session = new Session({
    _id: token,
    userId: user.userId,
    ip: req.ip,
    agent: req.agent,
  });

  return token;
}

async function createSession(req, user) {
  const payload = {
    ip: req.ip,
    location: "",
    agent: "",
    platform: "",
    userId: user.userId,
  };

  const token = jwt.sign(payload, REFRESH_TOKEN_KEY);
  await new Session({ token }).save();

  return token;
}

async function createAccessToken(req, res, next) {
  const authHeader = req.header("Authorization");
  const refreshToken = authHeader?.split(" ")[1];

  if (!refreshToken) {
    res.dispatch.BadRequest("Please provide a bearer refresh token");
    return;
  }

  const EXPIRE_TIME = 3600; // seconds

  try {
    const session = jwt.verify(refreshToken, REFRESH_TOKEN_KEY);

    if (await Session.exists({ _id: refreshToken })) {
      const accessToken = jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + EXPIRE_TIME,
          userId: session.userId,
        },
        ACCESS_TOKEN_KEY
      );

      res.dispatch.OK({ access_token: accessToken, expires: EXPIRE_TIME });
    } else {
      res.dispatch.Unauthorized("Invalid token");
    }
  } catch (err) {
    if (err.name === "JsonWebTokenError")
      res.dispatch.Unauthorized("Invalid token");
    else next();
  }
}

async function destroySession(token) {
  await Session.deleteOne({ _id: token });
}

module.exports = {
  createSession,
  authenticate,
  destroySession,
  createAccessToken,
  tokenParser,
};
