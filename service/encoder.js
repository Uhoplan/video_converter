const ffmpegStatic = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("node:fs");

ffmpeg.setFfmpegPath(ffmpegStatic);
let totalTime;
const startConver = (file, pathConverted, taskId, tasks) => {
	const task = tasks.get(taskId);
	return new Promise((resolve, reject) => {
		ffmpeg()
			.input(file)
			.output(pathConverted)
			.videoCodec("libx264")
			.audioCodec("aac")
			.format("mp4")
			.on("codecData", (data) => {
				totalTime = Number.parseInt(data.duration.replace(/:/g, ""));
			})
			.on("progress", (progress) => {
				const time = Number.parseInt(progress.timemark.replace(/:/g, ""));
				const percent = Math.round((time / totalTime) * 100);
				// Отправляем прогресс через WebSocket
				console.log(`Processing: ${progress.currentKbps} Kbps ${percent}%`);
				if (task?.wsClient) {
					task.wsClient.send(
						JSON.stringify({
							type: "progress",
							progress: percent < 0 ? 0 : percent,
						}),
					);
				}
			})
			.on("end", () => {
				resolve(
					tasks.set(taskId, {
						progress: 100,
						wsClient: task.wsClient,
						ready: true,
						downloadLink: pathConverted,
					}),
					task.wsClient.send(
						JSON.stringify({
							type: "downloadLink",
							path: `http://localhost:3000/${pathConverted}`,
							taskId,
						}),
					),
				);
				fs.unlinkSync(file);
				console.log(`Конвертация ${file} завершена.`);
			})
			.on("error", (err, stdout, stderr) => {
				console.log("An error occurred: " + err.message);
				console.log("ffmpeg output:\n" + stdout);
				console.log("ffmpeg stderr:\n" + stderr);
				reject(err);
			})
			.run();
	});
};
module.exports = startConver;
