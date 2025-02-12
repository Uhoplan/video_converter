const multer = require("multer");
const child_process = require("node:child_process");

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/");
	},
	filename: (req, file, cb) => {
		//const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, /*uniqueSuffix +*/ file.originalname);
	},
});

const upload = multer({
	storage: storage,
});

module.exports = upload;
