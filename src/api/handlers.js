const { NotFound, ServerError } = require("./../response/index.js");

function notFoundErrorHandler(req, res) {
  res.dispatch(new NotFound(`Request resource ${req.url} was not found`));
}

function genericErrorHandler(req, res) {
  res.dispatch(new ServerError("Internal server error"));
}

module.exports = { notFoundErrorHandler, genericErrorHandler };
