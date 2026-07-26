const http = require('http');
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const { WebSocketServer } = require('ws');
const passport = require('passport');

const port = 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Broadcast function to send data to ALL connected browsers
const broadcast = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // 1 = OPEN
            client.send(JSON.stringify(data));
        }
    });
};

// Handle incoming WebSocket connections & messages
wss.on('connection', (ws) => {
    console.log('Socket connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data);

            // Broadcast the comment data to everyone connected
            if (data.type === 'send_comment') {
                broadcast({
                    type: 'new_comment',
                    postId: data.postId,
                    username: data.username,
                    text: data.text
                });
            }
        } catch (err) {
            console.error('Error parsing JSON from client:', err);
        }
    });

    ws.on('close', () => {
        console.log('Socket disconnected');
    });
});

app.use((req, res, next) => {
    req.broadcast = broadcast;
    next();
});

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

const UserRoutes = require('./src/route/Users.route');
const TrailerRoute = require('./src/route/Trailer.route');
const homeRoute = require('./src/route/home.route');
const accountRoute = require('./src/route/account.route');
const MessagerRoute = require('./src/route/messager.route');
const friendRoute = require('./src/route/friend.route');

app.use(passport.initialize());
app.use(passport.session());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'src', 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');

app.use('/', UserRoutes);
app.use('/', TrailerRoute);
app.use('/', homeRoute);
app.use('/', accountRoute);
app.use('/', MessagerRoute);
app.use('/', friendRoute);

// ✅ FIXED: Listen on `server`, NOT `app`
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});