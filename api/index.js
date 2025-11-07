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
    
    // Ambil parameter crop_y dan crop_h, parse sebagai float/string (bukan integer di awal)
    const crop_y = parseFloat(req.query.crop_y);
    const crop_h = parseFloat(req.query.crop_h);
    
    // <<< TAMBAHKAN LOG DI SINI (LOG 1) >>>
    console.log(`[DEBUG PARAMS] Y: ${crop_y}, H: ${crop_h}`); 
    
    // ... (Konstanta dan pengecekan !imageUrl)

    try {
        // ... (Logika axios.get)

        let imageProcessor = sharp(response.data); 
        
        // ... (Logika metadata dan resize)

        // 4. Terapkan Cropping jika parameter valid
        if (!isNaN(crop_h) && crop_h > 0) {
            
            // <<< TAMBAHKAN LOG DI SINI (LOG 2) >>>
            console.log('[DEBUG CROPPING] STARTING TILING LOGIC'); 
            
            const scaleFactor = MAX_WIDTH / originalWidth;
            const scaledCropY = parseInt(crop_y * scaleFactor);
            const scaledCropH = parseInt(crop_h * scaleFactor);

            // ... (Logika resizedMetadata dan scaledImageHeight)

            // Logic safeCropH untuk menghindari "bad extract area"
            let safeCropH = scaledCropH;
            if (scaledCropY + scaledCropH > scaledImageHeight) {
                safeCropH = scaledImageHeight - scaledCropY;
            }

            // <<< TAMBAHKAN LOG DI SINI (LOG 3) >>>
            console.log(`[DEBUG SCALED] Y: ${scaledCropY}, H: ${scaledCropH}, SafeH: ${safeCropH}`); 

            if (scaledCropY >= 0 && safeCropH > 0) {
                imageProcessor = imageProcessor.extract({ 
                    left: 0, 
                    top: scaledCropY, 
                    width: MAX_WIDTH, 
                    height: safeCropH // Gunakan safeCropH
                });
                // <<< TAMBAHKAN LOG DI SINI (LOG 4) >>>
                console.log('[DEBUG EXTRACT] SUCCESS: Extracting image.'); 

            } else {
                console.warn(`[Proxy Warning] Invalid crop parameters: Y=${scaledCropY}, H=${safeCropH}. Skipping crop.`);
                // <<< TAMBAHKAN LOG DI SINI (LOG 5) >>>
                console.log(`[DEBUG EXTRACT] FAILURE: Skip extract because Y=${scaledCropY}, SafeH=${safeCropH}`); 
            }
        } else {
            // <<< TAMBAHKAN LOG DI SINI (LOG 6) >>>
            console.log(`[DEBUG CROPPING] BYPASSED: crop_h is not valid (${crop_h}).`); 
        }
        
        // ... (Logika pengiriman buffer)

    } catch (error) {
        // ... (Catch block)
    }
});

port = env.PORT || 3000
app.listen(port, () => {
    console.log(`Listening to port ${port}`)
})

// Jangan lupa menambahkan module.exports di akhir untuk Vercel
module.exports = app;










