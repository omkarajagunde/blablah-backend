const mongoose = require("mongoose");
const joi = require("@hapi/joi");

const userRegisterSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		max: 100,
		index: true,
	},

	surname: {
		type: String,
		required: true,
		max: 100,
	},

	countryCode: {
		type: String,
		required: true,
		min: 1,
		max: 15,
		default: "+91",
	},

	mobile: {
		type: String,
		required: true,
		min: 10,
		max: 10,
	},

	address: {
		type: String,
		required: true,
		min: 5,
		max: 300,
	},

	pincode: {
		type: String,
		required: true,
		min: 2,
		max: 8,
	},

	city: {
		type: String,
		required: true,
		min: 1,
		max: 100,
	},

	state: {
		type: String,
		required: true,
		min: 1,
		max: 100,
	},

	country: {
		type: String,
		required: true,
		min: 1,
		max: 100,
	},

	email: {
		type: String,
		required: true,
		max: 320,
		min: 4,
		lowercase: true,
		trim: true,
	},

	password: {
		type: String,
		required: true,
		min: 6,
		max: 1024,
	},

	date: {
		type: Date,
		default: Date.now(),
	},

	userApproved: {
		type: Boolean,
		default: false,
	},

	userOTP: {
		type: String,
		default: "",
	},
});

const checkPincode = (value, helpers) => {
	if (isNaN(value)) throw new Error("Pincode should be only numeric");
};

const registerValidationSchema = joi.object({
	name: joi.string().max(50).required(),
	surname: joi.string().max(100).required(),
	countryCode: joi.string().min(1).max(15).required(),
	mobile: joi.string().required().length(10).pattern(new RegExp("^(0|[1-9][0-9]*)$")),
	address: joi.string().required().min(6).max(100),
	pincode: joi.string().min(2).max(8).required().custom(checkPincode),
	city: joi.string().min(1).max(100).required(),
	state: joi.string().min(1).max(100).required(),
	country: joi.string().min(1).max(100).required(),
	email: joi.string().min(3).max(320).required().email(),
	password: joi.string().min(8).max(1024).required(),
	userOTP: joi.string().length(6),
	approved: joi.boolean().required().allow(null, ""),
});

const registerValidation = (body) => {
	const { error } = registerValidationSchema.validate(body);
	return error;
};

module.exports = { user: mongoose.model("Admin", userRegisterSchema), registerValidation };
