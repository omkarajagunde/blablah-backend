const mongoose = require("mongoose");
const joi = require("@hapi/joi");

const NKeywordsSchema = new mongoose.Schema({
    title: {
        type: String
    },
	array: {
		type: Array,
	},
	addedAt: {
		type: Date,
		default: Date.now,
	},
});

const NKeywordsValidationSchema = joi.object({
	array: joi.array().min(1).required(),
    title: joi.string().min(1).max(100).required()
});

const NKeywordsValidation = (body) => {
	const { error } = NKeywordsValidationSchema.validate(body);
	return error;
};

module.exports = { NKeywordsSchema: mongoose.model("NKeywordsSchema", NKeywordsSchema), NKeywordsValidation };
