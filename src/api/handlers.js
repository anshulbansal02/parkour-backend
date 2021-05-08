const { NotFound, ServerError } = require("./../response/index.js");

function notFoundErrorHandler(req, res) {
  res.dispatch(new NotFound(`Request resource ${req.url} was not found`));
}

function genericErrorHandler(err, req, res, next) {
  res.dispatch(new ServerError(process.env.NODE_ENV === "dev" ? err : null));
}

module.exports = { notFoundErrorHandler, genericErrorHandler };
