const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cookieParser());

const PASSWORD = '1619';

// Protect the secret page route
app.use((req, res, next) => {
    // If the path starts with /sandhiya, require authentication
    if (req.path.startsWith('/sandhiya')) {
        if (req.cookies.auth !== 'unlocked') {
            return res.redirect('/');
        }
    }
    next();
});

app.post('/api/login', (req, res) => {
    const { pin } = req.body;
    if (pin === PASSWORD) {
        res.cookie('auth', 'unlocked', { httpOnly: true, sameSite: 'strict' });
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid PIN' });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('auth');
    res.json({ success: true });
});

// Serve static files from the current directory
app.use(express.static(__dirname));

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
