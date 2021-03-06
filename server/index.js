const database = require("mongoose");
const dotenv = require("dotenv");
var cors = require("cors");
const express = require("express");
const { logRequests } = require("./routes/middlewares");
const http = require("http");
var jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const { redis } = require("./routes/redisChacheLayer");
const expressip = require("express-ip");
const serverRequest = require('request-promise');
const analyticsLib = require('analytics').default
const googleAnalytics = require('@analytics/google-analytics').default

var path = require("path");
global.expressServerRoot = path.resolve(__dirname);

//import Routes
const LiveChatRoutes = require("./routes/LiveChatRoutes");
const AuthRoutes = require("./routes/AuthRoutes");
const IdentityRoutes = require("./routes/IdentityRoutes");
const AdCampaignRoutes = require("./routes/AdCampaignRoutes");
const { user } = require("./models/Admin");


// Socket event strings
const CLIENT_INTRODUCTION = "CLIENT_INTRODUCTION";
const PEER_STARTED_TYPING = "PEER_STARTED_TYPING";
const PEER_STOPPED_TYPING = "PEER_STOPPED_TYPING";
const SEND_MESSAGE = "SEND_MESSAGE";
const NEGATIVE_KEYWORD_EXCHANGE = "NEGATIVE_KEYWORD_EXCHANGE";
const END_CURRENT_SESSION = "END_CURRENT_SESSION";
const CLIENT_INTRODUCTION_PAIR_NOT_FOUND = "CLIENT_INTRODUCTION_PAIR_NOT_FOUND";
  
//initiate dotenv
dotenv.config();

//initialise GoogleAnalytcis
const analytics = analyticsLib({
	app: 'Blablah-server-analytics',
	plugins: [
	  googleAnalytics({
		trackingId: process.env.UNIVERSAL_GA_TRACK_ID
	  })
	]
})

let trackingObject = {}

database.connect(process.env.DB_CONNECT, { useNewUrlParser: true, useUnifiedTopology: true }, () => console.log("connected to db..."));
database.connection.on("connected", function () {
	console.log("Mongoose default connection is open to ", process.env.DB_CONNECT);
});

database.connection.on("error", function (err) {
	console.log("Mongoose default connection has occured " + err + " error");
});

database.connection.on("disconnected", function () {
	console.log("Mongoose default connection is disconnected");
});

process.on("SIGINT", function () {
	database.connection.close(function () {
		console.log("Mongoose default connection is disconnected due to application termination");
		process.exit(0);
	});
});

const expressServer = express();
const httpServer = http.createServer(expressServer);
const io = new Server(httpServer, {
	path: "/live",
	cors: {
		origin: ["www.blablah.app", "https://www.blablah.app", "https://blablah.app", "*"],
		methods: ["GET", "POST"],
		credentials: true,
	},
	maxHttpBufferSize: 10e6,
	transports: ["websocket", "polling", "flashsocket"],
});

//Middlewares body parser
expressServer.use(express.json({ limit: "10mb" }));
// need cookieParser middleware before we can do anything with cookies
expressServer.use(cookieParser());
// Client ip address finding middleware
expressServer.use(expressip().getIpInfoMiddleware);
expressServer.use(cors());

//route middlewares
expressServer.use("/api/chat/enablement", LiveChatRoutes);
expressServer.use("/api/admin/", AuthRoutes);
expressServer.use("/api/chat/identity", IdentityRoutes);
expressServer.use("/api/campaigns", AdCampaignRoutes)

// api.[Domain]/api/is/alive
expressServer.post("/api/is/alive", logRequests, async (request, response) => {
	const { body } = request;
	// create and assign token
	const token = jwt.sign({}, process.env.JWT_TOEKN_SECRET, { expiresIn: process.env.JWT_DEFAULT_EXPIRY });
	response.status(200).send({ status: 200, message: "Server is up and running, status is healthy", ipInfo: request.ipInfo, token });

	// try{
	// 	let resp = await serverRequest(`https://api.freegeoip.app/json/${request.ipInfo.ip}?apikey=${process.env.FREE_GEO_IP_API_KEY}`)
	// 	response.status(200).send({ status: 200, message: "Server is up and running, status is healthy", ipInfo: {...request.ipInfo, ...resp}, token });
	// }catch(err){
	// 	console.log(err)
	// 	response.status(200).send({ status: 200, message: "Server is up and running, status is healthy", ipInfo: request.ipInfo, token });
	
	// }
});


// api.[Domain]/api/is/alive
expressServer.get("/api/platform/stats", logRequests, async (request, response) => {
	response.status(200).send({ status: 200, message: "Stats sent successfully", data: trackingObject });
});


