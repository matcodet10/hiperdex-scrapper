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
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream', // ✅ STREAM langsung (tidak buffer)
      headers: {
        'User-Agent': req.headers['user-agent'] ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://hiperdex.com/',
        'Accept': 'image/*,*/*'
      }
    });

    // ✅ Salin content type dari sumber
    res.setHeader("Content-Type", response.headers['content-type']);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");

    // ✅ STREAM langsung ke client → Anti Crash!
    response.data.pipe(res);

  } catch (err) {
    console.error("Proxy Error:", err.message);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: "Proxy server failed." });
  }
});

module.exports = app;












