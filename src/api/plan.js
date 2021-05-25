const { Router } = require("express");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

const { Plan, User } = require("./../entities/index.js");

const Response = require("../response/index.js");
const { authenticate } = require("../auth/index.js");

const { stringFields, validateFilters } = require("../utils/index.js");

const router = Router();
const { BadRequest, OK, Created } = Response;

// @ [POST] Create plan
router.post("/", async (req, res, next) => {
  const { type, title, description, meta, days } = req.body;
  // const { username } = req.user;
  const username = "anshulbansal";

  // Check if meta object is valid

  try {
    const { _id } = User.findOne({ username }).select("_id");

    const plan = new Plan({
      title,
      type,
      description,
      meta,
      days,
      owner: mongoose.Types.ObjectId(_id),
    });

    // TODO: check if its required to validate meta
    // TODO: check if its required to validate each inventoryItem in slots

    await plan.validate();
    await plan.save();

    // TODO: Include only necessary keys
    res.dispatch(new Created({ data: plan }));
  } catch (err) {
    if (err.name === "ValidationError")
      res.dispatch(
        new BadRequest(`Please provide valid ${stringFields(err.errors)}`)
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
    values: ["diet", "workout", "all"],
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
      res.dispatch(new BadRequest(err.message));
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

  res.dispatch(new OK({ data: agg }));
});

router.get("/:id", authenticate(), async (req, res, next) => {
  const { id } = req.params;

  try {
    const plan = Plan.findOne({ id });
    if (!plan) res.dispatch(new BadRequest(`No plan found with id ${id}`));
    // TODO: Include Only necessary keys
    res.dispatch(new OK({ data: plan }));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", authenticate(), async (req, res, next) => {
  const { id } = req.params;
  const { title, description, meta, days, pinned } = req.body;
});

router.delete("/:id", authenticate(), async (req, res, next) => {
  const { id } = req.params;

  try {
    await Plan.delete();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
