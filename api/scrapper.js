const cheerio = require('cheerio');
const axios = require('axios');

// Konfigurasi Header Global (Sangat Penting untuk menghindari pemblokiran Anti-Bot)
const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://hiperdex.com/' // Referer ditambahkan untuk Ajax/Post request
    }
};

// --- Fungsi chaptersList (Dukungan Ajax POST) ---
async function chaptersList(url){
    let ch_list = []

    try{
        // PERBAIKAN: Menggunakan axios.post dengan config
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
    } catch (error) {
     // AKTIFKAN INI UNTUK MELIHAT PESAN ERROR ASLI DARI AXIOS
     console.error("Gagal saat mengambil Info:", error.message); 
     // Jika error adalah respons HTTP, coba log statusnya:
     // console.error("Kode Status:", error.response.status); 
     return await ({'error': 'Sorry dude, an error occured! No Info!'})
 }
}

// --- Fungsi info(slug) (Detail Manhwa) ---
async function info(slug) {
    let genres = [];
    let ch_list = [];

    try{
        // Panggil halaman info dengan header yang sudah terbukti berhasil
        res = await axios.get(`https://manga18fx.com/manga/${slug}`, axiosConfig);
        const body = await res.data;
        const $ = cheerio.load(body);

        // --- 1. DATA DETAIL MANGA ---
        let manhwa_title = $('.post-title h1').text().trim();
        // Cek: Beberapa situs menggunakan data-src, tapi di sini terlihat menggunakan src
        let poster = $('.summary_image img').attr('src'); 
        
        // Penulis dan Artis menggunakan selektor yang sama, hanya di konteks yang berbeda
        let author = $('.author-content a').text().trim();
        let artist = $('.artist-content a').text().trim();

        // Nama Alternatif (menggunakan struktur div ke-2)
        // NOTE: Ini masih rentan, lebih baik cari berdasarkan label 'Alternative'
        let other_name = $('.summary_content > div:nth-child(2)').text().trim().replace('Alternative:', '').trim(); 
        
        // Status
        let status = $('.post-status .post-content_item:nth-child(2) div:nth-child(2)').text().trim(); // Memerlukan penyesuaian untuk mendapatkan hanya nilai status

        // Deskripsi (Tidak ada di screenshot, tapi menggunakan selektor umum)
        // Jika ini gagal, cek class HTML deskripsi di situs
        let description = $('.description-summary .summary__content').text().trim(); 

        // --- 2. GENRES ---
        let genres_e = $('.genres-content a');
        $(genres_e).each((i,e)=>{
            genres.push($(e).text().trim());
        });

        // --- 3. CHAPTER LIST (Ambil Langsung dari HTML) ---
        // Kontainer daftar chapter
        $('.listing-chapters_wrap li').each((index, element) => {
            $elements = $(element);
            
            // Cek struktur list chapter
            let title = $elements.find('a').text().trim(); 
            let url = $elements.find('a').attr('href');
            let time = $elements.find('.chapter-release-date').text().trim(); 
            
            // Masukkan ke array ch_list
            ch_list.push({
                'ch_title': title, 
                'time': time, 
                'url': url
            });    
        });
        
        // Balik urutan chapter agar yang terbaru di atas (optional, tergantung preferensi)
        ch_list.reverse();


        return await ({
            'page': manhwa_title,
            'other_name': other_name,
            'poster': poster,
            'authors': author,
            'artists': artist,
            'genres': genres,
            'status': status,
            'description': description,
            'ch_list': ch_list 
        });

    } catch (error) {
         // console.error(error); // Aktifkan untuk debugging
         return await ({'error': 'Sorry dude, an error occured! No Info!'});
    }

}

