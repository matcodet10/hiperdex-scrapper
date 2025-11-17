// scrapper.js (Final Code dengan Fallback LENGKAP)

const axios = require('axios');
const cheerio = require('cheerio');

// 🔥 WAJIB DIGANTI: Domain Cloudflare Worker Anda
const PROXY_WORKER_DOMAIN = 'https://image-proxy.fuadkhalish098.workers.dev/'; 
const BASE_URL = 'https://manga18fx.com'; // Digunakan sebagai fallback URL

const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': BASE_URL, 
    },
    timeout: 10000 
};

// --- Fungsi Pembantu ---
const getSlug = (url) => {
    try {
        if (!url) return '';
        const parts = new URL(url).pathname.split('/').filter(e => e);
        // Mengambil slug terakhir dari URL path
        const slug = parts.filter(p => p !== 'manga' && p !== 'page')[parts.length - 1]; 
        return slug || '';
    } catch (e) {
        return '';
    }
};

const getProxyUrl = (imageUrl) => {
    // getProxyUrl sekarang memanggil Worker untuk gambar
    if (!imageUrl || typeof imageUrl !== 'string') return '';
    return PROXY_WORKER_DOMAIN + '/img-proxy?url=' + encodeURIComponent(imageUrl);
};

// --- Fungsi Universal untuk Fetching HTML dengan Fallback ---

const fetchHtmlWithFallback = async (path) => {
    // 1. Coba Panggil Cloudflare Worker
    let urlToFetch = PROXY_WORKER_DOMAIN + path; 
    let res;
    let isWorkerActive = true;

    try {
        res = await axios.get(urlToFetch, axiosConfig);
    } catch (workerError) {
        // Jika Worker gagal (Network Error), gunakan fallback ke situs asli
        console.warn(`[WORKER DOWN] Gagal menghubungi Worker untuk ${path}: ${workerError.message}. Menggunakan Fallback URL.`);
        isWorkerActive = false;
        urlToFetch = BASE_URL + path; 
        
        try {
            // 2. Panggil Langsung BASE_URL (Fallback)
            res = await axios.get(urlToFetch, axiosConfig);
        } catch (fallbackError) {
            console.error(`[FATAL ERROR] Fallback ke BASE_URL juga gagal untuk ${path}: ${fallbackError.message}`);
            // Melempar error untuk ditangkap oleh fungsi pemanggil (listScraper/info/chapter)
            throw new Error(`Network failure on both Worker and Fallback URL: ${fallbackError.message}`); 
        }
    }
    
    // 3. Pemeriksaan Anti-Bot
    if (res.data.includes("Anti-Bot Detected") || res.data.length < 1000 || res.data.includes("challenge page")) {
        console.warn(`[SCRAPER WARNING] Anti-Bot/Empty response dari ${isWorkerActive ? 'Worker' : 'Fallback'} untuk ${path}`);
        throw new Error("Anti-Bot protection triggered or empty response received.");
    }
    
    // Jika berhasil scraping dari fallback, beri peringatan
    if (!isWorkerActive) {
        console.warn(`[SCRAPING SUCCESS] Berhasil menggunakan Fallback URL untuk ${path}.`);
    }

    return res.data; // Mengembalikan data HTML
};


// --- Fungsi Utama: Latest dan All ---

const listScraper = async (endpoint, page) => {
    const path = endpoint === 'latest' ? `/page/${page}` : `/manga-list/${page}`; 
    
    try {
        const html = await fetchHtmlWithFallback(path);
        
        const $ = cheerio.load(html);
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
        console.error(`Critical Scraping Error in ${endpoint}:`, error.message);
        // Memberikan pesan yang lebih deskriptif
        return { p_title: 'Fatal Error Scraping (Network Down or Selector Gagal)', list: [] }; 
    }
};

const latest = (page) => listScraper('latest', page);
const all = (page) => listScraper('all', page);


// --- Fungsi Utama: Manhwa Info (Detail) ---
const info = async (slug) => {
    const path = `/manga/${slug}`;
    try {
        const html = await fetchHtmlWithFallback(path);
        const $ = cheerio.load(html);
        
        const posterUrl = $('.summary_image img').attr('src');
        const chapters = [];
        
        // Memastikan chapter list diambil
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
            page: $('.post-title h1').text().trim() || slug,
            poster: getProxyUrl(posterUrl), 
            description: $('.summary__content .wp-content p').text().trim() || 'No description available.',
            rating: rating,
            genres: genres,
            ch_list: chapters.reverse(),
        };
    } catch (error) {
        console.error("Error in info:", error.message);
        return { error: 'Failed to load info: Network/Anti-Bot Blocked.' };
    }
}

// --- Fungsi Utama: Chapter Images ---
const chapter = async (mangaSlug, chapterSlug) => {
    const path = `/manga/${mangaSlug}/${chapterSlug}`;
    
    try {
        const html = await fetchHtmlWithFallback(path);
        const $ = cheerio.load(html);
        const chapters = [];
        
        $('.read-manga img').each((i, el) => {
            const imageSrc = $(el).attr('src') || $(el).attr('data-src');

            if (imageSrc) {
                chapters.push({
                    ch: getProxyUrl(imageSrc), 
                });
            }
        });
        
        if (chapters.length === 0) {
            console.warn(`[CHAPTER WARNING] 0 images found for ${path}. Selector may be wrong.`);
        }

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
