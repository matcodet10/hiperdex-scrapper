// index.js (Dideploy di Vercel)

const scrapper = require('./Scrapper');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// Middleware CORS dasar untuk semua request
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    next();
});

// --- ENDPOINT HANDLERS ---

// 1. Latest Chapters: /api/latest/:page
app.get('/api/latest/:page', async (req, res) => {
    try {
        const result = await scrapper.latest(req.params.page)
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch latest updates', details: error.message });
    }
});

// 2. All Manhwa List: /api/all/:page
app.get('/api/all/:page', async (req, res) => {
    try {
        const result = await scrapper.all(req.params.page)
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch all manhwa list', details: error.message });
    }
});

// 3. Manhwa Info + Chapters: /api/info/:slug
app.get('/api/info/:slug', async (req, res) => {
    try {
        const result = await scrapper.info(req.params.slug)
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch manhwa info', details: error.message });
    }
});


// 4. Manhwa Images List: /api/chapter/:manga/:chapter
app.get('/api/chapter/:manga/:chapter', async (req, res) => {
    try {
        const result = await scrapper.chapter(req.params.manga, req.params.chapter)
        // Cache-Control untuk respons JSON yang tidak akan berubah
        res.setHeader('Cache-Control', 's-maxage=43200'); 
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chapter images list', details: error.message });
    }
});


// Export aplikasi untuk digunakan oleh Vercel
module.exports = app;
