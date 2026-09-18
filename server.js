const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Disable caching for all static files & routes so updates appear immediately
app.use((req, res, next) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    next();
});

require('dotenv').config();
const PASSWORD = process.env.LOCKER_PASSWORD || '151333';

const crypto = require('crypto');

// In-memory active session tokens (token -> expiresAt)
const validSessions = new Map();

// Periodic cleanup of expired sessions
setInterval(() => {
    const now = Date.now();
    for (const [token, expiry] of validSessions.entries()) {
        if (expiry < now) {
            validSessions.delete(token);
        }
    }
}, 5 * 60 * 1000);

// Direct access to journey.html is permanently rejected
app.get('/journey.html', (req, res) => {
    res.redirect(302, '/');
});

// Protect the secret page route (case-insensitive, anti-caching, strict rejection)
app.use((req, res, next) => {
    let rawPath = '';
    try {
        rawPath = decodeURIComponent(req.path).toLowerCase();
    } catch (e) {
        rawPath = req.path.toLowerCase();
    }

    const isSecretRoute = 
        rawPath.startsWith('/sandhiya') || 
        rawPath.includes('journey.html') ||
        rawPath.includes('/sandhiya/') ||
        rawPath === '/sandhiya';

    if (isSecretRoute) {
        // Prevent browser caching of secret page so direct URL hits cannot load from cache
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });

        const token = req.cookies.sandhiya_session;
        const isValid = token && validSessions.has(token) && validSessions.get(token) > Date.now();

        if (!isValid) {
            // Invalidate legacy or invalid cookies and reject access
            res.clearCookie('sandhiya_session');
            res.clearCookie('auth');
            return res.redirect(302, '/');
        }
    }
    next();
});

app.post('/api/login', (req, res) => {
    const { pin } = req.body;
    if (pin === PASSWORD) {
        const sessionToken = crypto.randomBytes(32).toString('hex');
        // Valid for 2 hours
        validSessions.set(sessionToken, Date.now() + 2 * 60 * 60 * 1000);

        res.cookie('sandhiya_session', sessionToken, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 2 * 60 * 60 * 1000
        });
        res.clearCookie('auth');
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid PIN' });
    }
});

app.post('/api/logout', (req, res) => {
    const token = req.cookies.sandhiya_session;
    if (token) {
        validSessions.delete(token);
    }
    res.clearCookie('sandhiya_session');
    res.clearCookie('auth');
    res.json({ success: true });
});

// Serve static files from the current directory
app.use(express.static(__dirname));

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
