const express = require ('express');
const router = express.Router();
const  { GetHome,ProfilesShow,MiddlewarePolicy } = require ('../controller/home.controller');
const {AuthenticateUser} = require('../controller/Users.controller')
router.get('/home',AuthenticateUser,MiddlewarePolicy ,GetHome); 
// Put this in your routes file as well
router.post('/accept-policy', (req, res) => {
    if (req.session && req.session.user) {
        req.session.user.hasAcceptedPolicy = true; 
    }
    res.redirect('/home');
});   
module.exports = router;