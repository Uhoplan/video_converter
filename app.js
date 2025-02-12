const express = require("express");
const cors = require("cors");
const router = require("./router/index.js");
const app = express();
const fs = require("node:fs");

const webHost = process.env.WEB_HOST;
const webPort = process.env.WEB_PORT;

app.use(cors());
app.use(express.json());
app.use("/converted", express.static("converted"));
app.use(express.urlencoded({ extended: true }));
app.use("/", router);

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("converted")) fs.mkdirSync("converted");

app.listen(webPort, () => {
	console.log(
		`Express WEB server [PROCESS_ID: ${process.pid}], started listening: http://${webHost}:${webPort}`,
	);
});
