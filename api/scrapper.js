const axios = require('axios');
const cheerio = require('cheerio');
const IMAGE_PROXY_URL = 'https://image-proxy.fuadkhalish098.workers.dev/'; 
const BASE_URL = 'https://manga18fx.com';
const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': BASE_URL,
    },
    
    timeout: 8000 
};


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
    if (!imageUrl || typeof imageUrl !== 'string') return '';
    return IMAGE_PROXY_URL + encodeURIComponent(imageUrl);
};


const listScraper = async (endpoint, page) => {
   
    const url = endpoint === 'latest' ? `${BASE_URL}/page/${page}` : `${BASE_URL}/manga-list/${page}`; 
    
    try {
        const res = await axios.get(url, axiosConfig);

        // Pengamanan 1: Jika respons mencurigakan (Anti-bot/Empty)
        if (!res.data || res.data.length < 1000 || res.data.includes("challenge page")) {
            console.warn(`[SCRAPER WARNING] Suspicious response from ${url}`);
            return { p_title: 'Error: Anti-Bot/Empty Response', list: [] };
        }
        
        const $ = cheerio.load(res.data);
        const list = [];
        
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
        return { p_title: 'Fatal Error Scraping', list: [] }; 
    }
};

const latest = (page) => listScraper('latest', page);
const all = (page) => listScraper('all', page);


const info = async (slug) => {
    const url = `${BASE_URL}/manga/${slug}`;
    try {
        const res = await axios.get(url, axiosConfig);
        
        if (!res.data || res.data.length < 1000 || res.data.includes("challenge page")) {
            return { error: 'Failed to load info: Anti-Bot/Empty Response' };
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
        

        const status = $('.post-content_item:contains("Status") .summary-content').text().trim() || 'N/A';
        const rating = $('.post-content_item .numscore').text().trim() || '0.0';


        return {
            page: $('.post-title h1').text().trim(),
            other_name: $('.post-title .alternative-title').text().trim() || '',
            poster: getProxyUrl(posterUrl), 
            description: $('.summary__content .wp-content p').text().trim() || $('.summary__content').text().trim() || 'No description available.',
            rating: rating,
            status: status,
            genres: genres,
            ch_list: chapters.reverse(), // Chapter terbaru di bagian atas
        };
    } catch (error) {
        console.error("Error in info:", error.message);
        return { error: 'Failed to load info due to server error.' };
    }
}

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
