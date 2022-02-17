const mongoose = require("mongoose");
const joi = require("@hapi/joi");

const userRegisterSchema = new mongoose.Schema({
	fullname: {
		type: String,
		required: true,
		max: 100,
		index: true,
	},

	username: {
		type: String,
		required: true,
		max: 50,
		min: 4,
	},

	country: {
		type: String,
		required: true,
		max: 100,
	},

	age: {
		type: String,
		required: true,
		max: 2,
		min: 2,
	},

	gender: {
		type: String,
		required: true,
		max: 6,
		min: 2,
	},
});

const registerValidationSchema = joi.object({
	fullname: joi.string().max(100).required(),
	username: joi.string().max(50).min(4).required(),
	country: joi.string().max(100).required(),
	age: joi.string().max(2).min(2).required(),
	gender: joi.string().max(5).min(2).required(),
});

const registerValidation = (body) => {
	const { error } = registerValidationSchema.validate(body);
	return error;
};

module.exports = { user: mongoose.model("User", userRegisterSchema), registerValidation };
