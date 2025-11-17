// index.js (Dihost di Vercel)

const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Diperlukan hanya untuk proxying

const app = express();
app.use(cors());

// --- KONFIGURASI PENTING ---
// GANTI DENGAN DOMAIN CLOUDFLARE WORKER ANDA YANG SEBENARNYA!
const WORKER_URL = 'https://your-worker-domain.workers.dev'; 
// -------------------------

// Middleware untuk meneruskan permintaan ke Worker
async function proxyToWorker(req, res, path) {
    try {
        // Ambil semua parameter query (page, slug, dll.)
        const queryParams = new URLSearchParams(req.query).toString();
        
        // Buat URL lengkap ke Worker
        const workerTargetUrl = `${WORKER_URL}${path}?${queryParams}`;
        
        // Buat permintaan HTTP ke Worker
        const workerResponse = await axios.get(workerTargetUrl, {
            // Penting: Abaikan validasi SSL untuk keamanan jika menggunakan env development
            // Namun, karena ini adalah Vercel -> Worker, ini tidak terlalu penting.
            validateStatus: (status) => true, // Terima semua status respons
        });

        // Teruskan Header dan Status dari Worker ke client
        res.status(workerResponse.status);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // Teruskan data JSON dari Worker
        res.send(JSON.stringify(workerResponse.data, null, 4));

    } catch (error) {
        console.error("Error proxying request to Worker:", error.message);
        res.status(500).json({ 
            error: "Failed to connect to the Scraper Worker.",
            worker_url_base: WORKER_URL
        });
    }
}

// --- ROUTING API ---

app.get('/api/', (req, res) => {
    // Endpoint ini hanya memberikan panduan rute lokal
    res.send(`
        API Routes (Proxied to Cloudflare Worker):<br>
        Latest: /api/latest/:page (params: page)<br>
        All Manhwa: /api/all/:page (params: page)<br>
        Manhwa Info: /api/info/:slug (params: slug)<br>
        Manhwa Chapter: /api/chapter/:manga/:chapter (params: manga, chapter)<br>
        **Image Proxy Worker (Client-Side): /img-proxy?url=...**
        `)
})

// Rute /api/latest
app.get('/api/latest/:page', (req, res) => {
    // Meneruskan ke Worker: /latest?page=X
    req.query.page = req.params.page; // Salin page dari path ke query
    proxyToWorker(req, res, '/latest');
});

// Rute /api/all
app.get('/api/all/:page', (req, res) => {
    // Meneruskan ke Worker: /all?page=X
    req.query.page = req.params.page;
    proxyToWorker(req, res, '/all');
});

// Rute /api/info
app.get('/api/info/:slug', (req, res) => {
    // Meneruskan ke Worker: /info?slug=X
    req.query.slug = req.params.slug;
    proxyToWorker(req, res, '/info');
});

// Rute /api/chapter (Menggunakan Query Parameter yang Disederhanakan untuk Worker)
// Worker Anda mengharapkan: /chapter?manga=X&chapter=Y
app.get('/api/chapter/:manga/:chapter', (req, res) => {
    // Meneruskan ke Worker: /chapter?manga=X&chapter=Y
    req.query.manga = req.params.manga;
    req.query.chapter = req.params.chapter;
    proxyToWorker(req, res, '/chapter');
});

// Export aplikasi untuk digunakan oleh Vercel
module.exports = app;
