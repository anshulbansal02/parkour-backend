const { model, Schema } = require("mongoose");
const bcrypt = require("bcrypt");

const { reMap } = require("../constants/index.js");

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    match: reMap.name,
  },
  username: {
    type: String,
    required: true,
    match: reMap.username,
  },
  email: {
    type: String,
    required: true,
    match: reMap.email,
  },
  avatar: { type: String },
  password: { type: String, required: true },
  createdAt: { type: Date, default: new Date() },
  plans: { type: [Schema.Types.ObjectId], default: [] },
  inventory: { type: [Schema.Types.ObjectId], default: [] },
  verified: { type: Boolean, default: false },
});

// Password Methods
UserSchema.methods.setPassword = async function (value) {
  this.password = await bcrypt.hash(value, 10);
};

UserSchema.methods.isValidPassword = async function (value) {
  return await bcrypt.compare(value, this.password, (err, same) => {
    return same;
  });
};

UserSchema.methods.getProfile = function () {
  const { name, username, email, avatar, verified } = this;
  return { name, username, email, avatar, verified };
};

// Indices
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });

const User = model("Users", UserSchema);

module.exports = User;
