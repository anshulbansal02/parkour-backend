const redis = require("redis");
const util = require("util");

const userMap = "username_id_mapping";

const redisClient = redis.createClient();

redisClient.on("error", (err) => console.log(err));

redisClient.hset = util.promisify(redisClient.hset);
redisClient.hget = util.promisify(redisClient.hget);
redisClient.hgetall = util.promisify(redisClient.hgetall);

async function set(userId, username) {
  return await redisClient.hset(userMap, userId, username);
}

async function get(userId) {
  return await redisClient.hget(userMap, userId);
}

async function getall() {
  return await redisClient.hgetall(userMap);
}

module.exports = {
  set,
  get,
  getall,
};
