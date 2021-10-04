let cookieSession = require('cookie-session');
const express = require("express");
const bodyParser = require("body-parser");
const { getUserByEmail, hashPwd, generateRandomString, createUser, authenticateUser, urlsForUser, urlDatabase } = require('./helpers');
const app = express();
const PORT = 8080;

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "a@a.com",
    password: hashPwd("123")
  },
  "bbb": {
    id: "bbb",
    email: "b@b.com",
    password: hashPwd("000")
  }
};

app.use(cookieSession({
  name: 'user_id',
  keys: ['a long long hard to crack key', 'a much longer key to crack']
}));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>Please login first.</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id; //read sessioned userId
  const user = users[userId];
  const templateVars = {
    urls: urlsForUser(userId), //filter out only urls belonged to user
    user
  };
  if (!userId) {
    return res.redirect('/login');
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const templateVars = { user };
  if (!user) {
    res.redirect('/login'); //to prevent non-user from creating urls.
  }
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = { //add new entry of shortURL
    longURL: req.body.newURL,
    userID: user['id']
  };
  res.redirect(`urls/${newShortURL}`); //show users their new shortURL page
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (!urlDatabase[req.params.shortURL]) { // prevent random guessing of other users' shortURL
    res.status(403).send('Error 403. Short Url page doesn not exist.');
    return;
  } if (urlDatabase[req.params.shortURL].userID !== userId) { //prevent users 'hacking' into other users' urls.
    res.status(403).send('Error 403. This shortURL does not belong to you.');
    return;
  }
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
  const userId = req.session.user_id;
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
  const userId = req.session.user_id;
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
  const templateVars = { user: null }; //no user at this point, not created yet.
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = hashPwd(req.body.password); //protecting user's password 
  // check if that user already exist in the users
  // if yes, send back error message
  const userFound = getUserByEmail(email, users);

  if (userFound) {
    res.status(403).send('Error 403. Sorry, that user already exists!');
    return;
  } else if (password === '') {
    res.status(403).send('Error 403. Please provide a password.');
    return;
  }

  // userFound is false => ok register the user
  const userId = createUser(email, password, users);
  // Log the user => ask the browser to set a cookie with the user id
  req.session.user_id = userId; //encryption starts
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
    req.session.user_id = userFound.id;
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});