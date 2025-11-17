const cheerio = require('cheerio');
const axios = require('axios');

// Konfigurasi Header untuk mengatasi pemblokiran anti-bot (Sangat Penting)
const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://hiperdex.com/' // Menambahkan Referer untuk Ajax/Post request
    }
};

// --- Fungsi chaptersList (Dukungan Ajax POST) ---
async function chaptersList(url){
    let ch_list = []

    try{
        // Menggunakan axios.post dengan config
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
        // console.log(error); // Aktifkan ini untuk debugging
        return await ('Error Getting Chapters!')
    }
}

// --- Fungsi info(slug) (Detail Manhwa) ---
async function info(slug) {
    let genres = []

    try{
        // Menggunakan axios.get dengan config
        res = await axios.get(`https://hiperdex.com/manga/${slug}`, axiosConfig)
        const body = await res.data;
        const $ = cheerio.load(body)

        let manhwa_title = $('.post-title > h1:nth-child(1)').text().trim()
        let poster = $('.summary_image img').attr('src')
        let author = $('.author-content a').text().trim()
        let artist = $('.artist-content a').text().trim()

        let genres_e = $('.genres-content a')
        
        $(genres_e).each((i,e)=>{
            genres.push($(e).text().trim())
        })

        // NOTE: Selektor posisi (nth-child) dipertahankan, tapi berisiko
        let other_name = $('div.post-content_item:nth-child(5) > div:nth-child(2)').text().trim()
        let status = $('div.post-content_item:nth-child(2) > div:nth-child(2)').text().trim()
        
        let description = $('.description-summary').text().trim()

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
         // console.log(error); // Aktifkan ini untuk debugging
         return await ({'error': 'Sorry dude, an error occured! No Info!'})
     }

}

// --- Fungsi all(page) (Daftar A-Z) ---
async function all(page) {

    let m_list = []

    try{
        // Perbaikan URL sudah BENAR: /mangalist/?start=${page}
        res = await axios.get(`https://hiperdex.com/mangalist/?start=${page}`, axiosConfig)
        const body = await res.data;
        const $ = cheerio.load(body)

        let p_title = $('.c-blog__heading h1').text().trim()

        // PERBAIKAN SELEKTOR UTAMA: Kembali ke '.page-listing-item' (lebih aman)
        $('#loop-content .page-listing-item').each((index, element) => {

            $elements = $(element)
            
            // PERBAIKAN SELEKTOR INTERNAL: Lebih spesifik berdasarkan HTML terakhir
            // $elements mengacu pada .page-listing-item

            // Ambil URL/Image dari .item-thumb
            image = $elements.find('.item-thumb img').attr('src')
            url = $elements.find('.item-thumb a').attr('href')
            
            // Ambil Title dari <a> di dalam <h3> di dalam .post-title
            title = $elements.find('.post-title h3 a').text().trim() 
            
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
         // console.log(error); // Aktifkan ini untuk debugging
         return await ({'error': 'Sorry dude, an error occured! No Latest!'})
     }
}

// --- Fungsi latest(page) (Baru Diperbarui) ---
async function latest(page) {

    let m_list = []

    try{
        // URL terbaru masih diasumsikan menggunakan /page/
        res = await axios.get(`https://hiperdex.com/page/${page}`, axiosConfig)
        const body = await res.data;
        const $ = cheerio.load(body)

        let p_title = $('.c-blog__heading h1').text().trim()

        // PERBAIKAN SELEKTOR UTAMA: Kembali ke '.page-listing-item' (lebih aman)
        $('#loop-content .page-listing-item').each((index, element) => {

            $elements = $(element)
            
            // PERBAIKAN SELEKTOR INTERNAL: Sama dengan all(page)
            image = $elements.find('.item-thumb img').attr('src')
            url = $elements.find('.item-thumb a').attr('href')
            title = $elements.find('.post-title h3 a').text().trim() 
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
         // console.log(error); // Aktifkan ini untuk debugging
         return await ({'error': 'Sorry dude, an error occured! No Latest!'})
     }
}

// --- Fungsi chapter(manga, chapter) (Gambar Chapter) ---
async function chapter(manga,chapter) {

    let ch_list = []

    try{
        // Menggunakan axios.get dengan config
        res = await axios.get(`https://hiperdex.com/manga/${manga}/${chapter}`, axiosConfig)
        const body = await res.data;
        const $ = cheerio.load(body)

        $('.read-container img').each((index, element) => {

            $elements = $(element)
            // Mengambil src dari semua tag <img> di dalam .read-container
            image = $elements.attr('src').trim() 

            ch_list.push({'ch': image})    
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
         // console.log(error); // Aktifkan ini untuk debugging
         return await ({'error': 'Sorry dude, an error occured! No Chapter Images!'})
     }

}

module.exports = {
    latest,
    all,
    info,
    chapter
}
