
const express = require('express');
const router = express.Router();
const {AuthenticateUser} = require('../controller/Users.controller')
const {GetTrailer} = require('../controller/Trailer.controller');
router.get('/trailer', AuthenticateUser, (req,res)=>{
    const currentuser =req.session.user;
    res.render('trailer', { user: currentuser });
});


module.exports = router;