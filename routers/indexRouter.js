const express = require("express");
const indexRouter = express.Router();
const IndexController = require("../controllers/IndexController");

// GET home page
indexRouter.get("/", IndexController.Index);

// Export the router
module.exports = indexRouter;
