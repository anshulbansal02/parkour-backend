function notFoundErrorHandler(req, res) {
  res.dispatch.NotFound(`Requested resource ${req.url} was not found`);
}

function genericErrorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV === "development";
  isDev ? console.log(err) : null;
  res.dispatch.ServerError(isDev ? err.message : null);
}

module.exports = { notFoundErrorHandler, genericErrorHandler };
