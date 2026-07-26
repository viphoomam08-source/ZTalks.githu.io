const express = require('express');
const database = require('../util/db');
const multer = require('multer');
const path = require('path'); 
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ----------------------------------------------------
// 1. MULTER STORAGE CONFIGURATIONS
// ----------------------------------------------------

// General Storage (Images, Profile Photos)
const generalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'public', 'images'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadGeneral = multer({ 
    storage: generalStorage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

const uploadMultiple = uploadGeneral.array('pic', 5);
const uploadSinglePhoto = uploadGeneral.single('Photo'); // For profile picture upload

// Knowledge Storage & File Filter (PDFs & Videos)
const knowledgeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'pdf') {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files allowed!'), false);
    } else if (file.fieldname === 'video') {
        if (file.mimetype.startsWith('video/')) cb(null, true);
        else cb(new Error('Only video files allowed!'), false);
    } else {
        cb(null, true);
    }
};

const uploadsKnowledge = multer({
    storage: knowledgeStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 5*1024*1024 }
});

const uploadKnowledgeFiles = uploadsKnowledge.fields([
    { name: 'video', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
]);

// ----------------------------------------------------
// 2. HELPER FUNCTIONS
// ----------------------------------------------------
const formatPostDate = (dateString) => {
    if (!dateString) return 'Just now'; 
    
    const postDate = new Date(dateString);
    const today = new Date();
    
    const isSameDay = (d1, d2) => 
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
        
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (isSameDay(postDate, today)) {
        return 'Today';
    } else if (isSameDay(postDate, yesterday)) {
        return 'Yesterday';
    } else {
        return postDate.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
};

// ----------------------------------------------------
// 3. CONTROLLER FUNCTIONS
// ----------------------------------------------------

// 🏠 GET ACCOUNT DASHBOARD
const GetAccount = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.redirect('/'); 
        }
        
        const currentUserId = req.session.user.id;
        
        const [posts] = await database.execute('SELECT * FROM post WHERE userId=? ORDER BY id DESC', [currentUserId]);
        const [allUsers] = await database.execute('SELECT id, username, email FROM users WHERE id != ?', [currentUserId]);
        const [profiles] = await database.execute('SELECT * FROM profile WHERE user_id = ?', [currentUserId]);
         const [Dipslay] = await database.execute('SELECT * FROM knowledge ORDER BY knowledge_id DESC',[currentUserId]);
        return res.render('account', { 
            user: req.session.user,
            posts: posts,
            allUsers: allUsers, 
            profile: profiles.length > 0 ? profiles[0] : null,
            formatPostDate: formatPostDate ,
            Dipslay:Dipslay
        });
        
    } catch (error) {
        console.error('Error loading account page:', error);
        return res.status(500).send('Internal Server Error');
    }
};

