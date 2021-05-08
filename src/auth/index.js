const jwt = require("jsonwebtoken");

const { Session } = require("./../entities/index.js");
const Response = require("./../response/index.js");
const { Unauthorized } = Response;

function authenticate(delegateResponse = false) {
  return async function (req, res, next) {
    function _next() {
      if (!delegateResponse) {
        res.dispatch(new Unauthorized());
        return;
      } else {
        next();
      }
    }

    const authHeader = req.header("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      _next();
      return;
    }

    try {
      const data = jwt.verify(token, process.env.SECRET_KEY);

      if (await Session.findOne({ _id: token })) {
        req.user = data;
        req.token = token;
        next();
      } else {
        _next();
      }
    } catch (err) {
      if (err.name === "JsonWebTokenError") _next();
      else next(err);
    }
  };
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
