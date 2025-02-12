const { Router } = require("express");
const MainRoute = require("./MainRoute.js");
const router = new Router();

router.use("/", MainRoute);

module.exports = router;
