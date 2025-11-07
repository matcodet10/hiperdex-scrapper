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
app.get('/api/image-split', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).json({ error: 'Image URL missing' });

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://hiperdex.org/',
        'Accept': 'image/*,*/*'
      }
    });

    const inputBuffer = Buffer.from(response.data);

    // ✅ Convert dulu ke JPEG agar Sharp bisa handle metadata
    const jpgBuffer = await sharp(inputBuffer)
      .jpeg({ quality: 90 })
      .toBuffer();

    const img = sharp(jpgBuffer);
    const { width, height } = await img.metadata();

    const CHUNK_HEIGHT = 2800;
    const totalChunks = Math.ceil(height / CHUNK_HEIGHT);

    const base = `https://${req.headers.host}/api/image-chunk`;
    const chunks = Array.from({ length: totalChunks }, (_, i) =>
      `${base}?url=${encodeURIComponent(imageUrl)}&index=${i}`
    );

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.json({ chunks });

  } catch (err) {
    console.error("Split Index Error:", err.message);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: "Could not split image." });
  }
});

app.get('/api/image-chunk', async (req, res) => {
  const imageUrl = req.query.url;
  const index = parseInt(req.query.index || "0", 10);

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://hiperdex.org/',
        'Accept': 'image/*,*/*'
      }
    });

    const inputBuffer = Buffer.from(response.data);

    // ✅ Convert to JPEG dulu juga di sini
    const baseImage = sharp(await sharp(inputBuffer).jpeg({ quality: 90 }).toBuffer());
    const meta = await baseImage.metadata();

    const CHUNK_HEIGHT = 2800;
    const top = index * CHUNK_HEIGHT;

    const chunk = await baseImage.extract({
      left: 0,
      top,
      width: meta.width,
      height: Math.min(CHUNK_HEIGHT, meta.height - top)
    }).jpeg({ quality: 85 }).toBuffer();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "image/jpeg");
    return res.status(200).send(chunk);

  } catch (err) {
    console.error("Split Piece Error:", err.message);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: "Could not return chunk." });
  }
});

module.exports = app;










