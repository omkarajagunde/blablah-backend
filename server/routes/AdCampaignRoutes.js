const router = require("express").Router();
const AdSchemaModel = require("../models/AdSchema");
const { logRequests } = require("../routes/middlewares");
const { verifyTokenMiddleware } = require("../routes/middlewares");
const ObjectId = require('mongoose').Types.ObjectId

// [Domain]/api/campaigns/get/ads
router.post("/get/ads", logRequests, verifyTokenMiddleware, async (request, response) => {
	const { body } = request;
	// Validating data
    const { pn, ps, sort } = body;
	if (parseInt(ps) < 0) return response.status(400).send({ status: 400, message: "pageSize (ps) should be 0 or greater than 0", data: [] });
	if (parseInt(pn) < 0) return response.status(400).send({ status: 400, message: "pageNumer (pn) should be 0 or greater than 0", data: [] });
	if (parseInt(sort) !== 0 && parseInt(sort) !== 1) return response.status(400).send({ status: 400, message: "sort should be 0 || 1", data: [] });

	let campaignsCount = await AdSchemaModel.ad.countDocuments();
	let isLastPage;
	if (parseInt(pn) === parseInt(campaignsCount / parseInt(ps))) {
		isLastPage = true;
	} else {
		isLastPage = false;
	}

	const campaigns = await AdSchemaModel.ad
		.find()
		.sort({ _id: sort })
		.skip(parseInt(pn) * parseInt(ps))
		.limit(parseInt(ps));

	return response.status(200).send({ status: 200, message: "campaigns array sent successfully!", data: campaigns, isLastPage });
});

// [Domain]/api/campaigns/create/ad
router.post("/create/ad", logRequests, verifyTokenMiddleware, async (request, response) => {
	const { body } = request;
	// Validating data
	const errorLog = AdSchemaModel.AdvertisementValidation(body);
	if (errorLog) return response.status(400).send({ status: 400, message: errorLog.details[0].message });

    // creating campaign model
	const adCampaign = new AdSchemaModel.ad({ ...body });

    try {
		const savedAdCampaign = await adCampaign.save();
        let sanitizedSchema = { ...savedAdCampaign._doc }
        sanitizedSchema.__v = undefined
        sanitizedSchema.adOwnerInfo._id = undefined
        sanitizedSchema.flags._id = undefined
        sanitizedSchema.target._id = undefined
		response.status(200).send({ status: 200, message: "Ad campaign added successfully", data: sanitizedSchema });
	} catch (error) {
		response.status(400).send({ status: 400, message: error });
	}
});

// [Domain]/api/campaigns/delete/ad
router.post("/delete/ad", logRequests, verifyTokenMiddleware, async (request, response) => {
	const { body } = request;
	// Validating data
    if (!body.campaignId) return response.status(400).send({ status: 400, message: "campaignId key cannot be empty", data: [] });
    if (!ObjectId.isValid(body.campaignId)) return response.status(400).send({ status: 400, message: "campaignId is invalid", data: [] });
	// see if projectId already exists
	const project = await AdSchemaModel.ad.findOne({ _id: body.campaignId });
	if (!project) return response.status(400).send({ status: 400, message: `Campaign with _id : ${body.campaignId} does not exists`, data: [] });

	// Perform delete operation
	try {
		await AdSchemaModel.ad.deleteOne({ _id: body.campaignId });
		return response.status(200).send({ status: 200, message: "Campaign deleted successfully", data: project });
	} catch (errror) {
		return response.status(400).send({ status: 400, message: error, data: [] });
	}
});


// [Domain]/api/campaigns/update/ad
router.post("/update/ad", logRequests, verifyTokenMiddleware, async (request, response) => {
	const { body } = request;
	// Validating data
	if (!body) return response.status(400).send({ status: 400, message: "POST body cannot be empty", data: [] });

	// validate updated json
	const errorLog = AdSchemaModel.AdvertisementValidation(body);
	if (errorLog) return response.status(400).send({ status: 400, message: errorLog.details[0].message });

	// see if campaign already exists
	let campaign = await AdSchemaModel.ad.findOne({ _id: body._id });
	if (!campaign) return response.status(400).send({ status: 400, message: `campaign: does not exists`, data: [] });

    campaign = body

    try {
		let savedSchema = await campaign.save();
        let sanitizedSchema = { ...savedSchema._doc }
        sanitizedSchema.__v = undefined
        sanitizedSchema.adOwnerInfo._id = undefined
        sanitizedSchema.flags._id = undefined
        sanitizedSchema.target._id = undefined
        console.log(sanitizedSchema.adOwnerInfo);
		response.status(200).send({ status: 200, message: "campaign updated successfully", data: sanitizedSchema });
	} catch (error) {
		response.status(401).send({ status: 401, message: error, data: [] });
	}

});

module.exports = router;
