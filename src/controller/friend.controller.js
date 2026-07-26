const database = require('../util/db');

const GetAccount = async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/'); 
    }

    try {
        const [rows] = await pool.query("SELECT username, email FROM users");

        return res.render('account', { 
            user: req.session.user,
            allUsers: rows 
        });

    } catch (error) {
        console.error("Error loading account page data:", error);
        return res.status(500).send("Server Error");
    }
};

module.exports = { GetAccount };