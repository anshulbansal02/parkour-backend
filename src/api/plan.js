const { Router } = require("express");

const { Plan, User } = require("./../entities/index.js");

const { Auth, ValidateBody } = require("../middlewares/index.js");
const { authenticate } = Auth;

const { validateFilters } = require("../utils/index.js");
const Joi = require("joi");

const router = Router();

const planBodyValidator = {
  type: Joi.string().valid("diet", "workout").required(),
  title: Joi.string().max(50).required(),
  description: Joi.string().max(500),
  meta: Joi.object(),
  days: Joi.array().items(
    Joi.object({
      label: Joi.string().required(),
      slots: Joi.array().items(
        Joi.object({
          label: Joi.string().required(),
          notes: Joi.string().max(200),
          items: Joi.array().items(Joi.string()),
        })
      ),
    })
  ),
};

// @ [POST] Create plan
router.post(
  "/",
  authenticate(),
  ValidateBody(planBodyValidator),
  async (req, res, next) => {
    const { type, title, description, meta, days } = req.body;
    const { userId } = req.authenticatedUser;

    try {
      const plan = new Plan({
        title,
        type,
        description,
        meta,
        days,
        owner: userId,
      });

      await plan.save();

      res.dispatch.Created({ data: plan });
    } catch (err) {
      next(err);
    }
  }
);

// Read Plans
router.get(
  "/",
  authenticate(),
  ValidateBody({
    start: Joi.number().min(1).max(Infinity).default(1),
    limit: Joi.number().min(1).max(20).default(10),
    sortby: Joi.string().trim().valid("date", "title").default("date"),
    order: Joi.string().valid("asc", "dsc").default("asc"),
    type: Joi.string().valid("diet", "workout", "all").default("all"),
  }),
  async (req, res, next) => {
    let params = {};
    ["query", "start", "limit", "sortby", "order", "type"].forEach(
      (prop) => (params[prop] = req.query[prop])
    );

    const user = await User.findOne({ username: req.user });

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
      { $match: { owner: user._id } },
      { $sort: { [params.sortby]: params.order } },
      { $skip: params.start - 1 },
      { $limit: params.limit },
    ];

    if (!(params.type === "all"))
      query[0].$match = { ...query[0].$match, type: query.type };

    const agg = await Plan.aggregate(query);

    res.dispatch.OK({ data: agg });
  }
);

// Read plan by id
router.get("/:id", authenticate(), async (req, res, next) => {
  const { id } = req.params;

  try {
    const plan = Plan.findOne({ id });
    if (!plan) res.dispatch.BadRequest(`No plan found with id ${id}`);
    // TODO: Include Only necessary keys
    res.dispatch.OK({ data: plan });
  } catch (err) {
    next(err);
  }
});

const updatedPlanBodyValidator = {
  title: Joi.string().max(50).required(),
  description: Joi.string().max(500),
  meta: Joi.object(),
  days: Joi.array().items(
    Joi.object({
      label: Joi.string().required(),
      slots: Joi.array().items(
        Joi.object({
          label: Joi.string().required(),
          notes: Joi.string().max(200),
          items: Joi.array().items(Joi.string()),
        })
      ),
    })
  ),
  pinned: Joi.bool(),
};

// Update plan by id
router.patch(
  "/:id",
  authenticate(),
  ValidateBody(updatedPlanBodyValidator),
  async (req, res, next) => {
    const { id } = req.params;
    const { title, description, meta, days, pinned } = req.body;

    try {
      const plan = Plan.exists({ id });
      if (!plan) res.dispatch.BadRequest(`No plan found with id ${id}`);
      // TODO: Include Only necessary keys

      const updatedPlan = await Plan.updateOne(
        { id },
        { title, description, meta, days, pinned }
      );

      res.dispatch.OK({ data: updatedPlan });
    } catch (err) {
      next(err);
    }
  }
);

// Delete plan by id
router.delete("/:id", authenticate(), async (req, res, next) => {
  const { id } = req.params;

  try {
    const plan = Plan.findOne({ id });
    if (!plan) res.dispatch.BadRequest(`No plan found with id ${id}`);
    // TODO: Include Only necessary keys

    plan.deleted = true;
    await plan.save();

    res.dispatch.OK();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
