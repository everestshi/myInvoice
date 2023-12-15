const Invoice = require("../models/Invoice");

const InvoiceOps = require("../data/InvoiceOps");
const mongoose = require("mongoose");

const Client = require("../models/Client");
const Product = require("../models/Product");
const RequestService = require("../services/RequestService");


// instantiate the class so we can use its methods
const _invoiceOps = new InvoiceOps();

exports.Index = async function (request, response) {
  let reqInfo = RequestService.reqHelper(request);
  if (reqInfo.authenticated){
    let searchQuery = request.query.search; // Retrieve search query from the request parameters
    let filter = {};
  
    if (!reqInfo.roles.includes("Admin") && !reqInfo.roles.includes("Manager")) {
      // If the user is not an admin or manager, filter invoices by the user's email
      filter["client.email"] = reqInfo.email; // Replace "client.email" with the actual field in your invoice schema
    } else if (searchQuery) {
      // If there's a search query, create a regex to filter the clients by name
      filter["client.name"] = { $regex: searchQuery, $options: "i" };
    }
  
    console.log(reqInfo)

    try {
      let invoices = await _invoiceOps.getAllInvoices(filter); // Pass the filter to your client operations
      response.render("invoices", {
        title: "Mongo Crud - Invoices",
        invoices: invoices,
        reqInfo: reqInfo,
        searchQuery: searchQuery, // Pass the search query back to the view for potential use
      });
    } catch (error) {
      console.error("Error fetching invoices:", error);
      response.redirect("/invoices");
    }
  } else {
    response.redirect(
      "/user/login?errorMessage=You must be logged in to view this page."
    );
  }
};



exports.Detail = async function (request, response) {
  const invoiceId = request.params.id;
  let reqInfo = RequestService.reqHelper(request);
  if (reqInfo.authenticated){
    console.log(`Loading single invoice by id ${invoiceId}`);
    try {
      let invoice = await _invoiceOps.getInvoiceById(invoiceId); // This should be the correct method name
      if (invoice) {
        console.log("Retrieved Invoice:", invoice);
  
        response.render("invoice", {
          title: "Mongo Crud - " + invoice.name,
          invoice: invoice, // Make sure this is the invoice, not invoices
          invoiceId: invoiceId,
          reqInfo: reqInfo
        });
      } else {
        response.render("invoices", {
          title: "Mongo Crud - Invoices",
          invoices: [],
          reqInfo: reqInfo
        });
      }
    } catch (error) {
      console.error(`Error fetching invoice by id ${invoiceId}:`, error);
      response.status(500).render("error", { error: error });
    }
  } else {
    response.redirect(
      "/user/login?errorMessage=You must be logged in to view this page."
    );
  }
};

exports.Create = async function (request, response) {
  let reqInfo = RequestService.reqHelper(request, ["Admin", "Manager"]);
  if (reqInfo.rolePermitted) {
  // Fetch clients and products to populate dropdowns in the form
  let clients = await Client.find({});
  let products = await Product.find({});
  console.log(clients);
  response.render("invoice-create", {
    title: "Create Invoice",
    clients: clients,
    products: products,
    invoice: {},
    errorMessage: "",
    reqInfo: reqInfo
  });
  } else {
    response.redirect(
      "/user/login?errorMessage=You must be a manager or admin to access this area."
    );
  }
};

exports.CreateInvoice = async function (request, response) {
  let reqInfo = RequestService.reqHelper(request, ["Admin", "Manager"]);
  if (reqInfo.rolePermitted) {
    console.log("CREATE INVOICE", request.body);
  

    try {
      // Attempt to create the invoice using your invoice operations class
      // Convert quantity strings to numbers
  
      let clientId = request.body.client;
      let client = await Client.findById(clientId);
      const productIds = Array.isArray(request.body.product)
        ? request.body.product
        : [request.body.product];
      const products = await Promise.all(
        productIds.map(async (productId) => {
          return await Product.findById(productId);
        })
      );
      const quantities = Array.isArray(request.body.quantity)
        ? request.body.quantity.map((qty) => Number(qty))
        : [Number(request.body.quantity)];
      let tempInvoiceObj = new Invoice({
        client: client,
        invoiceNumber: request.body.invoiceNumber,
        issueDate: request.body.issueDate,
        dueDate: request.body.dueDate,
        products: products,
        quantities: quantities,
      });
  
      let responseObj = await _invoiceOps.createInvoice(tempInvoiceObj);
  
      // If no errors, the save was successful, redirect to invoice details
      if (responseObj.errorMsg === "") {
        response.redirect(`/invoices/${responseObj.obj._id}`);
        console.log("Invoice Created Successfully");
      } else {
        // Fetch the clients and products again to pass them to the template
        const clients = await Client.find({});
        const products = await Product.find({});
  
        response.render("invoice-create", {
          title: "Create Invoice",
          clients: clients, // Pass the clients to the template
          products: products, // Pass the products to the template
          invoice: tempInvoiceObj, // Send back the data entered by the user
          errorMessage: responseObj.errorMsg,
          reqInfo: reqInfo
        });
        // There are errors. Show form again with an error message.
        console.log(
          "An error occurred. Invoice not created.",
          responseObj.errorMsg
        );
      }
    } catch (error) {
      // Handle any exceptions that occur during invoice creation
      console.error("Exception occurred in CreateInvoice.", error);
      response.render("invoice-create", {
        title: "Create Invoice",
        invoice: {}, // Reset form
        errorMessage: error.message || "An unexpected error occurred.",
        reqInfo: reqInfo
      });
    }
  } else {
    response.redirect(
      "/user/login?errorMessage=You must be a manager or admin to access this area."
    );
  }
};

// Handle delete client GET request
exports.DeleteInvoiceById = async function (request, response) {
  const invoiceId = request.params.id;
  let reqInfo = RequestService.reqHelper(request, ["Admin"]);
  if (reqInfo.rolePermitted) {
    console.log(`deleting single invoice by id ${invoiceId}`);
    let deletedInvoice = await _invoiceOps.deleteInvoiceById(invoiceId);
    let invoices = await _invoiceOps.getAllInvoices();
  
    if (deletedInvoice) {
      response.render("invoices", {
        title: "Mongo Crud - Invoices",
        invoices: invoices,
        reqInfo: reqInfo
      });
    } else {
      response.render("invoices", {
        title: "Mongo Crud - Invoices",
        invoices: invoices,
        errorMessage: "Error.  Unable to Delete",
        reqInfo: reqInfo
      });
    }
  } else {
    response.redirect(
      "/user/login?errorMessage=You must be an admin to access this area."
    );
  }
};

