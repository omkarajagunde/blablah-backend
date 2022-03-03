const mongoose = require("mongoose");
const joi = require("@hapi/joi");

const locationSchema = new mongoose.Schema({
    cities: { type: Array },
    states: { type: Array },
    countries: { type: Array },
})

const targetSchema = new mongoose.Schema({
    forMale: { type: Boolean },
    forFemale: { type: Boolean },
    forAny: { type: Boolean },
    isStrictlyGenderSpecific: { type: Boolean },
    location: locationSchema,
    interests: { type: Array }
})

const flagsSchema = new mongoose.Schema({
    isBannerAd: { type: Boolean },
    isTextAd: { type: Boolean },
    isClickConfirmedAd: { type: Boolean },
    runToConsumeAllCredits: { type: Boolean }
})

const adOwnerInfoSchema = new mongoose.Schema({
    fullname: { type: String },
    email: { type: String, min: 5, max: 120 },
    phoneNo: { type: Number, length: 10 },
    countryCode: { type: String, min: 1, max: 10}
})

const AdSchema = new mongoose.Schema({
    _id: {  type: mongoose.Types.ObjectId, required: true },
    redirectURI: { type: String, min: 3, max: 500 },
    textAdContent: { type: String, min: 3, max: 100 },
    bannerAdImageURI: {  type: String, min: 3, max: 500 },
    campaignStartDate: { type: Date },
    campaignEndDate: { type: Date },

    maxCredits: { type: Number, min: 500 },
    usedCredits: { type: Number, default: 0 }, 
    clicks: { type: Number, default: 0 },
    confirmedClicks: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },

    isAdCampaignApproved: { type: Boolean, default: false },

    adOwnerInfo: adOwnerInfoSchema,
    target: targetSchema,
	flags: flagsSchema,
	addedAt: {
		type: Date,
		default: Date.now,
	},
    updatedAt: {
		type: Date,
        default: Date.now,
	},
});

const AdSchemaValidation = joi.object({
    _id: joi.any(),
	redirectURI: joi.string().min(3).max(500).required(),
    textAdContent: joi.string().min(3).max(100).required().allow(null, ""),
    bannerAdImageURI: joi.string().min(3).max(500).required().allow(null, ""),
    campaignStartDate: joi.date().iso().required(),
    campaignEndDate : joi.date().iso().greater(joi.ref('campaignStartDate')).required(),

    maxCredits: joi.number().integer().positive().min(500).required(),
    usedCredits: joi.number().integer().min(0).max(joi.ref('maxCredits')).required().optional(),

    clicks: joi.number().integer().positive().required().optional(),
    confirmedClicks: joi.number().integer().positive().required().optional(),
    impressions: joi.number().integer().positive().required().optional(),

    isAdCampaignApproved: joi.boolean().required().allow(null, "").optional(),

    adOwnerInfo: joi.object({
        fullname: joi.string().min(2).max(200).required(),
        email: joi.string().email().required(),
        phoneNo: joi.string().required().length(10).pattern(new RegExp("^(0|[1-9][0-9]*)$")),
        countryCode: joi.string().min(1).max(10).required()
    }).required(),

    flags: joi.object({
        isBannerAd: joi.boolean().required(),
        isTextAd: joi.boolean().required(),
        isClickConfirmedAd: joi.boolean().required(),
        runToConsumeAllCredits: joi.boolean().required()
    }).required(),

    target: joi.object({
        forMale: joi.boolean().required(),
        forFemale: joi.boolean().required(),
        forAny: joi.boolean().required(),
        isStrictlyGenderSpecific: joi.boolean().required(),
        location: joi.object({
            cities: joi.array().min(1).required().allow(null, ""),
            states: joi.array().min(1).required().allow(null, ""),
            countries: joi.array().min(1).required().allow(null, ""),
        }),
        interests: joi.array().min(1).required().allow(null, ""),
    }).required(),

    updatedAt: joi.date().iso().required().optional(),

});

const AdvertisementValidation = (body) => {
	const { error } = AdSchemaValidation.validate(body);
	return error;
};

module.exports = { ad: mongoose.model("ad", AdSchema), AdvertisementValidation };
