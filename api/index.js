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

// --- ENDPOINT IMAGE PROXY (Sudah Optimal) ---
app.get('/api/image-proxy', async (req, res) => {
    const imageUrl = req.query.url; 
    
    // Perbaikan: Hapus res.setHeader('Access-Control-Allow-Origin', '*'); karena sudah ada app.use(cors())

    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is missing' });
    }

    try {
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
        const imageBuffer = response.data; 

        if (!contentType || !contentType.startsWith('image/')) {
            return res.status(403).json({ error: 'Blocked: Target did not return a valid image type.' });
        }

        const MAX_WIDTH = 1200;
        const processedBuffer = await sharp(imageBuffer)
            .resize({ 
                width: MAX_WIDTH, 
                withoutEnlargement: true 
            })
            .toBuffer();
        
        res.setHeader('Content-Type', contentType); 
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); 
        res.status(200).send(processedBuffer);

    } catch (error) {
        console.error('Proxy Fetch Error:', error.message);
        res.status(404).json({ error: 'Failed to fetch or process image from source.' });
    }
});

module.exports = app;
