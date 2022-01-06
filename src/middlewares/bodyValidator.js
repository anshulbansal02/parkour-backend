const Joi = require("joi");

const { stringFields } = require("../utils/index.js");

function validateBody(bodySchema, choice = null, xorMessage) {
  return async (req, res, next) => {
    const schema = choice
      ? Joi.object(bodySchema)
          .xor(...choice)
          .messages({ "object.missing": xorMessage })
      : Joi.object(bodySchema);

    try {
      req.body = await schema.validateAsync(req.body, { abortEarly: false });
      next();
    } catch (error) {
      if (error.name === "ValidationError") {
        res.dispatch.BadRequest(
          stringFields(error.details.map((err) => err.message))
        );
      } else next(error);
    }
  };
}

module.exports = validateBody;
