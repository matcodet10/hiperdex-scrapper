// Scrapper.js (Dideploy di Vercel)

const axios = require('axios');
const cheerio = require('cheerio');

// GANTI DENGAN DOMAIN CLOUDFLARE WORKER ANDA YANG BENAR!
const IMAGE_PROXY_URL = 'https://your-image-proxy-domain.workers.dev/img-proxy?url=';

const BASE_URL = 'https://manga18fx.com';

const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': BASE_URL,
    },
};

// --- Fungsi Pembantu: Mengambil Slug ---
const getSlug = (url) => {
    try {
        const parts = new URL(url).pathname.split('/').filter(e => e);
        // Mengambil slug dari bagian akhir URL path
        return parts.length > 1 ? parts[parts.length - 1] : ''; 
    } catch (e) {
        return '';
    }
};

// --- Fungsi Pembantu: Membuat Proxy URL ---
const getProxyUrl = (imageUrl) => {
    if (!imageUrl) return '';
    // Menggabungkan URL Proxy Worker dengan URL Gambar Asli
    return IMAGE_PROXY_URL + encodeURIComponent(imageUrl);
};

// --- Fungsi Scraping: Latest dan All ---

const listScraper = async (endpoint, page) => {
    const url = `${BASE_URL}/${endpoint}/${page}`;
    
    try {
        const res = await axios.get(url, axiosConfig);
        const $ = cheerio.load(res.data);
        const list = [];
        
        $('.bsx-item').each((i, el) => {
            const $el = $(el);
            const title = $el.find('.tt h2').text().trim();
            const url = $el.find('a').attr('href');
            const image = $el.find('.limit img').attr('src');
            const rating = $el.find('.numscore').text().trim();

            const chapters = [];
            $el.find('.chbox ul li a').each((j, c_el) => {
                chapters.push({
                    c_title: $(c_el).text().trim(),
                    c_url: $(c_el).attr('href'),
                });
            });

            list.push({
                title,
                slug: getSlug(url),
                image: getProxyUrl(image), // PENTING: Menggunakan Proxy URL
                rating,
                chapters: chapters
            });
        });

        return { p_title: `List Manhwa - ${endpoint}`, list };
    } catch (error) {
        console.error(`Error in ${endpoint}:`, error.message);
        return { p_title: 'Error', list: [] };
    }
};

const latest = async (page) => listScraper('page', page);
const all = async (page) => listScraper('manga-list', page); // Sesuaikan dengan endpoint Manga18fx yang sebenarnya jika berbeda

// --- Fungsi Scraping: Info ---
const info = async (slug) => {
    const url = `${BASE_URL}/manga/${slug}`;
    try {
        const res = await axios.get(url, axiosConfig);
        const $ = cheerio.load(res.data);
        
        const posterUrl = $('.summary_image img').attr('src');
        const chapters = [];
        
        // Scraping Chapter List
        $('.version-chap li a').each((i, el) => {
            chapters.push({
                ch_title: $(el).text().trim(),
                url: $(el).attr('href'),
            });
        });

        return {
            page: $('.post-title h1').text().trim(),
            poster: getProxyUrl(posterUrl), // PENTING: Menggunakan Proxy URL
            description: $('.summary__content .wp-content p').text().trim(),
            rating: $('.post-content_item .numscore').text().trim(),
            ch_list: chapters.reverse(), // Chapter terbaru di bagian atas
        };
    } catch (error) {
        console.error("Error in info:", error.message);
        return { error: 'Failed to load info' };
    }
}

// --- Fungsi Scraping: Chapter Images ---
const chapter = async (mangaSlug, chapterSlug) => {
    const url = `${BASE_URL}/manga/${mangaSlug}/${chapterSlug}`;
    
    try {
        const res = await axios.get(url, axiosConfig);
        const $ = cheerio.load(res.data);
        const chapters = [];
        
        $('.read-manga img').each((i, el) => {
            const imageSrc = $(el).attr('src') || $(el).attr('data-src');

            if (imageSrc) {
                chapters.push({
                    ch: getProxyUrl(imageSrc), // PENTING: Menggunakan Proxy URL
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
