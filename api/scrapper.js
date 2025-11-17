const axios = require('axios');
const cheerio = require('cheerio');
const IMAGE_PROXY_URL = 'https://image-proxy.fuadkhalish098.workers.dev/'; 
const BASE_URL = 'https://manga18fx.com';

const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': BASE_URL,
    },
    // Tambahkan timeout untuk mencegah Vercel crash karena koneksi terlalu lama
    timeout: 8000 
};

// --- Fungsi Pembantu: Mengambil Slug ---
const getSlug = (url) => {
    try {
        const parts = new URL(url).pathname.split('/').filter(e => e);
        return parts.length > 1 ? parts[parts.length - 1] : '';
    } catch (e) {
        return '';
    }
};

// --- Fungsi Pembantu: Membuat Proxy URL ---
const getProxyUrl = (imageUrl) => {
    if (!imageUrl) return '';
    return IMAGE_PROXY_URL + encodeURIComponent(imageUrl);
};

// --- Fungsi Scraping: Latest dan All ---

const listScraper = async (endpoint, page) => {
    // Sesuaikan URL untuk endpoint 'latest' atau 'all'
    const url = endpoint === 'latest' ? `${BASE_URL}/page/${page}` : `${BASE_URL}/manga-list/${page}`; 
    
    try {
        const res = await axios.get(url, axiosConfig);

        // Pengamanan 1: Jika halaman adalah Captcha atau kosong
        if (!res.data || res.data.length < 1000) {
            console.warn(`[SCRAPER WARNING] Empty or suspicious response from ${url}`);
            return { p_title: 'Error: Anti-Bot/Empty Response', list: [] };
        }
        
        const $ = cheerio.load(res.data);
        const list = [];
        
        $('.bsx-item').each((i, el) => {
            const $el = $(el);
            // Pengamanan 2: Gunakan || '' untuk memastikan variabel tidak undefined/null
            const title = $el.find('.tt h2').text().trim() || 'No Title Found';
            const itemUrl = $el.find('a').attr('href') || '';
            const image = $el.find('.limit img').attr('src') || '';
            const rating = $el.find('.numscore').text().trim() || '0.0';

            const chapters = [];
            $el.find('.chbox ul li a').each((j, c_el) => {
                chapters.push({
                    c_title: $(c_el).text().trim() || 'No Chapter Title',
                    c_url: $(c_el).attr('href') || '',
                });
            });

            list.push({
                title,
                slug: getSlug(itemUrl),
                image: getProxyUrl(image),
                rating,
                chapters: chapters
            });
        });

        return { p_title: 'Latest Updates', list };
    } catch (error) {
        // TANGKAP SEMUA ERROR KRITIS (Timeout/Network)
        console.error("Critical Scraping Error:", error.message);
        // Selalu kembalikan Status 200 dengan list kosong
        return { p_title: 'Fatal Error Scraping', list: [] }; 
    }
};

// ... (Logika fungsi all, info, chapter tetap sama, pastikan juga menggunakan try...catch yang aman)
const latest = (page) => listScraper('latest', page);
const all = (page) => listScraper('all', page); // Sesuaikan dengan endpoint Manga18fx yang sebenarnya jika berbeda
// ... (export modules) ...

module.exports = {
    latest,
    all,
    // ...
};