// Socket.io configuration
io.use(function (socket, next) {
	if (socket.handshake.query && socket.handshake.query.token) {
		jwt.verify(socket.handshake.query.token, process.env.JWT_TOEKN_SECRET, function (err, decoded) {
			if (err) return next(new Error("Authentication error"));
			socket.decoded = decoded;
			next();
		});
	} else {
		next(new Error("Authentication error"));
	}
}).on("connection", (socket) => {
	socket.on("error", (err) => console.log(err));
	socket.on(CLIENT_INTRODUCTION, async (data) => {
		redis.set(data.mySocketId, data);
		redis.keys("*").then(async (result) => {
			// check mutual `interests`, and interested `Gender`
			try {
				for (const userId of result) {
					let user = await redis.get(userId);
					if (
						!user.data.peerFound &&
						user.data.searchingPeer &&
						user.data.peerSocketId === "" &&
						user.mySocketId !== data.mySocketId &&
						user.data.interests.length > 0 &&
						data.data.interests.length > 0 &&
						user.data.myGender.length > 0 &&
						data.data.genderInterest.length > 0
					) {
						let intersectionInterests = user.data.interests.filter((interest) => data.data.interests.includes(interest));

						if (intersectionInterests.length > 0 && user.data.myGender === data.data.genderInterest) {
							// to calling socket id
							data.data.peerFound = true;
							data.data.peerSocketId = user.mySocketId;
							data.data.searchingPeer = false;

							// to waiting socket id
							user.data.peerFound = true;
							user.data.peerSocketId = data.mySocketId;
							user.data.searchingPeer = false;

							// intersectedInterests
							user.data.intersectedInterests = [...intersectionInterests];
							data.data.intersectedInterests = [...intersectionInterests];

							// gender interests
							user.data.genderInterestFound = true;
							data.data.genderInterestFound = true;

							// save updated values to cache
							redis.set([user.mySocketId, data.mySocketId], [user, data]).then(() => {
								// emit to both users
								socket.emit(CLIENT_INTRODUCTION, user);
								socket.to(user.mySocketId).emit(CLIENT_INTRODUCTION, data);
							});
							console.log("HITTED IN ALL MATCHES");
							return;
						}
					}
				}

				// Check for gender matching
				for (const userId of result) {
					let user = await redis.get(userId);
					if (
						!user.data.peerFound &&
						user.data.searchingPeer &&
						user.data.peerSocketId === "" &&
						user.mySocketId !== data.mySocketId &&
						user.data.myGender === data.data.genderInterest
					) {
						// to calling socket id
						data.data.peerFound = true;
						data.data.peerSocketId = user.mySocketId;
						data.data.searchingPeer = false;

						// to waiting socket id
						user.data.peerFound = true;
						user.data.peerSocketId = data.mySocketId;
						user.data.searchingPeer = false;

						// gender interests
						user.data.genderInterestFound = true;
						data.data.genderInterestFound = true;

						// save updated values to cache
						redis.set([user.mySocketId, data.mySocketId], [user, data]).then(() => {
							// emit to both users
							socket.emit(CLIENT_INTRODUCTION, user);
							socket.to(user.mySocketId).emit(CLIENT_INTRODUCTION, data);
						});
						console.log("HITTED IN GENDER MATCHES");
						return;
					}
				}

				// Check for mutual common interests
				for (const userId of result) {
					let user = await redis.get(userId);
					if (
						!user.data.peerFound &&
						user.data.searchingPeer &&
						user.data.peerSocketId === "" &&
						user.mySocketId !== data.mySocketId &&
						user.data.interests.length > 0 &&
						data.data.interests.length > 0
					) {
						let intersectionInterests = user.data.interests.filter((interest) => data.data.interests.includes(interest));

						if (intersectionInterests.length > 0) {
							// to calling socket id
							data.data.peerFound = true;
							data.data.peerSocketId = user.mySocketId;
							data.data.searchingPeer = false;

							// to waiting socket id
							user.data.peerFound = true;
							user.data.peerSocketId = data.mySocketId;
							user.data.searchingPeer = false;

							// intersectedInterests
							user.data.intersectedInterests = [...intersectionInterests];
							data.data.intersectedInterests = [...intersectionInterests];

							// save updated values to cache
							redis.set([user.mySocketId, data.mySocketId], [user, data]).then(() => {
								// emit to both users
								socket.emit(CLIENT_INTRODUCTION, user);
								socket.to(user.mySocketId).emit(CLIENT_INTRODUCTION, data);
							});
							console.log("HITTED IN INTERESTS MATCHES");
							return;
						}
					}
				}

				// Connect with anyone if connectWithAnyone flag is enabled
				for (const userId of result) {
					let user = await redis.get(userId);
					if (data.data.connectWithAnyone && user.data.connectWithAnyone && !user.data.peerFound && user.data.searchingPeer && user.data.peerSocketId === "" && user.mySocketId !== data.mySocketId) {
						// to calling socket id
						data.data.peerFound = true;
						data.data.peerSocketId = user.mySocketId;
						data.data.searchingPeer = false;

						// to waiting socket id
						user.data.peerFound = true;
						user.data.peerSocketId = data.mySocketId;
						user.data.searchingPeer = false;

						// save updated values to cache
						redis.set([user.mySocketId, data.mySocketId], [user, data]).then(() => {
							// emit to both users
							socket.emit(CLIENT_INTRODUCTION, user);
							socket.to(user.mySocketId).emit(CLIENT_INTRODUCTION, data);
						});
						console.log("HITTED IN NO MATCHES");
						return;
					}
				}
			} catch (err) {
				console.log("ERR :: ", err);
			}

			console.log("CLIENT_INTRODUCTION_PAIR_NOT_FOUND");
			socket.emit(CLIENT_INTRODUCTION_PAIR_NOT_FOUND);
		});
	});

	socket.on(PEER_STARTED_TYPING, (data) => {
		//console.log("PEER_STARTED_TYPING", data);
		socket.to(data.data.peerSocketId).emit(PEER_STARTED_TYPING, { typing: data.data.typing });
	});

	socket.on(PEER_STOPPED_TYPING, (data) => {
		socket.to(data.data.peerSocketId).emit(PEER_STOPPED_TYPING, { typing: data.data.typing });
	});

	socket.on(SEND_MESSAGE, (data) => {
		data.data.chatData.type = "received";
		data.data.chatData.newlyAdded = true;
		data.data.chatData.msg = data.data.chatData.isImage ? data.data.chatData.msg.toString("base64") : data.data.chatData.msg;
		console.log("SEND_MESSAGE length in mb", Buffer.byteLength(JSON.stringify(data)) / 1e6);
		socket.to(data.data.peerSocketId).emit(SEND_MESSAGE, { chatData: data.data.chatData });
	});

	socket.on(NEGATIVE_KEYWORD_EXCHANGE, (data) => {
		socket.to(data.data.peerSocketId).emit(NEGATIVE_KEYWORD_EXCHANGE, { data });
	});

	socket.on(END_CURRENT_SESSION, (data) => {
		let tempSocketId = data.data.peerSocketId;
		redis.get([tempSocketId, data.socketId]).then(async (users) => {
			let finalUsersArr = [];
			for (let user of users) {
				user.data.peerFound = false;
				user.data.peerSocketId = "";
				user.data.searchingPeer = false;
				finalUsersArr.push(user);
			}
			redis.set([tempSocketId, data.socketId], finalUsersArr).then((result) => {
				// now emit event to end the session
				socket.emit(END_CURRENT_SESSION, { data: finalUsersArr[1] });
				socket.to(tempSocketId).emit(END_CURRENT_SESSION, { data: finalUsersArr[0]  });
			});
		});
	});

	socket.on("disconnecting",  (reason) => {
		redis.get(socket.id).then(user => {
			if (user){
				socket.to(user.data.peerSocketId).emit(END_CURRENT_SESSION, { data: user });
				redis.del(socket.id).then(() => console.log("disconnected and deleted from redis cache :: ", socket.id)).catch(err => {
					console.log("Error deleting - ", socket.id);
				});
			}
		}).catch(err => {
			console.log(err);
		})
	});
});

