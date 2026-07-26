const express=  require('express');

const GetPolicies = (req,res)=>{
    res.redirect('/policies');
}

const MiddlewarePolicy = (req, res, next) => {
    const user = req.session.user;
    
    if (user && !user.hasAcceptedPolicy) {
        return res.redirect('/policies');
    }

    next();
};
module.exports={
 GetPolicies,
 MiddlewarePolicy
}