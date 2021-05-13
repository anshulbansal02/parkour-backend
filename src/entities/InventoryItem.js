const { model, Schema } = require("mongoose");
const { nanoid } = require("mongoose");

const InventoryItemSchema = new Schema({
  _id: { type: String, default: () => nanoid(16) },
  type: { type: String, enum: ["food", "activity"] },
  label: { type: String, required: true, maxlength: 50 },
  description: { type: String, maxlength: 2000 },
  // Generic object, can store any key:value discription of item
  meta: { type: Object },
  media: {
    mimeType: { type: String, enum: ["video", "photo"] },
    uri: { type: String },
  },
  owner: { type: Schema.Types.ObjectId, ref: "Users" },
  // Using soft deletes
  deleted: { type: Boolean, required: true, default: false },
});

const InventoryItem = model("InventoryItems", InventoryItemSchema);

module.exports = InventoryItem;
