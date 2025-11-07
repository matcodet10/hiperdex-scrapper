const cheerio = require('cheerio');
const axios = require('axios');

// --- Konfigurasi Jaringan Global untuk mengatasi 403 ---
const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
    },
    timeout: 10000 // Timeout 10 detik
};

// --- Fungsi info ---
async function info(slug) {
    let genres = []

    try{
        // Menerapkan axiosConfig
        res = await axios.get(`https://hiperdex.com/manga/${slug}`, axiosConfig)
        const body = await res.data;
        const $ = cheerio.load(body)

        let manhwa_title = $('.post-title > h1:nth-child(1)').text().trim()
        // Perbaikan: Menambahkan fallback data-src
        let poster = $('.summary_image img').attr('src') || $('.summary_image img').attr('data-src') 
        let author = $('.author-content a').text().trim()
        let artist = $('.artist-content a').text().trim()

        let genres_e = $('.genres-content a')
        
        $(genres_e).each((i,e)=>{
            genres.push($(e).text().trim())
        })

        let other_name = $('div.post-content_item:nth-child(5) > div:nth-child(2)').text().trim()
        
        let status = $('div.post-content_item:nth-child(2) > div:nth-child(2)').text().trim()
        
        let description = $('.description-summary').text().trim()

        // Pastikan chaptersList dipanggil dengan benar
        let ch_list = await chaptersList(`https://hiperdex.com/manga/${slug}/ajax/chapters/`)

         return await ({
            'page': manhwa_title,
            'other_name': other_name,
            'poster': poster,
            'authors': author,
            'artists': artist,
            'genres':genres,
            'status': status,
            'description': description,
            ch_list
        })
     } catch (error) {
         console.error(`Scraper Error (info): ${error.message}`);
        return await ({'error': 'Sorry dude, an error occured! No Info!'})
     }

}

// --- Fungsi chaptersList ---
async function chaptersList(url){
    let ch_list = []

    try{
        // Menerapkan axiosConfig pada POST
        res = await axios.post(url, {}, axiosConfig)
        const body = await res.data;
        const $ = cheerio.load(body)

        $('.version-chap li').each((index, element) => {

                $elements = $(element)
                title = $elements.find('a').text().trim()
                url = $elements.find('a').attr('href')
                time = $elements.find('.chapter-release-date').find('i').text()
                status = $elements.find('.chapter-release-date').find('a').attr('title')

                chapters = {'ch_title': title, 'time': time, 'status': status, 'url': url}

                ch_list.push(chapters)     
        })

        return await (ch_list)
    } catch(error) {
         console.error(`Scraper Error (chaptersList): ${error.message}`);
        return await ('Error Getting Chapters!')
    }
}

// --- Fungsi all ---
async function all(page) {

    let m_list = []

    try{
        // Menerapkan axiosConfig
        res = await axios.get(`https://hiperdex.com/mangalist/page/${page}`, axiosConfig)
        const body = await res.data;
        const $ = cheerio.load(body)

        let p_title = $('.c-blog__heading h1').text().trim()

        $('#loop-content .badge-pos-2').each((index, element) => {

                $elements = $(element)
                // Perbaikan: Menambahkan fallback data-src
                image = $elements.find('.page-item-detail').find('img').attr('src') || $elements.find('.page-item-detail').find('img').attr('data-src')
                url = $elements.find('.page-item-detail').find('a').attr('href')
                title = $elements.find('.page-item-detail .post-title').find('h3').text().trim()
                rating = $elements.find('.total_votes').text().trim()

                chapter = $elements.find('.list-chapter .chapter-item')

                let chapters = []
                
                $(chapter).each((i,e)=>{

                    let c_title = $(e).find('a').text().trim()
                    let c_url = $(e).find('a').attr('href')
                    let c_date = $(e).find('.post-on').text().trim()
                    let status = $(e).find('.post-on a').attr('title')

                    chapters.push({
                        'c_title': c_title,
                        'c_url': c_url,
                        'c_date': c_date,
                        'status': status
                    })
                })

                m_list.push({
                    'title': title,
                    'rating': rating,
                    'image': image,
                    'url': url,
                    'chapters': chapters
                })     
        })

        let current = $('.current').text()
        
        let last_page = $('.last').attr('href')
        !last_page?last_page=current:last_page

         return await ({
            'p_title': p_title,
            'list': m_list,
            'current_page': parseInt(current),
            // Menambahkan regEx untuk memastikan hanya angka yang diambil dari URL
            'last_page': parseInt(last_page.replace(/[^0-9]/g, ''))
        })
    } catch (error) {
         console.error(`Scraper Error (all): ${error.message}`);
        return await ({'error': 'Sorry dude, an error occured! No Latest!'})
     }

}

