const redis = require("redis");
const util = require("util");

const tokenBlocklist = "token_blocklist";

const redisClient = redis.createClient();

redisClient.on("error", (err) => console.log(err));

redisClient.sismember = util.promisify(redisClient.sismember);
redisClient.sadd = util.promisify(redisClient.sadd);
redisClient.srem = util.promisify(redisClient.srem);

async function add(token) {
  return await redisClient.sadd(tokenBlocklist, token);
}

async function exists(token) {
  return await redisClient.sismember(tokenBlocklist, token);
}

async function remove(token) {
  return await redisClient.srem(tokenBlocklist, token);
}

module.exports = {
  add,
  exists,
  remove,
};
