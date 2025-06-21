const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const User = require('./models/User');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/auth_demo', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Middlewares
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));


app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
  secret: 'secret-key', // Change this for production!
  resave: false,
  saveUninitialized: false
}));

// Routes will go here
// Show register page
app.get('/register', (req, res) => {
  res.render('register');
});

// Handle register form
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await User.create({ username, password: hashedPassword });
    res.redirect('/login');
  } catch (err) {
    res.send('Username already exists. Try again.');
  }
});

// Show login page
app.get('/login', (req, res) => {
  res.render('login');
});

// Handle login form
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user) {
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.userId = user._id;
      req.session.username = user.username;
      return res.redirect('/dashboard');
    } else {
      return res.send('Invalid password');
    }
  } else {
    return res.send('User not found');
  }
});

// Dashboard - only if logged in
app.get('/dashboard', (req, res) => {
  if (req.session.userId) {
    res.render('dashboard', { username: req.session.username });
  } else {
    res.redirect('/login');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/register');
});

module.exports = app;
module.exports.handler = serverless(app);
