const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.use(cookieParser());
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

const users = {
  "Rambo": {
    id: "aaa",
    email: "a@a.com",
    password: "123"
  },
  "Bambie": {
    id: "bbb",
    email: "b@b.com",
    password: "123"
  }
};

const generateRandomString = function() { //google from stackflow
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const createUser = function(name, email, password, users) {
  const userId = generateRandomString();
  // adding to an object
  users[userId] = {
    id: userId,
    name,
    email,
    password,
  };
  return userId;
};

const findUserByEmail = function(email, users) {
  for (let userId in users) {
    const user = users[userId];
    if (email === user.email) {
      return user;
    }
  }
  return false;
};

const findUserByID = function(id, users) {
  for (let userId in users) {
    const user = users[userId];
    if (id === user.id) {
      return user;
    }
  }
  return false;
};

const authenticateUser = function(email, password, usersDb) {
  const userFound = findUserByEmail(email, usersDb);

  if (userFound && userFound.password === password) {
    return userFound;
  }

  return false;
};

const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>Please login first.</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  if (!user) {
    return res.render('loginFirst', templateVars);
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { user };
  if (user === undefined) {
    res.status(403).send('Error 403. You need to register/login first to create short URLs.');
    return;
  }
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body.newURL);  // Log the POST request body to the console
  const userId = req.cookies["user_id"];
  const user = users[userId];
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = {
    longURL: req.body.newURL,
    userID: user['id']
  }
  res.redirect(`urls/${newShortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]['longURL'], user};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]['longURL'];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  console.log(req.params.shortURL);
  const userId = req.cookies["user_id"];
  const user = users[userId];
  if (user === undefined) {
    res.status(403).send('Error 403. You need to login/register to perform editting.');
    return;
  }
  res.redirect("/urls");
});

app.get("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { shortURL, longURL, user };
  if (user === undefined) {
    res.status(403).send('Error 403. You need to login/register to perform editting.');
    return;
  }
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/submit", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL]['longURL'] = req.body.newURL;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const templateVars = { user: null };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  // we need to extract the info from the body of request => req.body
  console.log('req.body:', req.body);
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  // check if that user already exist in the users
  // if yes, send back error message
  const userFound = findUserByEmail(email, users);
  console.log('userFound:', userFound);

  if (userFound) {
    res.status(403).send('Error 403. Sorry, that user already exists!');
    return;
  } else if (password === '') {
    res.status(403).send('Error 403. Please provide a password.');
    return;
  }

  // userFound is false => ok register the user
  const userId = createUser(name, email, password, users);
  // Log the user => ask the browser to set a cookie with the user id
  res.cookie('user_id', userId);
  res.redirect('/urls');
});
  
app.get('/login', (req, res) => {
  const templateVars = { user: null };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const userFound = authenticateUser(email, password, users);
  if (userFound) {
    // setting the cookie
    res.cookie('user_id', userFound.id);
    res.redirect('/urls');
    return;
  } 
  // user is not authenticated => send error
  res.status(403).send('Error 403! Wrong credentials!');
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/u/:id', (req, res) => {
  console.log('req.body:', req.body);
  const id = req.body.id;
  // check if that user already exist in the users
  // if yes, send back error message
  const userFound = findUserByID(id, users);
  console.log('userFound:', userFound);

  if (!userFound) {
    res.status(403).send('Error 403. UserID not found!');
    return;
  } 

  res.cookie('user_id', userId);
  const templateVars = { user: userID };
  res.render('user_index', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});