// --- Fungsi all(page) (Daftar A-Z) ---
async function all(page) {

    let m_list = []

    try{
        // URL Diperbaiki: Menggunakan format Genre/Kategori dengan nomor halaman
        res = await axios.get(`https://manga18fx.com/manga-genre/manhwa/${page}`, axiosConfig) 
        const body = await res.data;
        const $ = cheerio.load(body)

        // Kontainer Utama: Sama dengan latest
        const listContainer = $('.listupd'); 
        
        // SELEKTOR PERULANGAN: Item manga adalah .bsx-item
        listContainer.find('.bsx-item').each((index, element) => { 

            $elements = $(element)
            
            // --- DATA MANGA (Sama dengan latest) ---
            url = $elements.find('a').attr('href')
            image = $elements.find('img').attr('src')
            title = $elements.find('a').attr('title') 
            rating = $elements.find('.numscore').text().trim() 

            // --- DATA CHAPTER TERBARU (Sama dengan latest) ---
            chapter_items = $elements.find('.epxs a'); 

            let chapters = []
            
            $(chapter_items).each((i,e)=>{

                let c_title = $(e).text().trim()
                let c_url = $(e).attr('href')
                // Tanggal ada di elemen <span> di dalam .epxs
                let c_date = $(e).parent().find('span').text().trim()

                chapters.push({
                    'c_title': c_title,
                    'c_url': c_url,
                    'c_date': c_date,
                    'status': null 
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

        // --- DATA PAGINATION ---
        // Mencari pagination
        let current = $('.pagination .current').text()
        let last_page_link = $('.pagination .last a').attr('href')
        
        let last_page = current;
        if (last_page_link) {
            // Logika untuk mendapatkan nomor halaman terakhir dari link genre
            const match = last_page_link.match(/\/(\d+)\/?$/); // Mencari angka di akhir URL
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
         // console.error(error); 
         return await ({'error': 'Sorry dude, an error occured! No Genre List!'})
     }

}

// --- Fungsi latest(page) (Baru Diperbarui) ---
async function latest(page) {

    let m_list = []

    try{
        // URL BARU
        res = await axios.get(`https://manga18fx.com/page/${page}`, axiosConfig) 
        const body = await res.data;
        const $ = cheerio.load(body)

        // Selektor Kontainer Utama Daftar Manga adalah .listupd
        const listContainer = $('.listupd');

        // SELEKTOR PERULANGAN: Setiap item manga adalah .bsx-item
        listContainer.find('.bsx-item').each((index, element) => {

            $elements = $(element)
            
            // --- 1. DATA MANGA ---
            // URL ada di <a> pertama
            url = $elements.find('a').attr('href')
            
            // Image ada di dalam <img> (Cek: biasanya menggunakan 'src' atau 'data-src')
            image = $elements.find('img').attr('src')
            
            // Judul ada di atribut 'title' dari <a> atau di class .tt (kita coba dari title)
            title = $elements.find('a').attr('title') 
            
            // Rating tidak terlihat jelas di screenshot, menggunakan class umum:
            rating = $elements.find('.numscore').text().trim() 

            // --- 2. DATA CHAPTER TERBARU ---
            // Chapter list ada di dalam .epxs
            chapter_items = $elements.find('.epxs a'); 

            let chapters = []
            
            // Perulangan untuk chapter terbaru
            $(chapter_items).each((i,e)=>{

                let c_title = $(e).text().trim() // Teks adalah judul chapter
                let c_url = $(e).attr('href')
                
                // Tanggal ada di elemen <span> di dalam .epxs
                let c_date = $(e).parent().find('span').text().trim()

                chapters.push({
                    'c_title': c_title,
                    'c_url': c_url,
                    'c_date': c_date,
                    'status': null // Status dihilangkan karena tidak ditemukan di sini
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

        // --- 3. DATA PAGINATION ---
        // Mencari pagination di bawah daftar
        let current = $('.pagination .current').text()
        let last_page_link = $('.pagination .last a').attr('href')
        
        // Logika untuk mendapatkan nomor halaman terakhir
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
         // Aktifkan ini jika error muncul, untuk melihat status/pesan error sebenarnya
         // console.error(error); 
         return await ({'error': 'Sorry dude, an error occured! No Latest!'})
     }

}

// --- Fungsi chapter(manga, chapter) (Gambar Chapter) ---
async function chapter(manga,chapter) {

    let ch_list = []

    try{
        // PERBAIKAN: Menggunakan axios.get dengan config
        res = await axios.get(`https://hiperdex.com/manga/${manga}/${chapter}`, axiosConfig)
        const body = await res.data;
        const $ = cheerio.load(body)

        $('.read-container img').each((index, element) => {

            $elements = $(element)
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





