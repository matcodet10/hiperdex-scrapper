const axios = require('axios');
const cheerio = require('cheerio');

// 🔥 WAJIB DIGANTI: Domain Cloudflare Worker Anda
const PROXY_WORKER_DOMAIN = 'https://image-proxy.fuadkhalish098.workers.dev/'; 
const BASE_URL = 'https://manga18fx.com'; // Hanya untuk Referer/Logika

// Hapus BASE_URL di sini, Axios sekarang memanggil Worker
const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': BASE_URL, // Tetap gunakan Referer situs sumber
    },
    timeout: 10000 
};

// ... (Fungsi Pembantu getSlug dan getProxyUrl tetap sama) ...
const getSlug = (url) => {
    try {
        if (!url) return '';
        const parts = new URL(url).pathname.split('/').filter(e => e);
        return parts.length > 1 ? parts[parts.length - 1] : '';
    } catch (e) {
        return '';
    }
};

const getProxyUrl = (imageUrl) => {
    // getProxyUrl sekarang memanggil Worker untuk gambar
    if (!imageUrl || typeof imageUrl !== 'string') return '';
    return PROXY_WORKER_DOMAIN + '/img-proxy?url=' + encodeURIComponent(imageUrl);
};

// --- Fungsi Utama: Latest dan All ---

const listScraper = async (endpoint, page) => {
    // Worker akan menangani URL path yang benar ke Manga18fx
    const path = endpoint === 'latest' ? `/page/${page}` : `/manga-list/${page}`; 
    const url = PROXY_WORKER_DOMAIN + path; // <--- PENTING: Panggil Worker Anda

    try {
        const res = await axios.get(url, axiosConfig);

        // Worker harus mengembalikan HTML
        if (!res.data || res.data.length < 1000 || res.data.includes("Anti-Bot Detected")) {
            console.warn(`[SCRAPER WARNING] Worker returned Anti-Bot/Empty response for ${url}`);
            return { p_title: 'Error: Anti-Bot Detected by Worker', list: [] };
        }
        
        const $ = cheerio.load(res.data);
        const list = [];
        
        // Coba scraping dengan selector yang sama
        $('.bsx-item').each((i, el) => {
            const $el = $(el);
            
            const itemUrl = $el.find('a').attr('href') || '';
            const image = $el.find('.limit img').attr('src') || '';
            
            list.push({
                title: $el.find('.tt h2').text().trim() || 'No Title Found',
                slug: getSlug(itemUrl),
                image: getProxyUrl(image),
                rating: $el.find('.numscore').text().trim() || '0.0',
                chapters: [] 
            });
        });

        return { p_title: 'Latest Updates', list };
    } catch (error) {
        console.error(`Critical Scraping Error in ${endpoint}():`, error.message);
        return { p_title: 'Fatal Error Scraping (Network/Worker Down)', list: [] }; 
    }
};

const latest = (page) => listScraper('latest', page);
const all = (page) => listScraper('all', page);


// --- Fungsi Utama: Manhwa Info (Detail) ---
const info = async (slug) => {
    const path = `/manga/${slug}`;
    const url = PROXY_WORKER_DOMAIN + path; // <--- PENTING: Panggil Worker Anda
    try {
        const res = await axios.get(url, axiosConfig);
        
        if (!res.data || res.data.length < 1000) {
            return { error: 'Failed to load info: Worker Anti-Bot/Empty Response' };
        }

        const $ = cheerio.load(res.data);
        
        const posterUrl = $('.summary_image img').attr('src');
        const chapters = [];
        $('.version-chap li a').each((i, el) => {
            chapters.push({
                ch_title: $(el).text().trim(),
                url: $(el).attr('href'),
            });
        });
        
        const genres = [];
        $('.genres-content a').each((i, el) => {
            genres.push($(el).text().trim());
        });
        
        const rating = $('.post-content_item .numscore').text().trim() || '0.0';

        return {
            page: $('.post-title h1').text().trim(),
            poster: getProxyUrl(posterUrl), 
            description: $('.summary__content .wp-content p').text().trim() || 'No description available.',
            rating: rating,
            genres: genres,
            ch_list: chapters.reverse(),
        };
    } catch (error) {
        console.error("Error in info:", error.message);
        return { error: 'Failed to load info due to server error.' };
    }
}

// --- Fungsi Utama: Chapter Images ---
const chapter = async (mangaSlug, chapterSlug) => {
    const path = `/manga/${mangaSlug}/${chapterSlug}`;
    const url = PROXY_WORKER_DOMAIN + path; // <--- PENTING: Panggil Worker Anda
    
    try {
        const res = await axios.get(url, axiosConfig);
        const $ = cheerio.load(res.data);
        const chapters = [];
        
        $('.read-manga img').each((i, el) => {
            const imageSrc = $(el).attr('src') || $(el).attr('data-src');

            if (imageSrc) {
                chapters.push({
                    ch: getProxyUrl(imageSrc), // Menggunakan Proxy Worker
                });
            }
        });
        
        return { mangaSlug, chapterSlug, chapters };
    } catch (error) {
        console.error("Error in chapter:", error.message);
        return { mangaSlug, chapterSlug, chapters: [] };
    }
};


module.exports = {
    latest,
    all,
    info,
    chapter,
};
