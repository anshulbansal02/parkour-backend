const { model, Schema } = require("mongoose");

const TOKEN_MAX_AGE = "20d";

const SessionSchema = new Schema({
  _id: { type: String, alias: "token", required: true },
});

SessionSchema.index({ expires: TOKEN_MAX_AGE });

const Session = model("Sessions", SessionSchema);

module.exports = Session;
