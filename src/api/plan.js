const { Router } = require("express");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

const { Plan, User } = require("./../entities/index.js");

const Response = require("../response/index.js");
const { authenticate } = require("../auth/index.js");

const { stringFields } = require("../utils/index.js");

const router = Router();
const { BadRequest, OK } = Response;

// CREATE
router.post("/", async (req, res, next) => {
  const { title, notes, meta, slots, type } = req.body;
  // const { username } = req.user;
  const username = "anshulbansal";

  // Check if meta object is valid

  try {
    const { _id } = User.findOne({ username }).select("_id");

    const plan = new Plan({
      title,
      type,
      notes,
      meta,
      slots,
      owner: mongoose.Types.ObjectId(_id),
    });

    // TODO: check if its required to validate meta
    // TODO: check if its required to validate each inventoryItem in slots

    await plan.validate();
    await plan.save();

    // TODO: Include only necessary keys
    res.dispatch(new OK({ data: plan }));
  } catch (err) {
    if (err.name === "ValidationError")
      res.dispatch(
        new BadRequest(`Please provide valid ${stringFields(err.errors)}`)
      );
    else next(err);
  }
});

// READ
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

// UPDATE
router.patch("/:id", authenticate(), async (req, res, next) => {
  const { id } = req.params;
  const { title, notes, meta, slots, pinned } = req.body;
});

// DELETE
router.delete("/:id", authenticate(), async (req, res, next) => {
  const { id } = req.params;

  try {
    await Plan.delete();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
