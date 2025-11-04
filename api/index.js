const scapper = require('./scrapper')
const express = require('express')
const cors = require('cors')
const { env } = require('process')

const app = express()
app.use(cors())

// Endpoint utama yang menampilkan panduan
app.get('/api/', (req, res) => {
    // Tambahkan header HTML untuk tampilan yang lebih baik
    res.header("Content-Type", 'text/html');
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>HiperDex Scrapper API</title></head>
        <body>
            <h1>HiperDex Scrapper API Endpoints</h1>
            <p><strong>Latest Chapters at:</strong> <code>/api/latest/:page</code> (example: <code>/api/latest/1</code>)</p>
            <p><strong>All Manhwa List at:</strong> <code>/api/all/:page</code> (example: <code>/api/all/1</code>)</p>
            <p><strong>Manhwa Info + Chapters at:</strong> <code>/api/info/:slug</code> (example: <code>/api/info/secret-class</code>)</p>
            <p><strong>Manhwa Images List at:</strong> <code>/api/chapter/:manga/:chapter</code> (example: <code>/api/chapter/nano-machine/chapter-68/</code>)</p>
            <p><em>This is the Vercel handler. It successfully loaded!</em></p>
        </body>
        </html>
    `)
})

app.get('/api/latest/:page', async (req, res) => {
    try {
        const result = await scapper.latest(req.params.page)
        res.header("Content-Type", 'application/json');
        res.status(200).send(JSON.stringify(result, null, 4))
    } catch (error) {
        console.error("Error in /api/latest:", error);
        res.status(500).json({ error: "Server error during scraping latest data." });
    }
})

app.get('/api/all/:page', async (req, res) => {
    try {
        const result = await scapper.all(req.params.page)
        res.setHeader('Cache-Control', 's-maxage=43200');
        res.header("Content-Type", 'application/json');
        res.status(200).send(JSON.stringify(result, null, 4))
    } catch (error) {
        console.error("Error in /api/all:", error);
        res.status(500).json({ error: "Server error during scraping all data." });
    }
})

app.get('/api/info/:slug', async (req, res) => {
    try {
        const result = await scapper.info(req.params.slug)
        res.header("Content-Type", 'application/json');
        res.status(200).send(JSON.stringify(result, null, 4))
    } catch (error) {
        console.error("Error in /api/info:", error);
        res.status(500).json({ error: "Server error during scraping info data." });
    }
})

app.get('/api/chapter/:manga/:chapter', async (req, res) => {
    try {
        const result = await scapper.chapter(req.params.manga,req.params.chapter)
        res.setHeader('Cache-Control', 's-maxage=43200');
        res.header("Content-Type", 'application/json');
        res.status(200).send(JSON.stringify(result, null, 4))
    } catch (error) {
        console.error("Error in /api/chapter:", error);
        res.status(500).json({ error: "Server error during scraping chapter data." });
    }
})

module.exports = app;
