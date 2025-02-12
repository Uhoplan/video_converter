const { Router } = require("express");
const router = new Router();
const upload = require("../service/multer.js");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const startConver = require("../service/encoder.js");
const WebSocket = require("ws");

function deleteFile(file) {
	fs.unlink(file, (err) => {
		if (err) {
			console.error(err.toString());
		} else {
			console.warn(file + " deleted");
		}
	});
}
// Хранилище активных задач конвертации
const tasks = new Map();

const wss = new WebSocket.Server({ port: process.env.WEB_SOCKET_PORT }); // WebSocket сервер на порту 8080

wss.on("connection", (ws) => {
	console.log("Connection");
	ws.on("message", (message) => {
		const { taskId } = JSON.parse(message);
		const task = tasks.get(taskId);
		if (task) {
			task.wsClient = ws; // Привязываем WebSocket к задаче
		}
	});
});

router.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "../index.html"));
});
router.get("/download/:filename", (req, res) => {
	const taskId = req.params.filename;
	if (!tasks.get(taskId).ready) {
		res.status(500).header().json({ error: "Convertation not ready yet!" });
	}
	const convertedFile = tasks.get(taskId).downloadLink;
	const stream = fs.createReadStream(convertedFile);
	stream.pipe(res).once("close", () => {
		stream.destroy(); // makesure stream closed, not close if download aborted.
		deleteFile(convertedFile);
	});
	tasks.delete(taskId);
});
router.post("/upload", upload.single("file"), async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: "Файл не загружен" });
	}
	const taskId = crypto.randomUUID();
	// Создаем задачу и сохраняем в хранилище
	tasks.set(taskId, { progress: 0, wsClient: null, ready: false });

	res.json({ taskId });
	const inputPath = req.file.path;
	const outputPath = path.join(
		"converted",
		`${path.parse(inputPath).name}_${taskId}.mp4`,
	);
	try {
		await startConver(inputPath, outputPath, taskId, tasks);
	} catch (err) {
		res.status(500).json({ error: err.message });
		tasks.delete(taskId);
	}
});
module.exports = router;
