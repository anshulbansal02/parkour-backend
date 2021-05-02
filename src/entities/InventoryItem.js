const { model, Schema } = require("mongoose");

const InventoryItemSchema = new Schema({
  label: { type: String, required: true },
});

const InventoryItem = model("InventoryItems", InventoryItemSchema);

module.exports = InventoryItem;
