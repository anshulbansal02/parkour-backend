const ResponseCodes = {
  200: "OK",
  201: "Created",
  204: "NoContent",
  400: "BadRequest",
  401: "Unauthorized",
  403: "Forbidden",
  404: "NotFound",
  409: "Conflict",
  413: "RequestEntityTooLarge",
  500: "ServerError",
};

class Response {
  #res;

  constructor(res) {
    this.#res = res;
  }

  static middleware(req, res, next) {
    res.dispatch = new Response(res);
    next();
  }

  sendResponse(payload, status, code) {
    const responseObject = { status };
    if (payload) {
      if (typeof payload === "object" && payload !== null)
        Object.assign(responseObject, payload);
      else responseObject.message = payload;
    }

    this.#res.status(code);
    this.#res.json(responseObject);
  }
}

Object.keys(ResponseCodes).forEach((code) => {
  Response.prototype[ResponseCodes[code]] = function (payload) {
    this.sendResponse(payload, ResponseCodes[code], code);
  };
});

module.exports = Response;
