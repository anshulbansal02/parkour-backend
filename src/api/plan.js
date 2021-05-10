const { Router } = require("express");

const Plan = require("./../entities/index.js");

const Response = require("../response/index.js");
const { authenticate } = require("../auth/index.js");

const router = Router();
const { BadRequest, OK } = Response;

// Authentication Middlewares

// CREATE
router.post("/", authenticate(), async (req, res, next) => {
  const { title, notes, meta, slots } = req.body;

  // Check if meta object is valid

  try {
    // TODO: Add owner as well
    const plan = new Plan({ title, notes, meta, slots });

    await plan.validate();
    await plan.save();

    // TODO: Include only necessary keys
    res.dispatch(new OK({ data: plan }));
  } catch (err) {
    next(err);
  }
});

// READ
router.get("/:id", authenticate(),(req, res,next) => {
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

// UPDATE
router.patch("/:id",authenticate(), (req, res, next) => {
  const { id } = req.params;
  const { title, notes, meta, slots, pinned } = req.body;
});

// DELETE
router.delete("/:id", authenticate(),(req, res, next) => {
  const { id } = req.params;

  try {
    await Plan.delete()
  } catch (err) {
    next(err)
  }
});

module.exports = router;
