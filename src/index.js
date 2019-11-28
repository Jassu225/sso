const path = require("path");
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const NedbStore = require('nedb-session-store')(session);
const cookieParser = require('cookie-parser');
const Datastore = require('nedb');
const md5 = require('md5');

const app = express();
const config = require('./config');
const port = process.env.PORT || config.port;
const sharedSecretKey = "3d8700d44aeeb29892a6a30c5ee78e08";
const usersDB = new Datastore( {
    filename: path.join(__dirname, "../data/usersStore.db"),
    autoload: true
});
const applicationDataStore = new Datastore( {
    filename: path.join(__dirname, "../data/applicationDataStore.db"),
    autoload: true
});


let sessionCookie = {
    cookie: {
        secure: false
    },
    secret: sharedSecretKey,
    resave: true,
    saveUninitialized: true,
    store: new NedbStore({
        filename: path.join(__dirname, "../data/sessionStore.db")
    })
}

// We are checking if the serviceURL that has came as query
// to the 'sso-server' has been registered to use the 'sso-server' or not.
const allowOrigin = {
    "http://app-tictactoe.herokuapp.com/": true,
    "https://app-tictactoe.herokuapp.com/": true,
    "dev": {
        "http://localhost:64445/": true
    }
};

function encodedId() {
    return new btoa(md5(Date().getTime()));
}

function storeApplicationInCache(url, user, intermediateID) {
    applicationDataStore.findOne({url, user}, function(err, doc) {
        if(doc != null) {
            doc.intermediateID = intermediateID;
            doc.save();
        } else {
            applicationDataStore.insert({
                url, user, intermediateID
            }, function(err, newDoc) {});
        }
    });
}

function storeAndRedirect(callbackURL, req, res) {
    const url = new URL(callbackURL);
    const intermediateID = encodedId();
    storeApplicationInCache(url.origin, req.session.user, intermediateID);
    return res.redirect(`${callbackURL}?ssoToken=${intermediateID}`);
}
// The SSO authentication server finds that the user is 
// not logged in and directs the user to the login page.

const login = function(req, res) {
    // The req.query will have the redirect url where we need
    // to redirect with sso token after successful login.
    // This can also be used to verify the origin from where the
    // request has come in for the redirection.

    const { callbackURL } = req.query;
    console.log('login');
    // direct access will give error inside the new URL.
    if(callbackURL != null) {
        const url = new URL(callbackURL);
        if(allowOrigin[url.origin] !== true || (process.env.ENVIRONMENT == "DEVELOPMENT" && allowOrigin.dev[isUserLoggedIn.origin] !== true))
            return res.status(400).json({ "message" : "Unauthorized access to sso-server."});
    }
    if(req.session.user != null && callbackURL == null)
        return res.redirect("/");
    if(req.session.user != null && callbackURL != null) {
        storeAndRedirect(callbackURL, req, res);
    }

    // res.sendFile(path.join(__dirname, "./html/login.html"));
    if(callbackURL != null)
        res.redirect(`/login?callbackURL=${callbackURL}`);
    else
        res.redirect('/login');
    // next();
}

app.use(cookieParser(sharedSecretKey));
app.use(session(sessionCookie));
app.use("/css/",express.static(path.join(__dirname,"./css")));
app.use("/js/",express.static(path.join(__dirname, "./js")));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
// app.use(login);

function isUserLoggedIn(req) {
    return req.session.user != null;
}

// GET Methods
app.get("/", (req, res) => {
    const { callbackURL } = req.query;
    if(isUserLoggedIn(req) && callbackURL == null)
        return res.sendFile(path.join(__dirname, "./html/index.html"));
    else
        login(req, res);
});

app.get("/login", (req, res) => {
    const { callbackURL } = req.query;
    return res.sendFile(path.join(__dirname, "./html/login.html"));
});

// POST Methods
app.post("/verifyCredentials", (req, res) => {
    let userName = req.body.userName;
    let password = req.body.password;

    usersDB.findOne({ name: userName, password }, function(err, doc) {
        let responseObject = {
            code: 200,
            message: "User exists"
        };
        if(err) { 
            console.error(err);
            responseObject.code = 500;
            responseObject.message = "Some error occurred";
        }
        else if(doc != null) {

        } else if (doc == null) {
            // verification failed
            responseObject.code = 403;
            responseObject.message = "Username/password is/are incorrect";
        }

        res.send(JSON.stringify(responseObject));
    });
});

// app.use(login);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));


// initialize
usersDB.insert( { name: 'admin', password: 'admin' }, function(err, newDoc){});