const { model, Schema } = require("mongoose");
const bcrypt = require("bcrypt");
const { nanoid } = require("nanoid");

const { reMap } = require("../constants/index.js");

function generateUserId() {
  return +new Date() + "#" + nanoid(24);
}

const UserSchema = new Schema({
  _id: {
    type: String,
    required: true,
    default: generateUserId(),
  },
  name: {
    type: String,
    required: true,
    trim: true,
    match: reMap.name,
    maxLength: 50,
    minLength: 3,
  },
  username: {
    type: String,
    required: true,
    match: reMap.username,
    maxLength: 50,
  },
  email: {
    type: String,
    match: reMap.email,
    maxLength: 100,
  },
  tempEmail: {
    type: String,
    required: true,
    match: reMap.email,
    maxLength: 100,
  },
  avatar: { type: String },
  bio: { type: String, maxLength: 256 },
  password: { type: String, required: true },
  createdAt: { type: Date, default: new Date() },
});

UserSchema.virtual("userId").get(function () {
  return this._id;
});

// Password Methods
UserSchema.methods.setPassword = async function (value) {
  this.password = await bcrypt.hash(value, 10);
};

UserSchema.methods.isValidPassword = async function (value) {
  try {
    return await bcrypt.compare(value, this.password);
  } catch (err) {
    return err;
  }
};

UserSchema.virtual("profile").get(function () {
  const { name, bio, username, email, avatar } = this;
  return { name, bio, username, email, avatar };
});

UserSchema.virtual("publicProfile").get(function () {
  const { name, bio, username, avatar } = this;
  return { name, bio, username, avatar };
});

UserSchema.statics.getProfile = function (username) {
  return this.findOne(
    { username },
    { _id: 0, name: 1, bio: 1, username: 1, email: 1, avatar: 1 }
  );
};

UserSchema.statics.getPublicProfile = function (username) {
  return this.findOne(
    { username },
    { _id: 0, name: 1, bio: 1, username: 1, avatar: 1 }
  );
};

// Indices
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 }, { unique: true });

const User = model("Users", UserSchema);

module.exports = User;
