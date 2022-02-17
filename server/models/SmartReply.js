const mongoose = require("mongoose");
const joi = require("@hapi/joi");

const SmartReplySchema = new mongoose.Schema({
	text: {
		type: String,
	},
	addedAt: {
		type: Date,
		default: Date.now,
	},
});

const smartReplyValidationSchema = joi.object({
	text: joi.string().min(2).required(),
});

const smartReplyValidation = (body) => {
	const { error } = smartReplyValidationSchema.validate(body);
	return error;
};

module.exports = { replySchema: mongoose.model("SmartReply", SmartReplySchema), smartReplyValidation };
