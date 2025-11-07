const scapper = require('./scrapper')
const express = require('express')
const { env } = require('process')
const cors = require('cors')
const axios = require('axios');

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

app.get('/api/image-proxy', async (req, res) => {
    const imageUrl = req.query.url; 
    
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is missing' });
    }

    try {
        const REFERER_URL = 'https://hiperdex.com/manga/my-new-family-treats-me-well-new/chapter-90/'; 
        
        const response = await axios.get(imageUrl, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 
                'Referer': REFERER_URL,
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                'Host': 'i1.r2d2storage.com',
                'Connection': 'keep-alive' 
            }
        });
        
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
            return res.status(403).json({ error: 'Blocked: Target did not return a valid image type.' });
        }

        res.setHeader('Content-Type', contentType); 
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); 
        response.data.pipe(res);
    } catch (error) {
        console.error('Proxy Fetch Error:', error.message);
        res.status(404).json({ error: 'Failed to fetch image from source.' });
    }
});


//port = env.PORT || 3000
//app.listen(port, () => {
    //console.log(`Listening to port ${port}`)

//module.exports = app;





