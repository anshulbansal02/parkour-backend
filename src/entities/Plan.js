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

const PlanSchema = new Schema({
  _id: { type: String, default: () => nanoid(12) },
  type: { type: String, enum: ["diet", "workout"], required: true },
  title: { type: String, required: true },
  notes: { type: String, maxlength: 500 },
  meta: { type: Object },
  slots: {
    type: [Slot],
    required: true,
    validate: {
      validator: arrayValidator,
    },
  },
  owner: { type: Schema.Types.ObjectId, ref: "Users", required: true },
  pinned: { type: Boolean, default: false },
  createdOn: { type: Date, default: new Date() },
  updatedOn: { type: Date },
});

const Plan = model("Plans", PlanSchema);

module.exports = Plan;