let interval = setInterval(async () => {
	console.log('PER MINUTE ANALYTICS'.green);

	let usersPairedCount = 0, usersNotPairedCount = 0, maleCount = 0, femaleCount = 0, anyCount = 0, resultArr = [];
	resultArr = await redis.keys("*")

	let users = await redis.get(resultArr)

	// Total users count waiting to be paired
	// Total users count that are paired already
	// Total users count who are male
	// Total users count who are female
	// Total users count who are any
	// Total user count
	// interest wise users count

	let interestsTracking = {}
	users.forEach(user => {
		if (user.data.peerFound) usersPairedCount ++
		else usersNotPairedCount ++

		if (user.data.myGender === "male") maleCount ++
		if (user.data.myGender === "any") anyCount ++
		if (user.data.myGender === "female") femaleCount ++

		if (user.data.interests.length > 0){
			user.data.interests.forEach(interest => {
				if (interest in interestsTracking){
					interestsTracking[interest] = interestsTracking[interest] + 1
				} else {
					interestsTracking[interest] = 1
				}
			})
		}
	})
	trackingObject["userCount"] = resultArr.length
	trackingObject["pairedCount"] = usersPairedCount
	trackingObject["notPairedCount"] = usersNotPairedCount
	trackingObject["activeSessionsCount"] = usersPairedCount / 2
	trackingObject["maleCount"] = maleCount
	trackingObject["femaleCount"] = femaleCount
	trackingObject["anyCount"] = anyCount
	trackingObject["interests"] = interestsTracking


	console.table(trackingObject.interests)
	delete trackingObject.interests
	console.table(trackingObject)
	// analytics.track('RedisUserSessions', {
	// 	category: 'SessionTracking',
	// 	label: 'Fall Campaign',
	// 	value: 42
	// })
}, process.env.REALTIME_TRACKING_TIMEOUT);


httpServer.on("close", function () {
	redis.flushall().then(() => console.log("Flushed all redis cache"));
	//task.destroy();
	clearInterval(interval)
});

process.on("SIGINT", function () {
	httpServer.close();
	//task.destroy();
	clearInterval(interval)
});

httpServer.listen(8000, (err) => {
	if (err) {
		console.log("Server ERR :: ", err);
		return;
	}
	console.log("Server up and running on 8000");
	redis.flushall().then(() => console.log("Flushed all redis cache"));
});