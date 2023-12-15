const express = require("express");
const secureRouter = express.Router();
const SecureController = require("../controllers/SecureController");
secureRouter.get("/", SecureController.Index);
secureRouter.get("/admin", SecureController.Admin);
secureRouter.get("/manager", SecureController.Manager);
module.exports = secureRouter;
