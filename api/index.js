const scapper = require('./scrapper')
const express = require('express')
const { env } = require('process')
const cors = require('cors')
const axios = require('axios'); 
const sharp = require('sharp');
const https = require('https');
const http = require('http'); 
// --------------------

const app = express()
app.use(cors())

// --- ENDPOINT SCRAPER LAMA (Dibiarkan tidak berubah) ---
app.get('/api/', (req, res) => {
    res.send(`
        Latest Chapters at: /api/latest/:page (example: /api/latest/1) <br>
        All Manhwa List at: /api/all/:page (example: /api/all/1) <br>
        Manhwa Info + Chapters at: /api/info/:slug (example: /api/info/secret-class) <br>
        Manhwa Images List at: /api/chapter/:manga/:chapter (example: /api/chapter/nano-machine/chapter-68/)
        `)
})

app.get('/api/latest/:page', async (req, res) => {
    const result = await scapper.latest(req.params.page)
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4))
})

app.get('/api/all/:page', async (req, res) => {
    const result = await scapper.all(req.params.page)
    res.setHeader('Cache-Control', 's-maxage=43200');
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4))
})

app.get('/api/info/:slug', async (req, res) => {
    const result = await scapper.info(req.params.slug)
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4))
})

app.get('/api/chapter/:manga/:chapter', async (req, res) => {
    const result = await scapper.chapter(req.params.manga,req.params.chapter)
    res.setHeader('Cache-Control', 's-maxage=43200');
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4))
})
// -------------------------------------------------------------

// --- ENDPOINT IMAGE PROXY BARU (Untuk Tiling/Cropping) ---
app.get('/api/image-proxy', async (req, res) => {
    const imageUrl = req.query.url;
    const REFERER_URL = 'https://hiperdex.com/';

    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is missing' });
    }

    try {
        // HANYA MENGAMBIL DATA (AXIOS)
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer', // Ambil sebagai buffer
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 
                'Referer': REFERER_URL, 
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            },
            // Gunakan Agent yang sudah diperbaiki (PENTING)
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            timeout: 20000, // Perpanjang timeout maksimal untuk uji coba
        });

        // LANGSUNG KIRIM BUFFER MENTAH KE CLIENT (TANPA SHARP)
        res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.status(200).send(response.data);

    } catch (error) {
        console.error('PROXY FETCH/NETWORK ERROR:', error.message);
        res.status(500).json({ error: 'Network test failed: Could not fetch image buffer.' });
    }
});
// ...

port = env.PORT || 3000
app.listen(port, () => {
    console.log(`Listening to port ${port}`)
})

// Jangan lupa menambahkan module.exports di akhir untuk Vercel
module.exports = app;








