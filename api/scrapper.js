const cheerio = require('cheerio');
const axios = require('axios');

const domain = 'https://hiperdex.com';

// Header Default untuk mencegah 403 Forbidden dan meningkatkan stabilitas
const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
    },
    timeout: 10000 // Menambah timeout jaringan (10 detik)
};

// --- Fungsi untuk mendapatkan detail manhwa (info) ---
async function info(slug) {
    let genres = [];
    let chapters = [];

    try{
        // Menggunakan axiosConfig untuk request yang lebih andal
        const res = await axios.get(`${domain}/manga/${slug}`, axiosConfig);
        const body = res.data;
        const $ = cheerio.load(body);

        let manhwa_title = $('.post-title > h1:nth-child(1)').text().trim();
        // Menggunakan selector yang lebih umum dan fallback untuk lazy-loading
        let poster = $('.summary_image img').attr('src') || $('.summary_image img').attr('data-src'); 
        let author = $('.author-content a').text().trim();
        let artist = $('.artist-content a').text().trim();

        let genres_e = $('.genres-content a');
        
        $(genres_e).each((i,e)=>{
            genres.push($(e).text().trim());
        });

        let other_name = $('div.post-content_item:nth-child(5) > div:nth-child(2)').text().trim();
        let status = $('div.post-content_item:nth-child(2) > div:nth-child(2)').text().trim();
        let description = $('.description-summary > p').text().trim() || $('.description-summary').text().trim(); // Memperkuat selector deskripsi
        
        // Memanggil chaptersList untuk mendapatkan daftar chapter
        chapters = await chaptersList(`${domain}/manga/${slug}/ajax/chapters/`);

        return {
            'page': manhwa_title,
            'other_name': other_name,
            'poster': poster,
            'authors': author,
            'artists': artist,
            'genres': genres,
            'status': status,
            'description': description,
            'ch_list': chapters // Mengubah dari ch_list menjadi 'ch_list': chapters
        };
     } catch (error) {
        console.error(`Scraper Error (info): ${error.message}`);
        return {'error': 'Sorry dude, an error occured! No Info!'};
     }
}

// --- Fungsi untuk mendapatkan daftar chapter (melalui AJAX POST) ---
async function chaptersList(url){
    let ch_list = [];

    try{
        // Menggunakan axiosConfig untuk request POST
        const res = await axios.post(url, {}, axiosConfig); // Mengirim body kosong untuk POST AJAX
        const body = res.data;
        const $ = cheerio.load(body);

        $('.version-chap li').each((index, element) => {
            const $elements = $(element);
            const title = $elements.find('a').text().trim();
            const url = $elements.find('a').attr('href');
            const time = $elements.find('.chapter-release-date').find('i').text();
            // Status di sini seringkali adalah null, tidak apa-apa
            const status = $elements.find('.chapter-release-date').find('a').attr('title');

            const chapters = {'ch_title': title, 'time': time, 'status': status, 'url': url};

            ch_list.push(chapters);    
        });

        return ch_list;
    } catch(error) {
        console.error(`Scraper Error (chaptersList): ${error.message}`);
        // Mengembalikan array kosong jika gagal, daripada string error, agar struktur data tetap konsisten
        return []; 
    }
}

// --- Fungsi untuk mendapatkan daftar semua manhwa ---
async function all(page) {
    let m_list = [];

    try{
        // Menggunakan axiosConfig
        const res = await axios.get(`${domain}/mangalist/page/${page}`, axiosConfig);
        const body = res.data;
        const $ = cheerio.load(body);

        let p_title = $('.c-blog__heading h1').text().trim();

        // Selector utama diperkuat: menggunakan class umum .page-item-detail untuk data
        $('#loop-content .page-item-detail').each((index, element) => {
            const $elements = $(element).parent(); // Pindah ke parent untuk menangkap badge-pos-2 jika diperlukan
            
            const image = $elements.find('img').attr('src') || $elements.find('img').attr('data-src'); // Fallback gambar
            const url = $elements.find('.post-title a').attr('href');
            const title = $elements.find('.post-title h3').text().trim();
            const rating = $elements.find('.total_votes').text().trim();

            const chapterItems = $elements.find('.list-chapter .chapter-item');
            let chapters = [];
            
            $(chapterItems).each((i,e)=>{
                let c_title = $(e).find('a').text().trim();
                let c_url = $(e).find('a').attr('href');
                let c_date = $(e).find('.post-on').text().trim();
                let status = $(e).find('.post-on a').attr('title');

                chapters.push({
                    'c_title': c_title,
                    'c_url': c_url,
                    'c_date': c_date,
                    'status': status
                });
            });

            m_list.push({
                'title': title,
                'rating': rating,
                'image': image,
                'url': url,
                'chapters': chapters
            });    
        });

        let current = $('.current').text();
        let last_page_url = $('.last').attr('href');
        let last_page = current;

        // Memperbaiki logika penentuan last_page
        if (last_page_url) {
             const match = last_page_url.match(/page\/(\d+)/);
             if (match) {
                 last_page = match[1];
             }
        }
        
        return {
            'p_title': p_title,
            'list': m_list,
            'current_page': parseInt(current) || 1,
            'last_page': parseInt(last_page) || 1
        };
    } catch (error) {
        console.error(`Scraper Error (all): ${error.message}`);
        return {'error': 'Sorry dude, an error occured! No Latest!'};
    }
}

