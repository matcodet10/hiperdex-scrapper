const scapper = require('./scrapper');
const express = require('express');
const { env } = require('process');
const cors = require('cors');
// --- Import Jaringan yang Diperlukan ---
const axios = require('axios');
const https = require('https');
const http = require('http');
const sharp = require('sharp');
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
  if (!imageUrl) return res.status(400).json({ error: 'Image URL missing' });

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      decompress: true,
      headers: {
        'User-Agent': req.headers['user-agent'] ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://hiperdex.com/',
        'Accept': 'image/*,*/*'
      }
    });

    const inputBuffer = Buffer.from(response.data);

    // ✅ Resize untuk mencegah WebGL crash
    const processed = sharp(inputBuffer)
  .resize({
    width: 720,
    withoutEnlargement: true
  });

const metadata = await processed.metadata();

// Tinggi maksimal per segmen
const MAX_SEGMENT_HEIGHT = 1200;

const segments = Math.ceil(metadata.height / MAX_SEGMENT_HEIGHT);

let outputImages = [];

for (let i = 0; i < segments; i++) {
  const top = i * MAX_SEGMENT_HEIGHT;
  const height = Math.min(MAX_SEGMENT_HEIGHT, metadata.height - top);

  const segmentBuffer = await processed
    .extract({ left: 0, top, width: metadata.width, height })
    .jpeg({ quality: 85 })
    .toBuffer();

  outputImages.push(segmentBuffer.toString("base64"));
}

res.setHeader("Access-Control-Allow-Origin", "*");
return res.json({
  type: "split",
  count: segments,
  images: outputImages
});
// === AKHIR PERBAIKAN ENDPOINT IMAGE PROXY ===


//port = env.PORT || 3000
//app.listen(port, () => {
    //console.log(`Listening to port ${port}`)

module.exports = app;







