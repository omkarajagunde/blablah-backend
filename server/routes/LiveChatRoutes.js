const router = require("express").Router();
const SmartReplyModel = require("../models/SmartReply");
const { logRequests } = require("../routes/middlewares");
const { verifyTokenMiddleware } = require("../routes/middlewares");

// [Domain]/api/chat/enablement/get/smart/replies
router.get("/get/smart/replies", logRequests, verifyTokenMiddleware, async (request, response) => {
	const { body } = request;
	let smartRepliesArray = await SmartReplyModel.replySchema.find();
	return response.status(200).send({ status: 200, message: "Smart replies array sent successfully", data: smartRepliesArray });
});

// [Domain]/api/chat/enablement/add/smart/reply
router.post("/add/smart/reply", logRequests, verifyTokenMiddleware, async (request, response) => {
	const { body } = request;
	// Validating data
	const errorLog = SmartReplyModel.smartReplyValidation(body);
	if (errorLog) return response.status(400).send({ status: 400, message: errorLog.details[0].message });

	// see if text already exists
	const msg = await SmartReplyModel.replySchema.findOne({ text: body.text });
	if (msg) return response.status(400).send({ status: 400, message: `reply already present`, data: msg });

	// creating user model
	const reply = new SmartReplyModel.replySchema({
		text: body.text,
	});

	try {
		const savedReply = await reply.save();
		response.status(200).send({ status: 200, message: "Smart reply added successfully", data: savedReply });
	} catch (error) {
		response.status(400).send({ status: 400, message: error });
	}
});

// [Domain]/api/chat/enablement/delete/smart/reply
router.post("/delete/smart/reply", logRequests, verifyTokenMiddleware, async (request, response) => {
	const { body } = request;
	// Validating data

	// see if text already exists
	const reply = await SmartReplyModel.replySchema.findOne({ _id: body.id });
	if (!reply) return response.status(400).send({ status: 400, message: `reply test not found : does not exists`, data: [] });

	// Perform delete operation
	try {
		await SmartReplyModel.replySchema.deleteOne({ _id: body.id });
		return response.status(200).send({ status: 200, message: "text deleted successfully", data: reply });
	} catch (errror) {
		return response.status(400).send({ status: 400, message: error, data: [] });
	}
});

// [Domain]/api/chat/enablement/get/ads
router.post("/get/ads", logRequests, async (request, response) => {
	const { body } = request;
	// Validating data
});

module.exports = router;
