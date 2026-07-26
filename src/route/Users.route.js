const express= require('express');
const router = express.Router();
const database = require('../util/db');
const {GetProfile,registerUser,LoginUser,MiddlewarRegister} = require('../controller/Users.controller');

// Define your profile route on the router

router.get('/', GetProfile);
router.post('/register',MiddlewarRegister, registerUser);
router.get('/login', GetProfile);
router.post('/login', LoginUser);



module.exports = router;