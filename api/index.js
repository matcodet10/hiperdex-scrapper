const scapper = require('./scrapper');
const express = require('express');
const { env } = require('process');
const cors = require('cors');
// --- Import Jaringan yang Diperlukan ---
const axios = require('axios');
const https = require('https');
const http = require('http');
// Catatan: Sharp TIDAK diperlukan di sini
// ---------------------------------

const app = express();
app.use(cors());

// --- ENDPOINT SCRAPER LAMA ---
app.get('/api/', (req, res) => {
    res.send(`
        Latest Chapters at: /api/latest/:page (example: /api/latest/1) <br>
        All Manhwa List at: /api/all/:page (example: /api/all/1) <br>
        Manhwa Info + Chapters at: /api/info/:slug (example: /api/info/secret-class) <br>
        Manhwa Images List at: /api/chapter/:manga/:chapter (example: /api/chapter/nano-machine/chapter-68/)
        `);
});

app.get('/api/latest/:page', async (req, res) => {
    const result = await scapper.latest(req.params.page);
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4));
});

app.get('/api/all/:page', async (req, res) => {
    const result = await scapper.all(req.params.page);
    res.setHeader('Cache-Control', 's-maxage=43200');
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4));
});

app.get('/api/info/:slug', async (req, res) => {
    const result = await scapper.info(req.params.slug);
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4));
});

app.get('/api/chapter/:manga/:chapter', async (req, res) => {
    const result = await scapper.chapter(req.params.manga,req.params.chapter);
    res.setHeader('Cache-Control', 's-maxage=43200');
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4));
});
// -------------------------------------------------------------

// --- ENDPOINT IMAGE PROXY (HANYA MENERUSKAN REQUEST) ---
app.get('/api/image-proxy', async (req, res) => {
    const imageUrl = req.query.url;
    
    const REFERER_URL = 'https://hiperdex.com/'; 
    const HOST_URL = 'hiperdex.com'; // Diperlukan untuk mengatasi 403

    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is missing' });
    }

    // Mempersiapkan VERCEL FUNCTION TIMEOUT agresif
    const VERCEL_FUNCTION_TIMEOUT = 10000; 
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
             console.error('VERCEL FUNCTION HANG: Timed out manually after 10 seconds.');
             res.status(504).json({ error: 'Function execution timed out (forced).' });
        }
    }, VERCEL_FUNCTION_TIMEOUT);

    try {
        // 1. Ambil data gambar dengan HEADER Anti-Hotlinking
        const response = await axios.get(imageUrl, {
            responseType: 'stream', // Menggunakan stream untuk menghindari buffering besar di memori
            timeout: 8000, 
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 
                'Referer': REFERER_URL, 
                'Host': HOST_URL, // Koreksi untuk 403
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            },
            httpAgent: new http.Agent({ keepAlive: true }),
            httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: false }),
        });
        
        // 2. Set Header Cache dan Content-Type dari response asli
        res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        
        // 3. Pipa data gambar langsung ke response (TIDAK ADA PEMROSESAN SHARP)
        response.data.pipe(res);
        
        // Bersihkan timer setelah data dialirkan sepenuhnya
        response.data.on('end', () => {
             clearTimeout(timeout); 
             console.log('[DEBUG PASS-THROUGH] Image stream complete.');
        });
        
    } catch (error) {
        clearTimeout(timeout); 
        console.error('PROXY PASS-THROUGH FAILURE:', error.message);
        // Menangkap 403/404 dari server asli
        const statusCode = error.response ? error.response.status : 500;
        res.status(statusCode).json({ error: `Failed to fetch image: ${error.message}` });
    }
});
// -------------------------------------------------------------


port = env.PORT || 3000
app.listen(port, () => {
    console.log(`Listening to port ${port}`)
});

module.exports = app;
