const scapper = require('./scrapper');
const express = require('express');
const { env } = require('process');
const cors = require('cors');
const axios = require('axios');
const sharp = require('sharp');
const https = require('https');
const http = require('http'); 

const app = express();
app.use(cors());

app.get('/api/', (req, res) => {
    res.send(`
        Latest Chapters at: /api/latest/:page (example: /api/latest/1) <br>
        All Manhwa List at: /api/all/:page (example: /api/all/1) <br>
        Manhwa Info + Chapters at: /api/info/:slug (example: /api/info/secret-class) <br>
        Manhwa Images List at: /api/chapter/:manga/:chapter (example: /api/chapter/nano-machine/chapter-68/)
        `)
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

app.get('/api/image-proxy', async (req, res) => {
    const imageUrl = req.query.url;
    
    // Menggunakan parseFloat untuk mendapatkan presisi dari Flutter
    const crop_y = parseFloat(req.query.crop_y);
    const crop_h = parseFloat(req.query.crop_h);
    
    const MAX_WIDTH = 800; // Resolusi Target yang Lebih Rendah (Mengurangi beban Vercel)
    const REFERER_URL = 'https://hiperdex.com/'; 

    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is missing' });
    }

    try {
        // 1. Ambil data gambar (dengan perbaikan Jaringan)
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 15000, // Perpanjangan Timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 
                'Referer': REFERER_URL, // Perbaikan Anti-Hotlink
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            },
            // Perbaikan Koneksi Jaringan
            httpAgent: new http.Agent({ keepAlive: true }),
            httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: false }), // SSL Bypass
        });
        
        let imageProcessor = sharp(response.data); 
        
        // 2. Dapatkan metadata asli
        const metadata = await imageProcessor.metadata();
        const originalWidth = metadata.width;

        // 3. Terapkan Resizing Lebar (wajib)
        imageProcessor = imageProcessor.resize({ 
            width: MAX_WIDTH, 
            withoutEnlargement: true 
        });

        // 4. Terapkan Cropping jika parameter valid
        if (!isNaN(crop_h) && crop_h > 0) {
            const scaleFactor = MAX_WIDTH / originalWidth;
            
            // PENTING: Menggunakan parseInt() untuk mengatasi bug pembulatan Sharp
            const scaledCropY = parseInt(crop_y * scaleFactor);
            const scaledCropH = parseInt(crop_h * scaleFactor);

            // KITA HILANGKAN LOGIKA resizedMetadata YANG MENYEBABKAN CRASH 500
            // Mengandalkan pengecekan sederhana:

            if (scaledCropY >= 0 && scaledCropH > 0) {
                imageProcessor = imageProcessor.extract({ 
                    left: 0, 
                    top: scaledCropY, 
                    width: MAX_WIDTH, 
                    height: scaledCropH // Mengandalkan parseInt untuk safety
                });
            } else {
                console.warn(`[Proxy Warning] Skipping crop due to zero/negative dimension: Y=${scaledCropY}, H=${scaledCropH}.`);
            }
        }
        
        // 5. Konversi dan kirim
        const processedBuffer = await imageProcessor.toFormat('jpeg').toBuffer(); // Default ke JPEG
        
        res.setHeader('Content-Type', 'image/jpeg'); 
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); 
        res.status(200).send(processedBuffer);

    } catch (error) {
        console.error('PROXY FINAL FAILURE:', error.message);
        res.status(500).json({ error: `Image processing failed: ${error.message}` });
    }
});
// -------------------------------------------------------------

port = env.PORT || 3000
app.listen(port, () => {
    console.log(`Listening to port ${port}`)
});

// Jangan lupa menambahkan module.exports di akhir untuk Vercel
module.exports = app;
