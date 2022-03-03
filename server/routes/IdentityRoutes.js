const { canvas, faceDetectionNet, faceDetectionOptions } = require("../helpers/ageAndGenderDetection");
const faceapi = require("face-api.js");
const router = require("express").Router();
const { verifyTokenMiddleware } = require("./middlewares");

// api.[Domain]/api/chat/identity/agdetector
router.post("/agdetector", verifyTokenMiddleware, async (request, response) => {
	const { body } = request;

	await faceDetectionNet.loadFromDisk(expressServerRoot + "/resources/");
	await faceapi.nets.ageGenderNet.loadFromDisk(expressServerRoot + "/resources/");
	const img = await canvas.loadImage(body.imageURL);
	const results = await faceapi.detectAllFaces(img, faceDetectionOptions).withAgeAndGender();
	if (results.length > 0) response.status(200).send({ status: 200, message: "success", data: results[0] });
	else response.status(500).send({ status: 500, message: "failure, image sent was not neat", data: [] });
});

module.exports = router;
