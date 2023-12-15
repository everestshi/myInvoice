const express = require("express");
const userRouter = express.Router();
const UserController = require("../controllers/UserController");

// GET register page
userRouter.get("/register", UserController.Register);
// Handle register form submission
userRouter.post("/register", UserController.RegisterUser);

// GET login page
userRouter.get("/login", UserController.Login);
// Handle login form submission
userRouter.post("/login", UserController.LoginUser);

// GET logout
userRouter.get("/logout", UserController.Logout);

// GET profile page
userRouter.get("/profile", UserController.Profile);

// Show listing of all users
userRouter.get("/users", UserController.Index);

// Show Individual Product Details
userRouter.get("/users/:id", UserController.Detail);

// Show Create User Form
userRouter.get("/register", UserController.Register);
// Handle Create User Form Submission
userRouter.post("/register", UserController.RegisterUser);

// Delete an Individual Product
userRouter.get("/users/:id/delete", UserController.DeleteUserById);

// Show Edit User Form
userRouter.get("/edit/:id", UserController.Edit);
// Handle Edit User Form Submission
userRouter.post("/edit/:id", UserController.EditUser);

module.exports = userRouter;
