const { model, Schema } = require("mongoose");

const SessionSchema = new Schema({
  _id: { type: String, alias: "refreshToken", required: true },
  accessTokens: { type: [String] },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
  ip: { type: String },
  agent: { type: String },
  platform: { type: String },
  location: { type: String },
});

SessionSchema.index({ userId: 1, _id: 1 });

const Session = model("Sessions", SessionSchema);

module.exports = Session;
