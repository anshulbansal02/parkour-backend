const { model, Schema } = require("mongoose");
const { nanoid } = require("nanoid");

function arrayValidator(v) {
  return Array.isArray(v) && v.length > 0;
}

const Slot = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 50 },
    notes: { type: String },
    items: {
      type: [String],
      ref: "InventoryItems",
      required: true,
      validate: {
        validator: arrayValidator,
      },
    },
  },
  { _id: false }
);

const Day = new Schema({
  label: { type: String, required: true },
  slots: { type: [Slot], required: true },
});

const PlanSchema = new Schema({
  _id: { type: String, default: () => nanoid(12) },
  type: { type: String, enum: ["diet", "workout"], required: true },
  title: { type: String, required: true, maxlength: 50 },
  description: { type: String, maxlength: 500 },
  meta: { type: Map },
  days: { type: [Day], required: true },
  owner: { type: Schema.Types.ObjectId, ref: "Users", required: true },
  pinned: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  createdOn: { type: Date, default: new Date() },
  updatedOn: { type: Date },
});

const Plan = model("Plans", PlanSchema);

module.exports = Plan;
