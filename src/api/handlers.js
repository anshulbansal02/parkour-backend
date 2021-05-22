const { NotFound, ServerError } = require("./../response/index.js");

function notFoundErrorHandler(req, res) {
  res.dispatch(new NotFound(`Request resource ${req.url} was not found`));
}

function genericErrorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV === "dev";
  isDev ? console.log(err) : null;
  res.dispatch(new ServerError(isDev ? err.message : null));
}

module.exports = { notFoundErrorHandler, genericErrorHandler };
