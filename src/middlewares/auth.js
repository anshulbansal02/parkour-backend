const jwt = require("jsonwebtoken");
const useragent = require("express-useragent");

const { Session } = require("../entities/index.js");

const { tokenBlocklist } = require("./../services/index.js");

// Classes
class Token {
  constructor(expire, key) {
    this.key = key;
    this.expire = expire;
  }

  sign(payload) {
    const exp = Math.floor(Date.now() / 1000) + this.expire;
    return jwt.sign(
      {
        exp,
        ...payload,
      },
      this.key
    );
  }

  verify(token) {
    try {
      return jwt.verify(token, this.key);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new TokenError("The token has expired");
      } else {
        throw new TokenError("Invalid token");
      }
    }
  }
}

const AccessToken = new Token(3600, process.env.ACCESS_TOKEN_KEY);
const SessionToken = new Token(
  60 * 60 * 24 * 180,
  process.env.SESSION_TOKEN_KEY
);

class TokenError extends Error {
  constructor(message) {
    super(message);
  }
}

// Middlewares
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
        "Provide bearer access token in authorization header"
      );
      return;
    }

    if (await tokenBlocklist.exists(req.token)) {
      handleUnauthorizedResponse("Invalid access token");
      return;
    }

    try {
      const payload = AccessToken.verify(req.token);
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

// Functions
async function createSession(req, user) {
  const sessionToken = SessionToken.sign({ userId: user.userId });
  const accessToken = AccessToken.sign({ userId: user.userId });

  const clientInfo = useragent.parse(req.header("user-agent"));
  const session = new Session({
    _id: sessionToken,
    accessTokens: [accessToken],
    userId: user.userId,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
    agent: `${clientInfo.browser} ${clientInfo.version}`,
    platform: `${clientInfo.platform} (${clientInfo.os})`,
    location: "",
  });
  await session.save();

  return {
    refresh_token: sessionToken,
    access_token: accessToken,
    expire: AccessToken.expire,
  };
}

function renewSession(sessionToken) {}

async function revokeSession(sessionToken) {
  const session = await Session.findOneAndDelete({ _id: sessionToken });

  await tokenBlocklist.add(...session.accessTokens);
}

async function createAccessToken(sessionToken) {
  const { userId } = SessionToken.verify(sessionToken);

  const session = await Session.findOne({ _id: sessionToken });
  if (!session) {
    throw new TokenError("Invalid refresh token");
  }

  let { accessTokens } = session;
  const lastToken = accessTokens.pop();

  if (jwt.decode(lastToken).exp - Math.floor(+new Date() / 1000) >= 1800) {
    return lastToken;
  } else {
    const accessToken = AccessToken.sign({ userId });
    session.accessTokens = [lastToken, accessToken];
    await session.save();
    return accessToken;
  }
}

module.exports = {
  tokenParser,
  authenticate,
  createSession,
  renewSession,
  revokeSession,
  createAccessToken,
};
