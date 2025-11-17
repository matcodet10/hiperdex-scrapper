const scapper = require('./scrapper');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// API Home
app.get('/api/', (req, res) => {
    res.send(`
        Latest Chapters at: /api/latest/:page (example: /api/latest/1) <br>
        All Manhwa List at: /api/all/:page (example: /api/all/1) <br>
        Manhwa Info + Chapters at: /api/info/:slug (example: /api/info/secret-class) <br>
        Manhwa Images List at: /api/chapter/:manga/:chapter (example: /api/chapter/nano-machine/chapter-68/)
    `);
});


// Latest
app.get('/api/latest/:page', async (req, res) => {
    const result = await scapper.latest(req.params.page);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4));
});


// All Manhwa
app.get('/api/all/:page', async (req, res) => {
    const result = await scapper.all(req.params.page);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=43200');
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4));
});


// Info
app.get('/api/info/manga/:slug', async (req, res) => {
    const result = await scapper.info(req.params.slug);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4));
});


// Chapter (FIXED — hanya 1 route)
app.get('/api/chapter/:manga/:chapter', async (req, res) => {
    try {
        const result = await scapper.chapter(
            req.params.manga,
            req.params.chapter
        );

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=43200');
        res.header("Content-Type", 'application/json');

        res.send(JSON.stringify(result, null, 4));

    } catch (error) {
        console.error("Error in /api/chapter:", error);
        res.status(500).json({ error: "Failed to fetch chapter image URLs." });
    }
});


module.exports = app;

