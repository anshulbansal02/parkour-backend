function notFoundErrorHandler(req, res) {
  res.dispatch.NotFound(`Request resource ${req.url} was not found`);
}

function genericErrorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV === "dev";
  isDev ? console.log(err) : null;
  res.dispatch.ServerError(isDev ? err.message : null);
}

module.exports = { notFoundErrorHandler, genericErrorHandler };
