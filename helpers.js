const bcrypt = require('bcryptjs');

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "bbb"
  }
};

const getUserByEmail = function(email, users) {
  //check if user's input email exists in users database
  for (let userId in users) {
    const user = users[userId];
    if (email === user.email) {
      return user;
    }
  }
  return false;
};

const authenticateUser = function(email, password, usersDb) {
  //check email
  const userFound = getUserByEmail(email, usersDb);
  // if email is found in database, make sure hashed password in users database is the same as the password input user typed.
  if (userFound && bcrypt.compareSync(password, userFound.password)) {
    return userFound;
  }
  return false;
};

const hashPwd = (password) => {
  // more convenient to put bcrypt into a function, just too many passwords need to be hashed.
  return bcrypt.hashSync(password, 10);
};

const generateRandomString = function() { //google from stackflow
  //I realized there's a DRIER way to do this, but this way I understand.
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const createUser = function(email, password, users) {
  //this is used when new user registered
  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email,
    password,
  };
  return userId;
};

const urlsForUser = (id) => {
  // filter out urls created by the login user, needs to run this function whenever user logging in.
  let result = {};
  for (let shortURL in urlDatabase) {
    if (id === urlDatabase[shortURL].userID) {
      result[shortURL] = urlDatabase[shortURL];
    }
  }
  return result;
};

module.exports = { getUserByEmail, authenticateUser, hashPwd, generateRandomString, createUser, urlsForUser, urlDatabase };