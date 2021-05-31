const ResponseTypes = [
  //['Response Name', Code]
  ["OK", 200],
  ["Created", 201],
  ["NoContent", 204],
  ["BadRequest", 400],
  ["Unauthorized", 401],
  ["Forbidden", 403],
  ["NotFound", 404],
  ["RequestEntityTooLarge", 413],
  ["ServerError", 500],
];

// function createResponse(status, code) {
//   return class {
//     constructor(payload) {
//       this.code = code;
//       this.status = status;

//       if (payload) {
//         if (typeof payload === "object" && payload !== null)
//           Object.assign(this, payload);
//         else this.message = payload;
//       }
//     }
//   };
// }

// class Response {
//   static middleware(req, res, next) {
//     res.dispatch = function (response) {
//       const { code, ...payload } = response;
//       res.status(code);
//       res.json(payload);
//     };
//     next();
//   }
// }

// for (let type of ResponseTypes) {
//   Response[type[0]] = createResponse(...type);
// }

// module.exports = Response;

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
    // Prepare payload
    if (payload) {
      if (typeof payload === "object" && payload !== null)
        Object.assign(responseObject, payload);
      else responseObject.message = payload;
    }

    this.#res.status(code);
    this.#res.json(responseObject);
  }
}

// for (let type of ResponseTypes) {
//   Response[type[0]] = (payload) =>
//     this.#sendResponse(payload, type[0], type[1]);
// }

ResponseTypes.forEach((type) => {
  Response.prototype[type[0]] = function (payload) {
    this.sendResponse(payload, type[0], type[1]);
  };
});

module.exports = Response;

/*

res.dispatch.Unauthorized('Invalid token')

res.dispatch.

*/
