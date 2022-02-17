const jwt = require("jsonwebtoken");
var colors = require("colors");

function verifyTokenMiddleware(request, response, next) {
	const token = request.header("Authorization");

	if (!token) return response.status(401).send({ status: 401, message: "Access denied!" }); // 401 => resource which you cannot access

	const bearer = token.split(" ");
	const bearerToken = bearer[1];

	if (bearer[0] !== "Blabla-Bearer") response.status(400).send({ status: 400, message: "Invalid token provided" });

	try {
		const tokenVerified = jwt.verify(bearerToken, process.env.JWT_TOEKN_SECRET);
		request.userToken = tokenVerified;
		next();
	} catch (error) {
		response.status(400).send({ status: 400, message: "Invalid token provided" });
	}
}

function logRequests(request, response, next) {
	console.log("\n\nRequest :: ".bold.red, request.originalUrl, "\nRequest.body :: ".bold.red, request.body);
	next();
}

module.exports.verifyTokenMiddleware = verifyTokenMiddleware;
module.exports.logRequests = logRequests;
