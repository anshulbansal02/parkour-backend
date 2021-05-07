const ResponseTypes = [
  ["OK", 200],
  ["Created", 201],
  ["NoContent", 204],
  ["BadRequest", 400],
  ["Unauthorized", 401],
  ["NotFound", 404],
  ["ServerError", 500],
];

function createResponse(status, code) {
  return class {
    constructor(payload) {
      this.code = code;
      this.status = status;
      if (payload) {
        if (typeof payload === "string") this.message = payload;
        else if (typeof payload === "object" && payload !== null)
          Object.assign(this, payload);
      }
    }
  };
}

class Response {
  static middleware(req, res, next) {
    res.dispatch = function (response) {
      const { code, ...payload } = response;
      res.status(code);
      res.json(payload);
    };
    next();
  }
}

for (let type of ResponseTypes) {
  Response[type[0]] = createResponse(...type);
}

module.exports = Response;
