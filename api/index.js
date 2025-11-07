const scapper = require('./scrapper')
const express = require('express')
const { env } = require('process')
const cors = require('cors')
const axios = require('axios');
const https = require('https');
const http = require('http');
// axios, sharp, https, http sudah dihapus di sini
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
app.get('/api/image-proxy', async (req, res) => {
    const imageUrl = req.query.url;
    
    const MAX_WIDTH = 800; // Resolusi Target Final
    const REFERER_URL = 'https://hiperdex.com/'; 

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
        // 1. Ambil data gambar (dengan Referer dan Timeout)
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 8000, 
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 
                'Referer': REFERER_URL, 
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            },
            httpAgent: new http.Agent({ keepAlive: true }),
            httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: false }),
        });
        
        let imageProcessor = sharp(response.data); 
        
        // 2. Terapkan Resizing Lebar ke 800px (Satu-satunya pemrosesan)
        imageProcessor = imageProcessor.resize({ 
            width: MAX_WIDTH, 
            withoutEnlargement: true 
        });
        
        console.log(`[DEBUG SIMPLE PROXY] Resizing complete. Sending full image.`);

        // 3. Konversi dan kirim
        const processedBuffer = await imageProcessor.toFormat('jpeg').toBuffer(); // Default ke JPEG
        
        clearTimeout(timeout); 

        res.setHeader('Content-Type', 'image/jpeg'); 
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); 
        res.status(200).send(processedBuffer);

    } catch (error) {
        clearTimeout(timeout); 
        console.error('PROXY SIMPLE FAILURE:', error.message);
        res.status(500).json({ error: `Image processing failed: ${error.message}` });
    }
});

port = env.PORT || 3000
app.listen(port, () => {
    console.log(`Listening to port ${port}`)
})

// Jangan lupa menambahkan module.exports di akhir untuk Vercel
module.exports = app;



