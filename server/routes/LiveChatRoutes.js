const router = require("express").Router();
const SmartReplyModel = require("../models/SmartReply");
const NKeywordsModel = require("../models/NegativeKeywords");
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

// [Domain]/api/chat/enablement/get/nkeywords
router.get("/get/nkeywords", logRequests, verifyTokenMiddleware, async (request, response) => {
	const { body } = request;
	let nKeywordsArr = await NKeywordsModel.NKeywordsSchema.find();
	return response.status(200).send({ status: 200, message: "NKeywords array sent successfully", data: nKeywordsArr });
});

// [Domain]/api/chat/enablement/add/nKeywords
router.post("/add/nKeywords", logRequests, verifyTokenMiddleware, async (request, response) => {
	const { body } = request;

	if (!body.text || body.text === "") return response.status(400).send({ status: 400, message: "text key not present", data: [] });
	if (!body.array || body.array === "" || body.array === []) return response.status(400).send({ status: 400, message: "arrray key not present or found empty", data: [] });

	// Validating data
	const errorLog = NKeywordsModel.NKeywordsValidation(body);
	if (errorLog) return response.status(400).send({ status: 400, message: errorLog.details[0].message });

	// see if text already exists
	const msg = await  NKeywordsModel.NKeywordsSchema.findOne({ text: body.text });
	if (msg) return response.status(400).send({ status: 400, message: `Already exists`, data: msg });

	// creating user model
	const obj = new NKeywordsModel.NKeywordsSchema({
		text: body.text,
		array: body.array
	});

	try {
		const savedObj = await obj.save();
		response.status(200).send({ status: 200, message: "Negative Keywords array added successfully", data: savedObj });
	} catch (error) {
		response.status(400).send({ status: 400, message: error });
	}
});

// [Domain]/api/chat/enablement/delete/nkeywords
router.post("/delete/nkeywords", logRequests, verifyTokenMiddleware, async (request, response) => {
	const { body } = request;

	if (!body.id || body.id === "") return response.status(400).send({ status: 400, message: "id not present", data: [] });
	// Validating data

	// see if text already exists
	const text = await NKeywordsModel.NKeywordsSchema.findOne({ _id: body.id });
	if (!text) return response.status(400).send({ status: 400, message: `id not found : does not exists`, data: [] });

	// Perform delete operation
	try {
		await NKeywordsModel.NKeywordsSchema.deleteOne({ _id: body.id });
		return response.status(200).send({ status: 200, message: "text deleted successfully", data: reply });
	} catch (errror) {
		return response.status(400).send({ status: 400, message: error, data: [] });
	}
});

module.exports = router;
