const User = require("../models/User");
class UserData {
  async getUserById(id) {
    console.log(`getting user by id ${id}`);
    let user = await User.findById(id);
    return user;
  }

  async getUserByEmail(email) {
    let user = await User.findOne({ email: email });
    if (user) {
      const response = { obj: user, errorMessage: "" };
      return response;
    } else {
      return null;
    }
  }

  async getUserByUsername(username) {
    let user = await User.findOne(
      { username: username },
      { _id: 1, username: 1, email: 1, firstName: 1, lastName: 1 }
    );
    if (user) {
      const response = { user: user, errorMessage: "" };
      return response;
    } else {
      return null;
    }
  }

  async getRolesByUsername(username) {
    let user = await User.findOne({ username: username }, { _id: 0, roles: 1 });
    if (user.roles) {
      return user.roles;
    } else {
      return [];
    }
  }

  async updateUserById(id, username, email, firstName, lastName) {
    console.log(`updating user by id ${id}`);
    const user = await User.getUserById(id);
    console.log("original user: ", user);
    user.username = username;
    user.email = email;
    user.firstName = firstName;
    user.lastName = lastName;

    let result = await product.save();
    console.log("updated user: ", result);
    return {
      obj: result,
      errorMsg: "",
    };
  }
}

module.exports = UserData;
