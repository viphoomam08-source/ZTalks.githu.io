

const express=  require('express');
const router = express.Router();
 const {GetAccount} = require('../controller/friend.controller');


 router.get('/friend',GetAccount);


 module.exports= router;