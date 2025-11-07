const cheerio = require('cheerio');
const axios = require('axios');

async function info(slug) {
    let genres = []

    try{
        res = await axios.get(`https://hiperdex.com/manga/${slug}`)
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
        return await ({'error': 'Sorry dude, an error occured! No Info!'})
     }

}

async function chaptersList(url){
    let ch_list = []

    try{
        res = await axios.post(url)
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
        return await ('Error Getting Chapters!')
    }
}

async function all(page) {

    let m_list = []

    try{
        res = await axios.get(`https://hiperdex.com/mangalist/page/${page}`)
        const body = await res.data;
        const $ = cheerio.load(body)

        let p_title = $('.c-blog__heading h1').text().trim()

        $('#loop-content .badge-pos-2').each((index, element) => {

                $elements = $(element)
                image = $elements.find('.page-item-detail').find('img').attr('src')
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
        return await ({'error': 'Sorry dude, an error occured! No Latest!'})
     }

}

async function latest(page) {

    let m_list = []

    try{
        res = await axios.get(`https://hiperdex.com/page/${page}`)
        const body = await res.data;
        const $ = cheerio.load(body)

        let p_title = $('.c-blog__heading h1').text().trim()

        $('#loop-content .badge-pos-2').each((index, element) => {

                $elements = $(element)
                image = $elements.find('.page-item-detail').find('img').attr('src')
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
        return await ({'error': 'Sorry dude, an error occured! No Latest!'})
     }

}


async function chapter(manga,chapter) {

    let images = [] 

    try{
        // 1. Ambil halaman chapter
        const url = `https://hiperdex.com/manga/${manga}/${chapter}`;
        const res = await axios.get(url, {
             // Menambahkan header dasar untuk menghindari deteksi bot
             headers: {
                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                 'Referer': url
             }
        });
        const body = await res.data;
        const $ = cheerio.load(body)

        // 2. Loop melalui semua tag img di read-container
        $('.read-container img').each((index, element) => {

            $elements = $(element)
            
            // Coba ambil URL dari 'data-src' (umum untuk lazy loading), jika tidak ada, ambil dari 'src'
            const image_url = $elements.attr('data-src')?.trim() || $elements.attr('src')?.trim();
            
            // --- LOGIKA PENGAMBILAN DIMENSI YANG LEBIH LUAS ---
            let original_width = 0;
            let original_height = 0;

            // Coba dari atribut 'width'/'height' standar
            original_width = parseInt($elements.attr('width')) || 0;
            original_height = parseInt($elements.attr('height')) || 0;

            // Jika masih 0, coba dari data-width / data-height (alternatif populer)
            if (original_width === 0) {
                 original_width = parseInt($elements.attr('data-width')) || 0;
            }
            if (original_height === 0) {
                 original_height = parseInt($elements.attr('data-height')) || 0;
            }
            
            // Fallback: Jika gambar sangat panjang, beri nilai default aman untuk di-tiling
            // Jika width > 0 tapi height 0, set height menjadi 50000 (maksimum perkiraan)
            if (original_width > 0 && original_height === 0) {
                original_height = 50000;
            } else if (original_width === 0) {
                // Jika width juga 0, set default width yang sering digunakan (misal 800)
                original_width = 800;
                original_height = 50000;
            }
            // ---------------------------------------------------
            
            if (image_url) {
                images.push({
                    'url': image_url, 
                    'width': original_width, 
                    'height': original_height 
                })    
            }
        })

        // 3. Metadata dan Navigasi (tetap sama)
        let manga_title = $('#chapter-heading').text().trim()
        let manga_url = $('.breadcrumb > li:nth-child(2) > a:nth-child(1)').attr('href')
        let current_ch = $('.active').text().trim()
        let prev = $('.prev_page').attr('href')
        let next = $('.next_page').attr('href')
        

        return await ({
            'manga': manga_title,
            'manga_url': manga_url,
            'current_ch': current_ch,
            'images': images, // Mengembalikan daftar gambar dengan dimensi
            'nav':[{
                'prev': prev,
                'next': next
            }]
        })
    } catch (error) {
        // Logging error yang lebih baik
        console.error('Scrapper Chapter Error:', error.message); 
        return await ({'error': 'Sorry dude, an error occured! No Chapter Images!'})
    }
}

module.exports = {
	latest,
    all,
    info,
    chapter
}


