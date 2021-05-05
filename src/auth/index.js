const jwt = require("jsonwebtoken");

const { Session } = require("./../entities/index.js");

async function authenticateRequest(req, res, next) {
  const authHeader = req.header("Authorization");
  const token = authHeader?.split(" ")[1];

  // Check if no token
  if (!token) {
    res.status(401);
    // TODO: Implement a status property on error object
    return next(new Error("Unauthorized"));
  }

  try {
    // Verfiy token and check in sessions as well
    const data = jwt.verify(token, process.env.SECRET_KEY);

    if (await Session.findOne({ _id: token })) {
      req.user = data;
      next();
    } else {
      throw new Error("Internal Server Error");
    }
  } catch (err) {
    // Currently all errs in authenticateRequest handler will have 401
    res.status(401);
    return next(err);
  }
}

async function createSession(payload) {
  const token = jwt.sign(payload, process.env.SECRET_KEY);

  const session = new Session({ token });

  await session.validate();
  await session.save();

  return token;
}

module.exports = { authenticateRequest, createSession };
