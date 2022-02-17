const router = require("express").Router();
const AdminModel = require("../models/Admin");
const { logRequests } = require("../routes/middlewares");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var mongoose = require("mongoose");
const { verifyTokenMiddleware } = require("./middlewares");

// [Domain]/api/admin/register
router.post("/register", logRequests, async (request, response) => {
	const { body } = request;
	// Validating data
	const errorLog = AdminModel.registerValidation(body);
	if (errorLog) return response.status(400).send({ status: 400, message: errorLog.details[0].message });

	// checking if email exists
	const emailPresent = await AdminModel.user.findOne({ email: body.email });
	if (emailPresent) return response.status(401).send({ status: 401, message: "Admin with this email already exists", emailPresent: true });

	// checking if phone number unique
	const phoneCheck = await AdminModel.user.findOne({ mobile: body.mobile });
	if (phoneCheck) return response.status(402).send({ status: 402, message: "user with this mobile number already exists", mobileNumberPresent: true });

	//Hash passwords
	const salt = await bcrypt.genSalt(10);
	const hashpassword = await bcrypt.hash(body.password, salt);

	// creating user model
	const user = new AdminModel.user({
		name: body.name,
		surname: body.surname,
		countryCode: body.countryCode,
		mobile: body.mobile,
		address: body.address,
		pincode: body.pincode,
		city: body.city,
		state: body.state,
		country: body.country,
		email: body.email,
		password: hashpassword,
		approved: false,
		userOTP: "",
	});

	try {
		const savedAdmin = await user.save();
		response.status(200).send({ status: 200, message: "user added successfully", data: savedAdmin });
	} catch (error) {
		response.status(400).send({ status: 400, message: error });
	}
});

// [Domain]/api/admin/check/unique/mobile
router.post("/check/unique/mobile", logRequests, async (request, response) => {
	const { body } = request;
	if (!body.mobile) return response.status(400).send({ status: 400, message: "mobile key missing" });
	if (body.mobile.length !== 10) return response.status(400).send({ status: 400, message: "mobile number should be 10 digits long" });
	if (isNaN(body.mobile)) return response.status(400).send({ status: 400, message: "mobile number should be numeric" });
	// checking if the user exists in database
	const user = await AdminModel.user.findOne({ mobile: body.mobile });
	if (user) return response.status(400).send({ status: 400, message: "mobile number is not unique" });

	response.status(200).send({ status: 200, message: "mobile number is unique" });
});

// [Domain]api/admin/generate/otp
router.post("/generate/otp", logRequests, async (request, response) => {
	const { body } = request;
	if (!body.mobile) return response.status(400).send({ status: 400, message: "mobile key missing" });

	// checking if the user exists in database
	const user = await AdminModel.user.findOne({ mobile: body.mobile });
	if (!user) return response.status(400).send({ status: 400, message: "mobile number does not exist" });

	let otp = Math.floor(100000 + Math.random() * 900000);
	user.userOTP = otp;

	// TODO here send otp to mobile phone ... then run following code
	try {
		const savedAdmin = await user.save();
		// TODO comment this below line when otp service integrated
		console.log("OTP for user with mobile number :: ", user.mobile, " is :: ", otp);

		response.status(200).send({ status: 200, message: "OTP sent successfully" });
		setTimeout(async () => {
			try {
				user.userOTP = "";
				const savedAdmin = await user.save();
			} catch (error) {
				console.log(error);
			}
		}, 60000);
	} catch (error) {
		response.status(400).send({ status: 400, message: error });
	}
});

// [Domain]/api/admin/login
router.post("/login", async (request, response) => {
	const { body } = request;
	if (!body.mobile) return response.status(400).send({ status: 400, message: "mobile key is missing" });
	if (!body.password) return response.status(400).send({ status: 400, message: "password key missing" });
	if (!body.otp) return response.status(400).send({ status: 400, message: "otp key missing" });
	if (body.otp.length !== 6) return response.status(400).send({ status: 400, message: "OTP should be 6 digits long" });

	// checking if the user exists in database
	const user = await AdminModel.user.findOne({ mobile: body.mobile });
	if (!user) return response.status(401).send({ status: 401, message: "Admin with this email does not exists", emailPresent: false });

	// checking if the password is valid
	const checkPassword = await bcrypt.compare(body.password, user.password);
	if (!checkPassword) return response.status(402).send({ status: 402, message: "Wrong password entered" });

	// checking otp is valid or not
	if (user.userOTP !== body.otp) {
		return response.status(403).send({ status: 403, message: "OTP probably expired, or wrong, regenerate OTP" });
	}

	try {
		user.userOTP = "";
		const savedAdmin = await user.save();
	} catch (error) {
		console.log(error);
	}

	// create and assign token
	const token = jwt.sign({ _id: user._id }, process.env.JWT_TOEKN_SECRET);

	response.status(200).set("auth-token", token).send({ status: 200, data: user, message: "Admin login was successfull", loginToken: token });
});

module.exports = router;
