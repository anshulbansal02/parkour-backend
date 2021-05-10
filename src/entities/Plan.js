const { model, Schema } = require("mongoose");

const Slot = {
  label: { type: String, required: true, trim: true, maxlength: 50 },
  notes: { type: String },
  items: [Schema.Types.ObjectId],
};

const PlanSchema = new Schema({
  title: { type: String, required: true },
  notes: { type: String, maxlength: 500 },
  meta: { type: Object },
  slots: { type: [Slot], required: true },
  owner: { type: Schema.Types.ObjectId, required: true },
  pinned: { type: Boolean, default: false },
  createdOn: { type: Date, default: new Date() },
  updatedOn: { type: Date },
});

const Plan = model("Plans", PlanSchema);

module.exports = Plan;
