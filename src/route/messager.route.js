const express= require('express');
const router = express.Router();

const { GetMessager } = require('../controller/messager.controller');
router.get('/message',GetMessager);


module.exports=
    router;
