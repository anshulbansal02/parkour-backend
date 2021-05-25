const { Router } = require("express");
const mongoose = require("mongoose");

const { InventoryItem, User } = require("./../entities/index.js");

const Response = require("../response/index.js");
const { authenticate } = require("../auth/index.js");
const { fileware } = require("../middlewares/index.js");

const { stringFields } = require("../utils/index.js");
const { mimeTypes } = require("./../constants/index.js");

const router = Router();
const { BadRequest, OK, Created } = Response;

const fileMiddleware = fileware("media", 5 * 1024 * 1024, mimeTypes.media);

// CREATE
router.post("/", authenticate(), fileMiddleware, async (req, res, next) => {
  const { type, label, description, meta } = req.body;
  const { filename: uri, mimeType } = req.file;
  const { username } = req.user;

  try {
    const { _id } = User.findOne({ username }).select("_id");

    const item = new InventoryItem({
      type,
      label,
      description,
      meta,
      media: { uri, mimeType },
      owner: mongoose.Types.ObjectId(_id),
    });

    await item.validate();
    await item.save();

    res.dispatch(new Created({ data: item }));
  } catch (err) {
    if (err.name === "ValidationError")
      res.dispatch(
        new BadRequest(`Please provide valid ${stringFields(err.errors)}`)
      );
    else next(err);
  }
});

module.exports = router;