// --- Fungsi untuk mendapatkan daftar terbaru ---
// Menggunakan logika yang sama dengan all(page), tetapi dengan URL berbeda
async function latest(page) {
    let m_list = [];

    try{
        // URL terbaru
        const res = await axios.get(`${domain}/page/${page}`, axiosConfig); 
        const body = res.data;
        const $ = cheerio.load(body);

        let p_title = $('.c-blog__heading h1').text().trim();

        // Selector utama diperkuat
        $('#loop-content .page-item-detail').each((index, element) => {
            const $elements = $(element).parent();
            
            const image = $elements.find('img').attr('src') || $elements.find('img').attr('data-src');
            const url = $elements.find('.post-title a').attr('href');
            const title = $elements.find('.post-title h3').text().trim();
            const rating = $elements.find('.total_votes').text().trim();

            const chapterItems = $elements.find('.list-chapter .chapter-item');
            let chapters = [];
            
            $(chapterItems).each((i,e)=>{
                let c_title = $(e).find('a').text().trim();
                let c_url = $(e).find('a').attr('href');
                let c_date = $(e).find('.post-on').text().trim();
                let status = $(e).find('.post-on a').attr('title');

                chapters.push({
                    'c_title': c_title,
                    'c_url': c_url,
                    'c_date': c_date,
                    'status': status
                });
            });

            m_list.push({
                'title': title,
                'rating': rating,
                'image': image,
                'url': url,
                'chapters': chapters
            });    
        });

        let current = $('.current').text();
        let last_page_url = $('.last').attr('href');
        let last_page = current;
        
        if (last_page_url) {
             const match = last_page_url.match(/page\/(\d+)/);
             if (match) {
                 last_page = match[1];
             }
        }

        return {
            'p_title': p_title,
            'list': m_list,
            'current_page': parseInt(current) || 1,
            'last_page': parseInt(last_page) || 1
        };
    } catch (error) {
        console.error(`Scraper Error (latest): ${error.message}`);
        return {'error': 'Sorry dude, an error occured! No Latest!'};
    }
}

// --- Fungsi untuk mendapatkan gambar chapter ---
async function chapter(manga, chapter) {
    let ch_list = [];

    try{
        // Menggunakan axiosConfig
        const res = await axios.get(`${domain}/manga/${manga}/${chapter}`, axiosConfig);
        const body = res.data;
        const $ = cheerio.load(body);

        // Selector diperkuat: mencari 'src' atau 'data-src' di elemen gambar
        $('.read-container img').each((index, element) => {
            const $elements = $(element);
            // Fallback untuk lazy loading
            const image = $elements.attr('src') || $elements.attr('data-src');

            if (image && image.trim()) { // Pastikan URL tidak kosong
                 ch_list.push({'ch': image.trim()});
            }
        });

        let manga_title = $('#chapter-heading').text().trim();
        let manga_url = $('.breadcrumb > li:nth-child(2) > a:nth-child(1)').attr('href');
        let current_ch = $('.active').text().trim();
        let prev = $('.prev_page').attr('href');
        let next = $('.next_page').attr('href');
        
        return {
            'manga': manga_title,
            'manga_url': manga_url,
            'current_ch': current_ch,
            'chapters': ch_list,
            'nav':[{
                'prev': prev,
                'next': next
            }]
        };
     } catch (error) {
        console.error(`Scraper Error (chapter images): ${error.message}`);
        return {'error': 'Sorry dude, an error occured! No Chapter Images!'};
     }
}

module.exports = {
    latest: latest, // Perbaiki penamaan
    all: all,
    info: info,
    chapter: chapter
};

