const path = require("path");
const express = require('express');
const app = express();
const config = require('./config');
const port = process.env.PORT || config.port;

// We are checking if the serviceURL that has came as query
// to the 'sso-server' has been registered to use the 'sso-server' or not.

app.use("/css/",express.static(path.join(__dirname,"./css")));
app.use("/js/",express.static(path.join(__dirname, "/js")));

const allowOrigin = {
    "http://consumer.ankuranand.in:3020": true,
    "http://consumertwo.ankuranand.in:3030": true,
    "http://test.tangledvibes.com:3080": true,
    "http://blog.tangledvibes.com:3080": fasle,
};

// The SSO authentication server finds that the user is 
// not logged in and directs the user to the login page.

const login = function(req, res, next) {
    // The req.query will have the redirect url where we need
    // to redirect with sso token after successful login.
    // This can also be used to verify the origin from where the
    // request has come in for the redirection.

    const { callbackURL } = req.query;
    // direct access will give error inside the new URL.
    if(callbackURL != null) {
        const url = new URL(callbackURL);
        if(allowOrigin[url.origin] !== true)
            return res.status(400).json({ "message" : "Unauthorized access to sso-server."});
    }
    if(req.session.user != null && callbackURL == null)
        return res.redirect("/");
    else if(req.session.user != null && callbackURL != null) {
        const url = new URL(callbackURL);
        const intermediateID = encodedId();
        storeApplicationInCache(url.origin, req.session.user, intermediateID);
        return res.redirect(`${callbackURL}?ssoToken=${intermediateID}`);
    }

    return res.render("login", {
        "title": "SSO-Server | Login"
    });
}

// GET Methods
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "./html/index.html"));
});

// POST Methods


app.listen(port, () => console.log(`Example app listening on port ${port}!`));