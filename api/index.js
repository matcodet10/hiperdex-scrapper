// File: api/index.js

// Require path tetap sama karena scrapper.js berada di folder yang sama
const scapper = require('./scrapper') 
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())

// ✅ PERBAIKAN: Rute dasar diubah dari '/api/' menjadi '/'
app.get('/', (req, res) => {
    res.header("Content-Type", 'text/html');
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>HiperDex Scrapper API</title></head>
        <body>
            <h1>HiperDex Scrapper API Endpoints</h1>
            <p><strong>Latest Chapters at:</strong> <code>/latest/:page</code> (example: <code>/latest/1</code>)</p>
            <p><strong>All Manhwa List at:</strong> <code>/all/:page</code> (example: <code>/all/1</code>)</p>
            <p><strong>Manhwa Info + Chapters at:</strong> <code>/info/:slug</code> (example: <code>/info/secret-class</code>)</p>
            <p><strong>Manhwa Images List at:</strong> <code>/chapter/:manga/:chapter</code> (example: <code>/chapter/nano-machine/chapter-68/</code>)</p>
            <p><em>API handler is active and running.</em></p>
        </body>
        </html>
    `)
})

// ✅ PERBAIKAN: Rute diubah dari '/api/latest/:page' menjadi '/latest/:page'
app.get('/latest/:page', async (req, res) => {
    try {
        const result = await scapper.latest(req.params.page)
        res.header("Content-Type", 'application/json');
        res.status(200).send(JSON.stringify(result, null, 4))
    } catch (error) {
        console.error("Error in /latest:", error);
        res.status(500).json({ error: "Server error during scraping latest data." });
    }
})

// ✅ PERBAIKAN: Rute diubah dari '/api/all/:page' menjadi '/all/:page'
app.get('/all/:page', async (req, res) => {
    try {
        const result = await scapper.all(req.params.page)
        res.setHeader('Cache-Control', 's-maxage=43200');
        res.header("Content-Type", 'application/json');
        res.status(200).send(JSON.stringify(result, null, 4))
    } catch (error) {
        console.error("Error in /all:", error);
        res.status(500).json({ error: "Server error during scraping all data." });
    }
})

// ✅ PERBAIKAN: Rute diubah dari '/api/info/:slug' menjadi '/info/:slug'
app.get('/info/:slug', async (req, res) => {
    try {
        const result = await scapper.info(req.params.slug)
        res.header("Content-Type", 'application/json');
        res.status(200).send(JSON.stringify(result, null, 4))
    } catch (error) {
        console.error("Error in /info:", error);
        res.status(500).json({ error: "Server error during scraping info data." });
    }
})

// ✅ PERBAIKAN: Rute diubah dari '/api/chapter/...' menjadi '/chapter/...'
app.get('/chapter/:manga/:chapter', async (req, res) => {
    try {
        const result = await scapper.chapter(req.params.manga,req.params.chapter)
        res.setHeader('Cache-Control', 's-maxage=43200');
        res.header("Content-Type", 'application/json');
        res.status(200).send(JSON.stringify(result, null, 4))
    } catch (error) {
        console.error("Error in /chapter:", error);
        res.status(500).json({ error: "Server error during scraping chapter data." });
    }
})

// Export handler
module.exports = app;
