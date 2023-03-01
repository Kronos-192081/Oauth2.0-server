const express = require('express');
const router = express.Router();
const OauthController = require('../controllers/oauthcontroller');
const OAuthServer = require('express-oauth-server');
const Sequelize = require('sequelize');
const OAuthTokensModel = require('../models').OAuthTokens;
const op = Sequelize.Op;
router.oauth = new OAuthServer({
    model: OauthController,
    accessTokenLifetime: 4*60*60 /* 4 hours of access time */
});

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.post('/oauth/token', router.oauth.token());

router.post('/oauth/set_client', function (req, res, next) {
    OauthController.setClient(req.body)
        .then((client) => res.json(client))
        .catch((error) => {
            return next(error);
        });
});

router.post('/oauth/signup', function (req, res, next) {
    OauthController.setUser(req.body)
        .then((user) => res.json(user))
        .catch((error) => {
            return next(error);
        });
});

router.get('/secret', router.oauth.authenticate(), function (req, res) {
    res.json("User exists");
});

router.get('/check', (req, res) => {
    const date = new Date();
    return OAuthTokensModel.findOne({where: {accessToken: req.headers.authorization.slice(7)}, accessTokenExpiresAt : {[op.gt]: date}})
        .then((tok) => {
            res.json({userid: tok.get().userId , userGrants: tok.get().userGrants});
        })
        .catch((e) => {
            OAuthTokensModel.findOne({where: {accessToken: req.body.tokens}})
            .then((tok) => {
                tok.destroy().then(()=>res.status(404).json({error: "Access token expired"}));
            })
            .catch((e) => {
                res.status(404).json({error: "Invalid Token"});
            })
        });
})
module.exports = router;
