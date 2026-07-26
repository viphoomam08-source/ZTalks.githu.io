const express= require('express');
const GetMessager = (req,res)=>{
    const CurrentUser =  req.session.user
       
    return render('messager',{
        user:req.session.user,
        CurrentUser
    });
}

module.exports ={
    GetMessager

}