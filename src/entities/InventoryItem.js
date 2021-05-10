const { model, Schema } = require("mongoose");

const InventoryItemSchema = new Schema({
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
  deleted: { type: Boolean, required: true, default: false },
});

const InventoryItem = model("InventoryItems", InventoryItemSchema);

module.exports = InventoryItem;
