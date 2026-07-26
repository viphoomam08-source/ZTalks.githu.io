
const express = require('express');




const GetTrailer =(req,res)=>{
    res.render('trailer', { user: { name: 'Guest', role: 'Visitor' } });
}

module.exports ={
    GetTrailer,
}