// 📝 CREATE POST 
const CreatPost = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).send('Unauthorized: Please log in');
        }
        const { text } = req.body;
        const { id: userId } = req.session.user; 

        let picData = null;
        if (req.files && req.files.length > 0) {
            const filenames = req.files.map(file => file.filename);
            picData = JSON.stringify(filenames); 
        }

   const [result] =  await database.execute(
            'INSERT INTO post (text, pic, userId) VALUES (?, ?, ?)', 
            [text, picData, userId]
        );
        if(req.broadcast){
            req.broadcast({
                type:'NEW_POST',
                post:{
                    id:result.insertId,
                    text:text,
                    pic:picData,
                    userId:userId,
                    created_at: new Date()
                }
            })
        }
        return res.redirect('/account');
    } catch (error) {
        console.error('Not inserted:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// 🛠️ UPDATE POST 
const UpdatePost = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const postId = req.params.id;
        const { text } = req.body;
        const userId = req.session.user.id;

        let picData = null;
        if (req.files && req.files.length > 0) {
            const filenames = req.files.map(file => file.filename);
            picData = JSON.stringify(filenames);
        }

        if (picData) {
            await database.execute(
                'UPDATE post SET text = ?, pic = ? WHERE id = ? AND userId = ?',
                [text, picData, postId, userId]
            );
        } else {
            await database.execute(
                'UPDATE post SET text = ? WHERE id = ? AND userId = ?',
                [text, postId, userId]
            );
        }

        return res.redirect('/account');
    } catch (error) {
        console.error('Error updating post:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// 🗑️ DELETE POST
const DeletePost = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const postId = req.params.id;
        const userId = req.session.user.id;

        await database.execute(
            'DELETE FROM post WHERE id = ? AND userId = ?',
            [postId, userId]
        );

        return res.redirect('/account');
    } catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// 👤 INSERT OR UPDATE PROFILE
const DetailInsert = async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/');
    }
    
    const userId = req.session.user.id;
    const body = req.body || {};
    const { avatar_type, Emoji, Gender, Age, Place, Favourite, Detail } = body;

    const mode = req.file ? 'upload' : (avatar_type || 'emoji');
    const photoFilename = req.file ? req.file.filename : null;
    const emojiChar = (mode === 'emoji') ? (Emoji || '😎') : null;

    let favouriteValue = null;
    if (Array.isArray(Favourite)) {
        favouriteValue = Favourite.join(', ');
    } else if (typeof Favourite === 'string' && Favourite.trim() !== '') {
        favouriteValue = Favourite.trim();
    }

    try {
        const sql = `
            INSERT INTO profile (user_id, avatar_type, emoji_char, Photo, Gender, Age, Place, Favourite, Detail) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                avatar_type = VALUES(avatar_type),
                emoji_char = VALUES(emoji_char),
                Photo = COALESCE(VALUES(Photo), Photo),
                Gender = VALUES(Gender),
                Age = VALUES(Age),
                Place = VALUES(Place),
                Favourite = VALUES(Favourite),
                Detail = VALUES(Detail)
        `;

        const params = [
            userId,
            mode,
            emojiChar,
            photoFilename,
            Gender || null,
            Age ? parseInt(Age, 10) : null,
            Place || null,
            favouriteValue,
            Detail || null
        ];

        await database.execute(sql, params);
        return res.redirect('/account');

    } catch (error) {
        console.error('Error saving profile detail:', error);
        return res.status(500).json({
            message: "TRY AGAIN",
            error: error.message
        });
    }
};

// 📚 CREATE KNOWLEDGE RESOURCE
const createKnowledge = async (req, res) => {
    try {
        const { title, description, resource_type, type_subject, grade, duration } = req.body;
        const userId = req.session?.user?.id || 1; // Fallback to session user ID

        if (!title || !type_subject || !grade) {
            return res.status(400).json({ message: 'Title, Subject, and Grade are required.' });
        }

        let pdf_url = null;
        let video_url = null;

        if (req.files && req.files.pdf) {
            pdf_url = `/uploads/${req.files.pdf[0].filename}`;
        }

        if (req.files && req.files.video) {
            video_url = `/uploads/${req.files.video[0].filename}`;
        }

        const sql = `
            INSERT INTO knowledge 
            (user_id, title, description, resource_type, type_subject, grade, pdf_url, video_url, duration) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            userId,
            title,
            description || null,
            resource_type || 'PDF',
            type_subject,
            grade,
            pdf_url,
            video_url,
            duration || null
        ];

        const [result] = await database.execute(sql, values);

        return res.status(201).json({
            message: 'Knowledge resource created successfully!',
            knowledge_id: result.insertId,
            data: { title, pdf_url, video_url }
        });

    } catch (error) {
        console.error('Error creating knowledge entry:', error);
        return res.status(500).json({ message: 'Server error during upload', error: error.message });
    }
};
   const DeleteKnowledge = async (req, res) => {
  const { id } = req.params;
  const userId = req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  try {
    const [result] = await database.execute(
      `DELETE FROM knowledge WHERE knowledge_id = ? `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Resource not found or unauthorized to delete" });
    }

    return res.status(200).json({ message: "Resource deleted successfully" });

  } catch (error) {
    console.error("Delete Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
    CreatPost,
    GetAccount,
    UpdatePost,
    DeletePost,
    createKnowledge,
    DetailInsert,
    upload: uploadMultiple,
    uploadPhoto: uploadSinglePhoto,
    uploadKnowledgeFiles,
    DeleteKnowledge
    
};