// --- Fungsi latest ---
async function latest(page) {

    let m_list = []

    try{
        // Menerapkan axiosConfig
        res = await axios.get(`https://hiperdex.com/page/${page}`, axiosConfig)
        const body = await res.data;
        const $ = cheerio.load(body)

        let p_title = $('.c-blog__heading h1').text().trim()

        $('#loop-content .badge-pos-2').each((index, element) => {

                $elements = $(element)
                // Perbaikan: Menambahkan fallback data-src
                image = $elements.find('.page-item-detail').find('img').attr('src') || $elements.find('.page-item-detail').find('img').attr('data-src')
                url = $elements.find('.page-item-detail').find('a').attr('href')
                title = $elements.find('.page-item-detail .post-title').find('h3').text().trim()
                rating = $elements.find('.total_votes').text().trim()

                chapter = $elements.find('.list-chapter .chapter-item')

                let chapters = []
                
                $(chapter).each((i,e)=>{

                    let c_title = $(e).find('a').text().trim()
                    let c_url = $(e).find('a').attr('href')
                    let c_date = $(e).find('.post-on').text().trim()
                    let status = $(e).find('.post-on a').attr('title')

                    chapters.push({
                        'c_title': c_title,
                        'c_url': c_url,
                        'c_date': c_date,
                        'status': status
                    })
                })

                m_list.push({
                    'title': title,
                    'rating': rating,
                    'image': image,
                    'url': url,
                    'chapters': chapters
                })     
        })

        let current = $('.current').text()
        
        let last_page = $('.last').attr('href')
        !last_page?last_page=current:last_page

         return await ({
            'p_title': p_title,
            'list': m_list,
            'current_page': parseInt(current),
            'last_page': parseInt(last_page.replace(/[^0-9]/g, ''))
        })
    } catch (error) {
         console.error(`Scraper Error (latest): ${error.message}`);
        return await ({'error': 'Sorry dude, an error occured! No Latest!'})
     }

}


// --- Fungsi chapter ---
async function chapter(manga,chapter) {

    let ch_list = []

    try{
        // Menerapkan axiosConfig
        res = await axios.get(`https://hiperdex.com/manga/${manga}/${chapter}`, axiosConfig)
        const body = await res.data;
        const $ = cheerio.load(body)

        $('.read-container img').each((index, element) => {

                $elements = $(element)
                // Perbaikan: Menambahkan fallback data-src
                image = $elements.attr('src') || $elements.attr('data-src')

                if (image && image.trim()) { // Hanya push jika URL valid
                     ch_list.push({'ch': image.trim()})     
                }
        })

        let manga_title = $('#chapter-heading').text().trim()
        let manga_url = $('.breadcrumb > li:nth-child(2) > a:nth-child(1)').attr('href')
        
        let current_ch = $('.active').text().trim()
        
        let prev = $('.prev_page').attr('href')
        let next = $('.next_page').attr('href')
        

        return await ({
            'manga': manga_title,
            'manga_url':manga_url,
            'current_ch': current_ch,
            'chapters': ch_list,
            'nav':[{
                'prev': prev,
                'next': next
            }]
        })
     } catch (error) {
         console.error(`Scraper Error (chapter): ${error.message}`);
        return await ({'error': 'Sorry dude, an error occured! No Chapter Images!'})
     }

}

// --- Export Modul (Sesuai Struktur Asli) ---
module.exports = {
	latest,
    all,
    info,
    chapter
}
