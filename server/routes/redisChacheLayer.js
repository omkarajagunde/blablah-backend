var Redis = require("ioredis");

var client = new Redis(6379, "blablah-redis-server");

const set = (key, value) => {
	if (Array.isArray(value) && Array.isArray(key)) {
		let tempArr = [];

		for (let idx = 0; idx < key.length; idx++) {
			let arr = [];
			arr.push("set");
			arr.push(key[idx]);
			arr.push(JSON.stringify(value[idx]));
			tempArr.push(arr);
		}

		return new Promise((resolve, reject) => {
			client.multi(tempArr).exec((err, result) => {
				if (err) reject(`Err while muliplte keys setting in redis cache : ${err}`);
				if (result) resolve(result);
			});
		});
	}

	if (!Array.isArray(value) && !Array.isArray(key)) {
		return new Promise((resolve, reject) => {
			client
				.set(key, JSON.stringify(value))
				.then((reply) => resolve(reply))
				.catch((err) => reject(`Err while single key setting in redis cache : ${err}`));
		});
	}

	return Promise.reject(`Wrong Key, Value provided`);
};

const get = (key) => {
	if (Array.isArray(key)) {
		return new Promise((resolve, reject) => {
			client
				.mget([...key])
				.then((reply) => {
					resolve(reply.map((elem) => JSON.parse(elem)));
				})
				.catch((err) => reject(`Err while getting multiple keys from redis cache : ${err}`));
		});
	}

	if (!Array.isArray(key)) {
		return new Promise((resolve, reject) => {
			client
				.get(key)
				.then((reply) => resolve(JSON.parse(reply)))
				.catch((err) => reject(`Err while getting single key from redis cache : ${err}`));
		});
	}

	return Promise.reject(`Wrong Key provided`);
};

const keys = (match) => {
	return new Promise((resolve, reject) => {
		client
			.keys(match)
			.then((result) => resolve(result))
			.catch((err) => reject(`Err while getting all keys from redis cache : ${err}`));
	});
};

const del = (key) => {
	return new Promise((resolve, reject) => {
		client
			.del(key)
			.then((reply) => resolve(reply))
			.catch((err) => reject(`Err while deleting key in redis cache : ${err}`));
	});
};

const flushall = () => {
	return new Promise((resolve, reject) => {
		client
			.flushdb()
			.then((reply) => resolve(reply))
			.catch((err) => reject(`Err while flushing all redis cache : ${err}`));
	});
};

module.exports = { redis: { get, set, keys, del, flushall } };
