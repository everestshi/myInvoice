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
  if (password == passwordConfirm) {
    // Creates user object with mongoose model.
    // Note that the password is not present.
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      username: req.body.username,
    });
    // Uses passport to register the user.
    // Pass in user object without password
    // and password as next parameter.
    User.register(
      new User(newUser),
      req.body.password,
      function (err, account) {
        // Show registration form with errors if fail.
        if (err) {
          let reqInfo = RequestService.reqHelper(req);
          return res.render("user/register", {
            user: newUser,
            errorMessage: err,
            reqInfo: reqInfo,
          });
        }
        // User registration was successful, so let's immediately authenticate and redirect to home page.
        passport.authenticate("local")(req, res, function () {
          res.redirect("/");
        });
      }
    );
  } else {
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


// Handle edit client form GET request
exports.Edit = async function (request, response) {
  let reqInfo = RequestService.reqHelper(request);
  if (reqInfo.authenticated) {
    const userId = request.params.id;
    let userObj = await _userData.getUserById(userId);
    response.render("user/profile-form", {
      title: "Edit User",
      errorMessage: "",
      user: userObj,
      reqInfo: reqInfo
    });
  } else {
    response.redirect(
      "/user/login?errorMessage=You must be logged in to view this page."
    );
  }
};

// Handle client edit form submission
exports.EditUser = async function (request, response) {
  const userId = request.params.id; // Assuming user ID is passed in the request params
  const { username, email, firstName, lastName } = request.body; // Fetch updated fields from the request body

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (user) {
      // Update user fields
      user.username = username || user.username;
      user.email = email || user.email;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;

      // Save the updated user data
      await user.save();

      // Handle successful update (e.g., redirect, send success message, etc.)
      response.redirect("/user/profile"); // Redirect to the user profile page after successful update
    } else {
      response.render("error", { error: "User not found" }); // Handle case where user is not found
    }
  } catch (error) {
    console.error("Error updating user:", error);
    response.render("error", { error: error }); // Handle error scenario
  }
};

