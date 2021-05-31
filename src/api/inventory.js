const { Router } = require("express");
const mongoose = require("mongoose");

const { InventoryItem, User } = require("./../entities/index.js");

const { fileware, auth } = require("../middlewares/index.js");
const { authenticate } = auth;

const { stringFields } = require("../utils/index.js");
const { mimeTypes } = require("./../constants/index.js");

const router = Router();

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

    res.dispatch.Created({ data: item });
  } catch (err) {
    if (err.name === "ValidationError")
      res.dispatch.BadRequest(
        `Please provide valid ${stringFields(err.errors)}`
      );
    else next(err);
  }
});

const filters = {
  start: { type: Number, min: 1, max: Infinity, default: 1 },
  limit: { type: Number, min: 1, max: 20, default: 10 },
  sortby: { type: "Enumerator", values: ["date", "title"], default: "date" },
  order: {
    type: "Enumerator",
    values: ["asc", "dsc", 1, -1],
    default: 1,
  },
  type: {
    type: "Enumerator",
    values: ["food", "activity", "all"],
    default: "all",
  },
};

//
router.get("/", async (req, res, next) => {
  let params = {};
  ["query", "start", "limit", "sortby", "order", "type"].forEach(
    (prop) => (params[prop] = req.query[prop])
  );

  try {
    params = validateFilters(filters, params);
  } catch (err) {
    if (err.name === "FilterError") {
      res.dispatch.BadRequest(err.message);
      return;
    }
    next(err);
    return;
  }

  // TODO: Find a better way to contruct query
  if (params.sortby === "date") params.sortby = "createdOn";

  if (params.order === "asc") params.order = 1;
  else if (params.order === "dsc") params.order = -1;

  const query = [
    { $sort: { [params.sortby]: params.order } },
    { $skip: params.start - 1 },
    { $limit: params.limit },
  ];

  if (!(params.type === "all")) query.push({ $match: { type: params.type } });

  const agg = await Plan.aggregate(query);

  res.dispatch.OK({ data: agg });
});

module.exports = router;
