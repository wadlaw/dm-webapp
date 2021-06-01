require('dotenv').config();

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const path = require('path');

const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');

const { initialisePassport, saveUser } = require('./passport-config');
// initialisePassport(
//     passport,
//     email => users.find(user => user.email === email),
//     id => users.find(user => user.id === id)
// );
initialisePassport(passport);
app.set('views', path.join(__dirname, './views'));
app.set('view-engine', 'ejs');
app.use(express.static(path.join(__dirname,'public')))
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));


app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.Username });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs');
});

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
});
app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await saveUser(req.body.username, req.body.email, hashedPassword);
        // users.push({
        //     id: Date.now().toString(),
        //     name: req.body.name,
        //     email: req.body.email,
        //     password: hashedPassword
        // });
        res.redirect('/login');
    } catch(e) {
        res.redirect('/register');
    }
    
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.delete('/logout', checkAuthenticated, (req, res) => {
    req.logout();
    res.redirect('/login');
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }

    return next();
}

exports.app = app;
// app.listen(5000);