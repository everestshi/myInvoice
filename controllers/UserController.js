const User = require("../models/User");
const passport = require("passport");
const RequestService = require("../services/RequestService");

const UserData = require("../data/UserData");
const _userData = new UserData();

// Displays registration form.
exports.Register = async function (req, res) {
  let reqInfo = RequestService.reqHelper(req);
  res.render("user/register", { errorMessage: "", user: {}, reqInfo: reqInfo });
};

// Handles 'POST' with registration form submission.
exports.RegisterUser = async function (req, res) {
  const password = req.body.password;
  const passwordConfirm = req.body.passwordConfirm;
  
  if (password === passwordConfirm) {
    // Create a new user object without the password.
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      username: req.body.username,
    });
    
    // Use passport to register the user.
    User.register(newUser, req.body.password, async function (err, account) {
      if (err) {
        // Handle registration errors.
        let reqInfo = RequestService.reqHelper(req);
        return res.render("user/register", {
          user: newUser,
          errorMessage: err,
          reqInfo: reqInfo,
        });
      }

      // Check if the currently logged-in user is an admin.
      const isAdmin = req.user && req.user.roles.includes("Admin");

      // If the user is an admin, redirect to the user detail page.
      if (isAdmin) {
        return res.redirect(`/user/users/${account._id}`);
      }
      
      // For other users, redirect to the home page.
      res.redirect("/");
    });
  } else {
    // Handle password mismatch error.
    let reqInfo = RequestService.reqHelper(req);
    res.render("user/register", {
      user: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        username: req.body.username,
      },
      errorMessage: "Passwords do not match.",
      reqInfo: reqInfo,
    });
  }
};


// Show login form.
exports.Login = async function (req, res) {
  let reqInfo = RequestService.reqHelper(req);
  let errorMessage = req.query.errorMessage;
  res.render("user/login", {
    user: {},
    errorMessage: errorMessage,
    reqInfo: reqInfo,
  });
};
// Receive login information, authenticate, and redirect depending on pass or fail.
exports.LoginUser = async (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/user/profile",
    failureRedirect: "/user/login?errorMessage=Invalid login.",
  })(req, res, next);
};

// Log user out and direct them to the login screen.
exports.Logout = (req, res) => {
  // Use Passports logout function
  req.logout((err) => {
    if (err) {
      console.log("logout error");
      return next(err);
    } else {
      // logged out. Update the reqInfo and redirect to the login page
      let reqInfo = RequestService.reqHelper(req);
      res.render("user/login", {
        user: {},
        isLoggedIn: false,
        errorMessage: "",
        reqInfo: reqInfo,
      });
    }
  });
};

exports.Profile = async function (req, res) {
  let reqInfo = RequestService.reqHelper(req);
  if (reqInfo.authenticated) {
    let roles = await _userData.getRolesByUsername(reqInfo.username);
    let sessionData = req.session;
    sessionData.roles = roles;
    reqInfo.roles = roles;
    let userInfo = await _userData.getUserByUsername(reqInfo.username);
    return res.render("user/profile", {
      reqInfo: reqInfo,
      userInfo: userInfo,
    });
  } else {
    res.redirect(
      "/user/login?errorMessage=You must be logged in to view this page."
    );
  }
};


exports.Index = async function (request, response) {
  let reqInfo = RequestService.reqHelper(request, ["Admin", "Manager"]);
  if (reqInfo.rolePermitted) {
    console.log("Loading users from controller");
    let searchQuery = request.query.search; // Retrieve search query from the request parameters
    let filter = {};
  
    if (searchQuery) {
      // If there's a search query, create a regex to filter the clients by name
      filter.name = { $regex: searchQuery, $options: 'i' };
    }
  
    try {
      let users = await _userData.getAllUsers(filter); // Pass the filter to your client operations
      response.render("user/users", {
        title: "Users",
        users: users,
        searchQuery: searchQuery, // Pass the search query back to the view for potential use
        reqInfo: reqInfo
      });
    } catch (error) {
      console.error("Error fetching clients:", error);
      response.redirect("/user");
    }
  } else {
    response.redirect(
      "/user/login?errorMessage=You must be an admin to access this area."
    );
  }
};

exports.Detail = async function (request, response) {
  let reqInfo = RequestService.reqHelper(request, ["Admin", "Manager"]);
  if (reqInfo.rolePermitted) {
    const userId = request.params.id;
    console.log(`loading single client by id ${userId}`);
    let user = await _userData.getUserById(userId);
    let users = await _userData.getAllUsers();
    if (user) {
      response.render("user/user", {
        title: "Mongo Crud - " + user.username,
        users: users,
        userId: request.params.id,
        layout: "./layouts/users-sidebar",
        reqInfo: reqInfo
      });
    } else {
      response.render("user/users", {
        title: "Mongo Crud - User",
        users: [],
        reqInfo: reqInfo
      });
    }
  } else {
    response.redirect(
      "/user/login?errorMessage=You must be an admin to access this area."
    );
  }
};


// Handle delete product GET request
exports.DeleteUserById = async function (request, response) {
  let reqInfo = RequestService.reqHelper(request, ["Admin"]);
  if (reqInfo.rolePermitted) {
    const userId = request.params.id;
    console.log(`deleting single user by id ${userId}`);
    let deletedUser = await _userData.deleteUserById(userId);
    let users = await _userData.getAllUsers();
  
    if (deletedUser) {
      response.render("user/users", {
        title: "Mongo Crud - Users",
        users: users,
        reqInfo: reqInfo
      });
    } else {
      response.render("user/users", {
        title: "Mongo Crud - Users",
        users: users,
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

// Handle edit user form GET request
exports.Edit = async function (request, response) {
  let reqInfo = RequestService.reqHelper(request);
  if (reqInfo.authenticated) {
    const userId = request.params.id;
    const returnUrl = request.query.returnUrl; // Set default returnUrl
    console.log(returnUrl)

    let userObj = await _userData.getUserById(userId);
    response.render("user/profile-form", {
      title: "Edit User",
      errorMessage: "",
      user: userObj,
      reqInfo: reqInfo,
      returnUrl: returnUrl, // Pass the returnUrl to the template
    });
  } else {
    response.redirect(
      "/user/login?errorMessage=You must be logged in to view this page."
    );
  }
};

// Handle user edit form submission
exports.EditUser = async function (request, response) {
  let reqInfo = RequestService.reqHelper(request);
  if (reqInfo.authenticated) {
    const userId = request.params.id; // Assuming user ID is passed in the request params
    const { username, email, firstName, lastName, userRoles } = request.body; // Fetch updated fields from the request body
    const returnUrl = request.body.returnUrl || "/"; // Get the returnUrl query parameter or set a default value

    console.log(returnUrl)
    try {
      // Find the user by ID
      const user = await User.findById(userId);
      const isAdmin = reqInfo.roles.includes("Admin");
      const isManager = reqInfo.roles.includes("Manager");

      if (user) {
        // Update user fields
        user.username = username || user.username;
        user.email = email || user.email;
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;

        if (isAdmin) {
          if (userRoles === "") {
            user.roles = []; // Set roles to an empty array if userRoles is empty
          } else {
            user.roles = userRoles || user.roles;
          }
        }

        // Save the updated user data
        await user.save();

        // Redirect based on the provided returnUrl
        response.redirect(returnUrl);
      } else {
        response.render("error", { error: "User not found" }); // Handle case where user is not found
      }
    } catch (error) {
      console.error("Error updating user:", error);
      response.render("error", { error: error }); // Handle error scenario
    }
  } else {
    response.redirect("/user/login?errorMessage=You must be logged in to view this page.");
  }
};


