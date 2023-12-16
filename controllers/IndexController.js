const RequestService = require("../services/RequestService");

exports.Index = async function (req, res) {
  let reqInfo = RequestService.reqHelper(req);
  let errorMessage = req.query.errorMessage;
  return res.render("index", { 
    reqInfo: reqInfo,
    errorMessage: errorMessage 
  });
};
