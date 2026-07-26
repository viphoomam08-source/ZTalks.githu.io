const express = require('express');
const router = express.Router();
// 1. 🛠️ Add GetAccount to the destructuring import here:
const { GetAccount, CreatPost, UpdatePost, DeletePost, upload,DetailInsert,uploadPhoto,createKnowledge,uploadKnowledgeFiles,DeleteKnowledge } = require('../controller/account.controller');

// 2. 🛠️ Register the GET route so the browser can actually load the page!
router.get('/account', GetAccount);

router.post('/account', upload, CreatPost);
router.put('/update/:id', upload, UpdatePost); 
router.delete('/post/deletes/:id', DeletePost);
router.post('/Detail',uploadPhoto,DetailInsert)
router.post('/knowledge',uploadKnowledgeFiles,createKnowledge);
router.delete('/knowledge/:id',DeleteKnowledge)
module.exports = router;