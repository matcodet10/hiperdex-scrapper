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
        Manhwa Images List at: /api/chapter/:slug (example: /api/chapter/nano-machine/chapter-68/)
        `)
})

app.get('/api/latest/:page', async (req, res) => {

    const result = await scapper.latest(req.params.page)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4))
})

app.get('/api/all/:page', async (req, res) => {

    const result = await scapper.all(req.params.page)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=43200');
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4))
})

app.get('/api/info/:slug', async (req, res) => {

    const result = await scapper.info(req.params.slug)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4))
})

app.get('/api/chapter/:manga/:chapter', async (req, res) => {

    const result = await scapper.chapter(req.params.manga,req.params.chapter)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=43200');
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4))
})

// === PERBAIKAN ENDPOINT IMAGE PROXY ===
app.get('/api/image-proxy', async (req, res) => {
    const imageUrl = req.query.url; 
    
    if (!imageUrl) {
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        return res.status(400).json({ error: 'Image URL is missing' });
    }

    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: {
                // User-Agent yang Anda dapatkan (Wajib Mobile):
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', 
                
                // Referer Halaman Chapter (Wajib Spesifik):
                'Referer': 'https://hiperdex.com/',
                
                // Header-header Mobile Khas Chrome (Sangat Penting):
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br', // Tambahkan kompresi
                'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
                'sec-ch-ua-mobile': '?1', // Sinyal Chrome bahwa ini adalah perangkat Mobile
                'sec-ch-ua-platform': '"Android"', // Sinyal Chrome bahwa OS adalah Android

                // Header Dasar
                'Host': 'i1.r2d2storage.com',
                'Connection': 'keep-alive' 
            }
        });
        // ...
             
        const contentType = response.headers['content-type'];

        // --- 2. VERIFIKASI KONTEN ---
        // Memastikan respons dari situs target benar-benar adalah gambar
        if (!contentType || !contentType.startsWith('image/')) {
            console.error('Target site returned non-image content:', contentType);
            res.setHeader('Access-Control-Allow-Origin', '*'); 
            return res.status(403).json({ error: 'Blocked: Target did not return a valid image type.' });
        }

        // Set Header Sukses
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.setHeader('Content-Type', contentType); 
        
        // --- 3. MENGATASI CACHING (304) ---
        // Ini memaksa klien untuk selalu meminta gambar yang baru (200 OK)
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); 
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Kirim data gambar
        res.status(200).send(response.data);

    } catch (error) {
        // Gunakan error.message untuk logging yang lebih bersih
        console.error('Proxy Fetch Error:', error.message); 
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.status(404).json({ error: 'Failed to fetch image from source.' });
    }
});
// === AKHIR PERBAIKAN ENDPOINT IMAGE PROXY ===


//port = env.PORT || 3000
//app.listen(port, () => {
    //console.log(`Listening to port ${port}`)

module.exports = app;
