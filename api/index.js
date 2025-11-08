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

app.get('/api/', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(`
        <h1>API Status: OK</h1>
        <p>Endpoint API Metadata (Vercel) dan Image Proxy (Cloudflare Workers) berhasil dipisahkan.</p>
        <h2>Endpoint Metadata (Vercel)</h2>
        <p>Latest Chapters at: /api/latest/:page (example: /api/latest/1)</p>
        <p>All Manhwa List at: /api/all/:page (example: /api/all/1)</p>
        <p>Manhwa Info + Chapters at: /api/info/:slug (example: /api/info/secret-class)</p>
        <p>Manhwa Images List at: /api/chapter/:manga/:chapter (Mengembalikan Daftar URL Gambar, BUKAN Gambar Biner)</p>
        <h2>Image Proxy (Cloudflare Workers)</h2>
        <p>URL: https://image-proxy.fuadkhalish098.workers.dev/img-proxy?url= (Ini harus dipanggil dari Frontend)</p>
    `);
});

app.get('/api/latest/:page', async (req, res) => {
    try {
        const result = await scapper.latest(req.params.page);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.header("Content-Type", 'application/json');
        res.send(JSON.stringify(result, null, 4));
    } catch (error) {
        console.error("Error in /api/latest:", error);
        res.status(500).json({ error: "Failed to fetch latest data." });
    }
});

app.get('/api/all/:page', async (req, res) => {
    try {
        const result = await scapper.all(req.params.page);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=43200');
        res.header("Content-Type", 'application/json');
        res.send(JSON.stringify(result, null, 4));
    } catch (error) {
        console.error("Error in /api/all:", error);
        res.status(500).json({ error: "Failed to fetch all list." });
    }
});

app.get('/api/info/:slug', async (req, res) => {
    try {
        const result = await scapper.info(req.params.slug);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.header("Content-Type", 'application/json');
        res.send(JSON.stringify(result, null, 4));
    } catch (error) {
        console.error("Error in /api/info:", error);
        res.status(500).json({ error: "Failed to fetch info data." });
    }
});

// Endpoint yang MENGEMBALIKAN DAFTAR URL GAMBAR (Bukan gambar biner)
app.get('/api/chapter/:manga/:chapter', async (req, res) => {
    try {
        // Asumsi: scapper.chapter mengembalikan Array<string> URL gambar asli
        const result = await scapper.chapter(req.params.manga, req.params.chapter); 
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=43200');
        res.header("Content-Type", 'application/json');
        res.send(JSON.stringify(result, null, 4));
    } catch (error) {
        console.error("Error in /api/chapter:", error);
        res.status(500).json({ error: "Failed to fetch chapter image URLs." });
    }
});


// Export aplikasi untuk digunakan oleh Vercel
module.exports = app;













