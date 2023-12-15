const Product = require("../models/Product");

const ProductOps = require("../data/ProductOps");
// instantiate the class so we can use its methods
const _productOps = new ProductOps();

const RequestService = require("../services/RequestService");

exports.Index = async function (request, response) {
  let reqInfo = RequestService.reqHelper(request);
  if (reqInfo.authenticated) {
    console.log("Loading products from controller");
    let searchQuery = request.query.search; // Retrieve the search query from the request parameters
    let filter = {};

    if (searchQuery) {
      console.log("!!!!!!!!!!SEARCH QUERY!!!!!!!!!!!!!");
      // If there's a search query, create a regex to filter the products by name
      filter.name = { $regex: searchQuery, $options: "i" };
    }

    try {
      let products = await _productOps.getAllProducts(filter); // Pass the filter to your product operations
      response.render("products", {
        title: "Mongo Crud - Products",
        products: products,
        reqInfo: reqInfo,
        searchQuery: searchQuery, // Pass the search query back to the view for potential use
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      response.redirect("/products");
    }
  } else {
    response.redirect(
      "/user/login?errorMessage=You must be logged in to view this page."
    );
  }
};

exports.Detail = async function (request, response) {
  let reqInfo = RequestService.reqHelper(request);
  if (reqInfo.authenticated) {
    const productId = request.params.id;
    console.log(`loading single product by id ${productId}`);
    let product = await _productOps.getProductById(productId);
    let products = await _productOps.getAllProducts();
    if (product) {
      response.render("product", {
        title: "Mongo Crud - " + product.name,
        products: products,
        productId: request.params.id,
        layout: "./layouts/products-sidebar",
        reqInfo: reqInfo,
      });
    } else {
      response.render("products", {
        title: "Mongo Crud - Products",
        products: [],
        reqInfo: reqInfo,
      });
    }
  } else {
    response.redirect(
      "/user/login?errorMessage=You must be logged in to view this page."
    );
  }
};

// Handle product form GET request
exports.Create = async function (request, response) {
  let reqInfo = RequestService.reqHelper(request, ["Admin"]);
  if (reqInfo.rolePermitted) {
    console.log("!!!!!!!!!!RENDER THE PRODUCT CREATE VIEW!!!!!!!!!");
    response.render("product-create", {
      title: "Create Product",
      errorMessage: "",
      // product_id: null,
      product: {},
      reqInfo: reqInfo,
    });
  } else {
    response.redirect(
      "/user/login?errorMessage=You must be an admin to access this area."
    );
  }
};

// Handle product form GET request
exports.CreateProduct = async function (request, response) {
  // instantiate a new product Object populated with form data
  let reqInfo = RequestService.reqHelper(request, ["Admin"]);
  if (reqInfo.rolePermitted) {
    let tempProductObj = new Product({
      name: request.body.name,
      code: request.body.code,
      unitCost: request.body.unitCost,
    });

    // Use your _productOps module to create the product
    let responseObj = await _productOps.createProduct(tempProductObj);
    console.log("!!!!!!!CREATED NEW PRODUCT!!!!!!!!!!");

    // if no errors, save was successful
    if (responseObj.errorMsg === "") {
      let products = await _productOps.getAllProducts();
      console.log(responseObj.obj);
      response.render("products", {
        title: "Mongo Crud - " + responseObj.obj.name,
        products: products,
        productId: responseObj.obj._id.valueOf(),
        reqInfo: reqInfo,
      });
    }
    // There are errors. Show the form again with an error message.
    else {
      console.log("An error occured. Product not created.");
      response.render("product-create", {
        title: "Create Product",
        product: tempProductObj, // send back the data entered by the user
        errorMessage: responseObj.errorMsg,
        reqInfo: reqInfo,
      });
    }
  } else {
    response.redirect(
      "/user/login?errorMessage=You must be an admin to access this area."
    );
  }
};

// Handle delete product GET request
exports.DeleteProductById = async function (request, response) {
  let reqInfo = RequestService.reqHelper(request, ["Admin"]);
  if (reqInfo.rolePermitted) {
    const productId = request.params.id;
    console.log(`deleting single product by id ${productId}`);
    let deletedProduct = await _productOps.deleteProductById(productId);
    let products = await _productOps.getAllProducts();
  
    if (deletedProduct) {
      response.render("products", {
        title: "Mongo Crud - products",
        products: products,
        reqInfo: reqInfo
      });
    } else {
      response.render("products", {
        title: "Mongo Crud - products",
        products: products,
        errorMessage: "Error.  Unable to Delete",
        reqInfo: reqInfo
      });
    }
  }  else {
    response.redirect(
      "/user/login?errorMessage=You must be an admin to access this area."
    );
  }
};

// Handle edit product form GET request
exports.Edit = async function (request, response) {
  let reqInfo = RequestService.reqHelper(request, ["Admin"]);
  if (reqInfo.rolePermitted) {
    const productId = request.params.id;
    let productObj = await _productOps.getProductById(productId);
    response.render("product-form", {
      title: "Edit Product",
      errorMessage: "",
      product_id: productId,
      product: productObj,
      reqInfo: reqInfo
    });
  } else {
    response.redirect(
      "/user/login?errorMessage=You must be an admin to access this area."
    );
  }
};

// Handle product edit form submission
exports.EditProduct = async function (request, response) {
  let reqInfo = RequestService.reqHelper(request, ["Admin"]);
  if (reqInfo.rolePermitted) {
    const productId = request.body.product_id;
    const productName = request.body.name;
    const productCode = request.body.code;
    const productCost = request.body.unitCost;
  
    // Send these to productOps to update and save the document
    let responseObj = await _productOps.updateProductById(
      productId,
      productName,
      productCode,
      productCost
    );
  
    // If no errors, save was successful
    if (responseObj.errorMsg == "") {
      // Redirect to the product details page or the list, as per your flow
      response.redirect(`/products/${responseObj.obj._id.valueOf()}`);
    }
    // There are errors. Show form again with an error message.
    else {
      console.log("An error occurred. Product not edited.");
      // Retrieve the existing product data for the form
      const product = await _productOps.getProductById(productId);
      response.render("product-form", {
        title: "Edit Product",
        product: product,
        productId: productId,
        errorMessage: responseObj.errorMsg,
      });
    }
  } else {
    response.redirect(
      "/user/login?errorMessage=You must be an admin to access this area."
    );
  }
};
