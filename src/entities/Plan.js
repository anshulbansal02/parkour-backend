const { model, Schema } = require("mongoose");

const PlanSchema = new Schema({
  title: { type: String, required: true },
  createdOn: { type: Date, default: new Date() },
  updatedOn: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, required: true },
  pinned: { type: Boolean },
});
const Plan = model("Plans", PlanSchema);

module.exports = Plan;
