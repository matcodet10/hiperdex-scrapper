const scapper = require('./scrapper')
const express = require('express')
const { env } = require('process')
const cors = require('cors')
const axios = require('axios');
const sharp = require('sharp');

const app = express()
app.use(cors())

app.get('/api/', (req, res) => {
    res.send(`
        Latest Chapters at: /api/latest/:page (example: /api/latest/1) <br>
        All Manhwa List at: /api/all/:page (example: /api/all/1) <br>
        Manhwa Info + Chapters at: /api/info/:slug (example: /api/info/secret-class) <br>
        Manhwa Images List at: /api/chapter/:slug (example: /api/chapter/nano-machine/chapter-68/)
        `)
})

const handleScraperEndpoint = (scraperFunction) => async (req, res) => {
    try {
        const result = await scraperFunction(req.params.page || req.params.slug || req.params.manga, req.params.chapter);
        res.setHeader('Cache-Control', 's-maxage=43200');
        res.header("Content-Type", 'application/json');
        res.send(JSON.stringify(result, null, 4));
    } catch (error) {
        console.error(`Scraper Endpoint Error (${req.path}):`, error.message);
        res.status(500).json({ error: 'Failed to process request or fetch data from target.', details: error.message });
    }
};

app.get('/api/latest/:page', handleScraperEndpoint(scapper.latest));

app.get('/api/all/:page', handleScraperEndpoint(scapper.all));

app.get('/api/info/:slug', handleScraperEndpoint(scapper.info));

app.get('/api/chapter/:manga/:chapter', handleScraperEndpoint((manga, chapter) => scapper.chapter(manga, chapter)));

// --- ENDPOINT IMAGE PROXY (Final Optimal dengan Cropping/Tiling) ---
app.get('/api/image-proxy', async (req, res) => {
    const imageUrl = req.query.url; 
    const crop_y = parseInt(req.query.crop_y || 0); // Posisi Y awal pemotongan
    const crop_h = parseInt(req.query.crop_h);      // Tinggi pemotongan yang diminta
    
    // Batas Lebar Maksimal untuk Mobile
    const MAX_WIDTH = 1200; 

    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is missing' });
    }

    try {
        // 
        const REFERER_URL = 'https://hiperdex.com/manga/my-new-family-treats-me-well-new/chapter-90/'; 
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 
                'Referer': REFERER_URL, 
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                'Host': 'i1.r2d2storage.com',
                'Connection': 'keep-alive' 
            }
        });
        
        const contentType = response.headers['content-type'];
        let imageProcessor = sharp(response.data); // Mulai pemrosesan dengan buffer
        
        // 1. Dapatkan metadata (ukuran) asli
        const metadata = await imageProcessor.metadata();
        const originalWidth = metadata.width;

        // 2. Terapkan Resizing Lebar (selalu dilakukan)
        imageProcessor = imageProcessor.resize({ 
            width: MAX_WIDTH, 
            withoutEnlargement: true 
        });

        // 3. Terapkan Cropping/Pemotongan jika parameter crop_h diberikan
        if (crop_h) {
            // Kita harus menyesuaikan posisi Y (crop_y) agar sesuai dengan lebar baru (1200px)
            // Hitung faktor skala: (Lebar Baru / Lebar Asli)
            const scaleFactor = MAX_WIDTH / originalWidth;
            
            // Terapkan skala pada posisi Y dan Tinggi Potongan
            const scaledCropY = Math.round(crop_y * scaleFactor);
            const scaledCropH = Math.round(crop_h * scaleFactor);

            // Cek apakah hasil skala masih valid
            if (scaledCropY >= 0 && scaledCropH > 0) {
                imageProcessor = imageProcessor.extract({ 
                    left: 0, 
                    top: scaledCropY, 
                    width: MAX_WIDTH, 
                    height: scaledCropH 
                });
            } else {
                 // Ini terjadi jika crop_y atau crop_h tidak valid
                 console.warn("Crop parameter invalid after scaling. Skipping crop.");
            }
        }
        
        const processedBuffer = await imageProcessor.toBuffer();
        
        res.setHeader('Content-Type', contentType); 
        // Header cache yang lebih agresif untuk gambar yang di-crop
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); 
        res.status(200).send(processedBuffer);

    } catch (error) {
        console.error('Proxy Fetch/Process Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch or process image from source.' });
    }
});

module.exports = app;
