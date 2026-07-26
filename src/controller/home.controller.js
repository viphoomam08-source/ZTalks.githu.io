const express = require('express');
const database = require('../util/db');
const multer = require('multer');
const fs =require('fs');
const path = require('path');
const { type } = require('os');


const MiddlewarePolicy = (req, res, next) => {
    const user = req.session ? req.session.user : null;

    if (user && !user.hasAcceptedPolicy) {
        req.showPolicyModal = true;
    } else {
        req.showPolicyModal = false;
    }

    next(); 
};

// 2. Main Get Home Route Controller
const GetHome = async (req, res) => {
    const Logged = req.session.user;
    if (!Logged) {
        return res.redirect('/');
    }

    try {
        const [
            [post], 
            [userProfiles] ,
             [dipslayKnowledg] ,
             [knowledgeProfile]
        ] = await Promise.all([
            database.execute(`
                SELECT 
                    post.id,
                    post.text,
                    post.pic,
                    post.userId,
                    post.created_at,
                    users.username AS creator_username,
                    profile.emoji_char,
                    profile.Favourite,
                    profile.Photo,
                    profile.Gender,
                    profile.Place,
                    profile.Detail
                FROM post 
                JOIN users ON post.userId = users.id 
                LEFT JOIN profile ON post.userId = profile.user_id
                ORDER BY post.id DESC
            `),
            database.execute(`
                SELECT 
                    users.id AS user_id,
                    users.username,
                    users.email,
                    profile.avatar_type,
                    profile.emoji_char,
                    profile.Photo,
                    profile.Gender,
                    profile.Age,
                    profile.Place,
                    profile.Favourite,
                    profile.Detail
                FROM users
                LEFT JOIN profile ON users.id = profile.user_id
                ORDER BY profile.user_id DESC
            `),
            database.execute(`SELECT * FROM knowledge`),
            database.execute(
                `SELECT 
    users.id AS user_id,
    users.username,
    users.email,
    profile.avatar_type,
    profile.emoji_char,
    profile.Photo,
    profile.Gender,
    profile.Age,
    profile.Place,
    profile.Favourite,
    profile.Detail,
    knowledge.knowledge_id AS id, -- Useful for card dynamic IDs
    knowledge.title,
    knowledge.description,
    knowledge.resource_type,
    knowledge.type_subject,
    knowledge.grade,
    knowledge.pdf_url,
    knowledge.video_url,
    knowledge.thumbnail_url,
    knowledge.duration,
    knowledge.created_at
    FROM users
   LEFT JOIN profile ON users.id = profile.user_id
   JOIN knowledge ON users.id = knowledge.user_id;
                
                `
            )
  
        ]);

        res.render('home', { 
            user: Logged,
            post: post, 
            GetUsers: userProfiles, 
            Allprofile: userProfiles,
             dipslayKnowledg:dipslayKnowledg,
             knowledgeProfile:knowledgeProfile,
            showPolicyModal: !!req.showPolicyModal 
        });

    } catch (error) {
        console.error("Error loading home page:", error);
        res.status(500).send("Server Error loading home page");
    }


  
      
};
 
module.exports = {
    MiddlewarePolicy,
    GetHome
    
}