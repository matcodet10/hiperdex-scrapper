const scapper = require('./scrapper');
const express = require('express');
const { env } = require('process');
const cors = require('cors');
// --- Import Perbaikan Jaringan ---
const axios = require('axios');
const sharp = require('sharp');
const https = require('https');
const http = require('http');
// ---------------------------------

const app = express();
app.use(cors());

// --- ENDPOINT SCRAPER LAMA (Dibiarkan tidak berubah) ---
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

// --- ENDPOINT IMAGE PROXY FINAL (Untuk Tiling/Cropping) ---
app.get('/api/image-proxy', async (req, res) => {
    const imageUrl = req.query.url;
    
    // Menggunakan parseFloat untuk mendapatkan presisi dari Flutter
    const crop_y = parseFloat(req.query.crop_y);
    const crop_h = parseFloat(req.query.crop_h);
    
    const MAX_WIDTH = 800; // Resolusi Target Final
    const REFERER_URL = 'https://hiperdex.com/'; 
    const TILING_THRESHOLD = 10000; // Ambang batas agar gambar pendek tidak dipotong

    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is missing' });
    }

    // Mempersiapkan VERCEL FUNCTION TIMEOUT agresif
    const VERCEL_FUNCTION_TIMEOUT = 10000; // 10 detik
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
             console.error('VERCEL FUNCTION HANG: Timed out manually after 10 seconds.');
             res.status(504).json({ error: 'Function execution timed out (forced).' });
        }
    }, VERCEL_FUNCTION_TIMEOUT);

    try {
        // 1. Ambil data gambar (dengan perbaikan Jaringan)
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 8000, // Timeout AXIOS lebih pendek dari Function Timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 
                'Referer': REFERER_URL, 
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            },
            // Perbaikan Koneksi Jaringan
            httpAgent: new http.Agent({ keepAlive: true }),
            httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: false }),
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

        // 4. Terapkan Cropping hanya jika gambar panjang DAN ada parameter crop
        if (metadata.height > TILING_THRESHOLD && !isNaN(crop_h) && crop_h > 0) {
            
            const scaleFactor = originalWidth > 0 ? MAX_WIDTH / originalWidth : 1;
            
            // PENTING: Menggunakan parseInt() untuk mengatasi bug pembulatan Sharp
            const scaledCropY = parseInt(crop_y * scaleFactor);
            const scaledCropH = parseInt(crop_h * scaleFactor);

            // Logika safeCropH (Perbaikan Matematis)
            // Menghitung tinggi akhir secara matematis untuk menghindari "bad extract area"
            const scaledImageHeight = Math.floor(metadata.height * scaleFactor);
            let safeCropH = scaledCropH;
            
            // Perbaikan untuk tile terakhir (jika y + h melebihi batas)
            if (scaledCropY + scaledCropH > scaledImageHeight) {
                 safeCropH = scaledImageHeight - scaledCropY;
            }

            if (scaledCropY >= 0 && safeCropH > 0) {
                imageProcessor = imageProcessor.extract({ 
                    left: 0, 
                    top: scaledCropY, 
                    width: MAX_WIDTH, 
                    height: safeCropH // GUNAKAN safeCropH
                });
                console.log(`[DEBUG EXTRACT] SUCCESS: Extracting Y=${scaledCropY}, H=${safeCropH} (Safe)`);
            } else {
                // Ini akan menangkap error "zero/negative dimension"
                console.warn(`[Proxy Warning] Skipping crop due to zero/negative dimension: Y=${scaledCropY}, H=${safeCropH}.`);
            }
        } else {
            // KODE BYPASS: Gambar pendek (<10000px) tidak dipotong.
            // imageProcessor sudah di-resize di Langkah 3.
            console.log(`[DEBUG BYPASS] Image skipped tiling (Height: ${metadata.height}px). Sending only resized image.`);
        }
        
        // 5. Konversi dan kirim
        const processedBuffer = await imageProcessor.toFormat('jpeg').toBuffer(); // Default ke JPEG
        
        // Bersihkan timer sebelum mengirim response
        clearTimeout(timeout); 

        res.setHeader('Content-Type', 'image/jpeg'); 
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); 
        res.status(200).send(processedBuffer);

    } catch (error) {
        // Bersihkan timer pada kegagalan
        clearTimeout(timeout); 
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
