const cheerio = require('cheerio');
const axios = require('axios');

// --- KONFIGURASI GLOBAL (Anti-Bot) ---
const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://manga18fx.com/'
    }
};

const BASE_URL = 'https://manga18fx.com';

// --- 1. FUNGSI latest(page) (UPDATE TERBARU) ---
async function latest(page) {
    let m_list = []
    try{
        res = await axios.get(`${BASE_URL}/page/${page}`, axiosConfig) 
        const body = await res.data;
        const $ = cheerio.load(body)

        const listContainer = $('.listupd'); 
        
        listContainer.find('.bsx-item').each((index, element) => { 
            $elements = $(element)
            
            url = $elements.find('a').attr('href')
            image = $elements.find('img').attr('src')
            title = $elements.find('a').attr('title') 
            rating = $elements.find('.numscore').text().trim() 

            chapter_items = $elements.find('.epxs a'); 

            let chapters = []
            
            $(chapter_items).each((i,e)=>{
                let c_title = $(e).text().trim()
                let c_url = $(e).attr('href')
                let c_date = $(e).parent().find('span').text().trim()

                chapters.push({
                    'c_title': c_title,
                    'c_url': c_url,
                    'c_date': c_date,
                    'status': null 
                })
            })

            m_list.push({'title': title, 'rating': rating, 'image': image, 'url': url, 'chapters': chapters})    
        })

        let current = $('.pagination .current').text()
        let last_page_link = $('.pagination .last a').attr('href')
        
        let last_page = current;
        if (last_page_link) {
            const match = last_page_link.match(/page\/(\d+)/);
            if (match) {
                last_page = match[1];
            }
        }
        
         return await ({
             'p_title': 'Latest Updates',
             'list': m_list,
             'current_page': parseInt(current),
             'last_page': parseInt(last_page)
         })
     } catch (error) {
         return await ({'error': 'Sorry dude, an error occured! No Latest!'})
     }
}

// --- 2. FUNGSI all(page) (DAFTAR GENRE/KATEGORI) ---
async function all(page) {
    let m_list = []
    try{
        // URL Genre/Kategori
        res = await axios.get(`${BASE_URL}/manga-genre/manhwa/${page}`, axiosConfig) 
        const body = await res.data;
        const $ = cheerio.load(body)

        const listContainer = $('.listupd'); 
        
        // Selektor sama dengan latest
        listContainer.find('.bsx-item').each((index, element) => { 
            $elements = $(element)
            
            url = $elements.find('a').attr('href')
            image = $elements.find('img').attr('src')
            title = $elements.find('a').attr('title') 
            rating = $elements.find('.numscore').text().trim() 

            chapter_items = $elements.find('.epxs a'); 

            let chapters = []
            
            $(chapter_items).each((i,e)=>{
                let c_title = $(e).text().trim()
                let c_url = $(e).attr('href')
                let c_date = $(e).parent().find('span').text().trim()

                chapters.push({'c_title': c_title, 'c_url': c_url, 'c_date': c_date, 'status': null})
            })

            m_list.push({'title': title, 'rating': rating, 'image': image, 'url': url, 'chapters': chapters})    
        })

        // Logika Pagination sama
        let current = $('.pagination .current').text()
        let last_page_link = $('.pagination .last a').attr('href')
        
        let last_page = current;
        if (last_page_link) {
            const match = last_page_link.match(/\/(\d+)\/?$/); 
            if (match) {
                last_page = match[1];
            }
        }
        
         return await ({
             'p_title': 'Manhwa Genre List',
             'list': m_list,
             'current_page': parseInt(current),
             'last_page': parseInt(last_page)
         })
     } catch (error) {
         return await ({'error': 'Sorry dude, an error occured! No Genre List!'})
     }
}

// --- 3. FUNGSI info(slug) (DETAIL MANHWA) ---
async function chapter(manga, chapter) {
    let ch_list = []
    try{
        // URL Chapter
        res = await axios.get(`${BASE_URL}/manga/${manga}/${chapter}`, axiosConfig)
        const body = await res.data;
        const $ = cheerio.load(body)

        // Selektor Gambar Chapter (umumnya .reading-content img)
        $('.reading-content img').each((index, element) => {
            $elements = $(element)
            // Mengambil src atau data-src
            image = $elements.attr('src') ? $elements.attr('src').trim() : $elements.attr('data-src').trim() 

            if (image && !image.includes('advertisement') && !image.includes('ads')) { // Filter iklan
                ch_list.push({'ch': image}) 
            }
        })

        // --- NAVIGASI DAN JUDUL ---
        let manga_title = $('.breadcrumb > li:nth-child(2) > a').text().trim();
        let manga_url = $('.breadcrumb > li:nth-child(2) > a').attr('href');
        
        let current_ch = $('#chapter-heading').text().trim();
        
        // Navigasi
        let prev = $('.nav-links .prev-link a').attr('href');
        let next = $('.nav-links .next-link a').attr('href');
        

        return await ({
            'manga': manga_title,
            'manga_url': manga_url,
            'current_ch': current_ch,
            'chapters': ch_list,
            'nav': [{'prev': prev, 'next': next}]
        })
     } catch (error) {
         return await ({'error': 'Sorry dude, an error occured! No Chapter Images!'})
     }
}

// --- 4. FUNGSI chapter(manga, chapter) (GAMBAR CHAPTER) ---
async function chapter(manga, chapter) {
    let ch_list = []
    try{
        // URL Chapter
        res = await axios.get(`${BASE_URL}/manga/${manga}/${chapter}`, axiosConfig)
        const body = await res.data;
        const $ = cheerio.load(body)

        // Selektor Gambar Chapter (umumnya .reading-content img)
        $('.reading-content img').each((index, element) => {
            $elements = $(element)
            // Cek apakah menggunakan 'src' atau 'data-src'
            image = $elements.attr('src') ? $elements.attr('src').trim() : $elements.attr('data-src').trim() 

            if (image) {
                ch_list.push({'ch': image}) 
            }
        })

        // --- NAVIGASI DAN JUDUL ---
        let manga_title = $('.breadcrumb > li:nth-child(2) > a').text().trim();
        let manga_url = $('.breadcrumb > li:nth-child(2) > a').attr('href');
        
        let current_ch = $('#chapter-heading').text().trim();
        
        let prev = $('.nav-links .prev-link a').attr('href');
        let next = $('.nav-links .next-link a').attr('href');
        

        return await ({
            'manga': manga_title,
            'manga_url': manga_url,
            'current_ch': current_ch,
            'chapters': ch_list,
            'nav': [{'prev': prev, 'next': next}]
        })
     } catch (error) {
         return await ({'error': 'Sorry dude, an error occured! No Chapter Images!'})
     }

}

module.exports = {
    latest,
    all,
    info,
    chapter
}


