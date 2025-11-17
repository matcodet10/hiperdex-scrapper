const cheerio = require('cheerio');
const axios = require('axios');

// --- KONFIGURASI GLOBAL (Anti-Bot) ---
const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Referer': 'https://manga18fx.com/'
    }
};

const BASE_URL = 'https://manga18fx.com';

// ======================================================
// 1. LATEST
// ======================================================
async function latest(page) {
    let m_list = [];

    try {
        const res = await axios.get(`${BASE_URL}/page/${page}`, { headers: axiosConfig.headers });
        const body = res.data;
        const $ = cheerio.load(body);

        const listContainer = $('.listupd');

        listContainer.find('.bsx-item').each((index, element) => {
            const $elements = $(element);

            const url = $elements.find('a').attr('href');
            const image = $elements.find('img').attr('src');
            const title = $elements.find('a').attr('title');
            const rating = $elements.find('.numscore').text().trim();

            const chapter_items = $elements.find('.epxs a');
            let chapters = [];

            chapter_items.each((i, e) => {
                const c_title = $(e).text().trim();
                const c_url = $(e).attr('href');
                const c_date = $(e).parent().find('span').text().trim();

                chapters.push({ c_title, c_url, c_date, status: null });
            });

            m_list.push({ title, rating, image, url, chapters });
        });

        const current = parseInt($('.pagination .current').text() || 1);
        let last_page = current;

        const last_page_link = $('.pagination .last a').attr('href');
        if (last_page_link) {
            const match = last_page_link.match(/page\/(\d+)/);
            if (match) last_page = parseInt(match[1]);
        }

        return {
            p_title: 'Latest Updates',
            list: m_list,
            current_page: current,
            last_page: last_page
        };

    } catch (error) {
        return { error: error.message };
    }
}


// ======================================================
// 2. ALL (genre list)
// ======================================================
async function all(page) {
    let m_list = [];

    try {
        const res = await axios.get(`${BASE_URL}/hot-manga${page}`, { headers: axiosConfig.headers });
        const body = res.data;
        const $ = cheerio.load(body);

        const listContainer = $('.listupd');

        listContainer.find('.bsx-item').each((index, element) => {
            const $elements = $(element);

            const url = $elements.find('a').attr('href');
            const image = $elements.find('img').attr('src');
            const title = $elements.find('a').attr('title');
            const rating = $elements.find('.numscore').text().trim();

            const chapter_items = $elements.find('.epxs a');
            let chapters = [];

            chapter_items.each((i, e) => {
                const c_title = $(e).text().trim();
                const c_url = $(e).attr('href');
                const c_date = $(e).parent().find('span').text().trim();

                chapters.push({ c_title, c_url, c_date, status: null });
            });

            m_list.push({ title, rating, image, url, chapters });
        });

        const current = parseInt($('.pagination .current').text() || 1);
        let last_page = current;

        const last_page_link = $('.pagination .last a').attr('href');
        if (last_page_link) {
            const match = last_page_link.match(/\/(\d+)\/?$/);
            if (match) last_page = parseInt(match[1]);
        }

        return {
            p_title: 'Manhwa Genre List',
            list: m_list,
            current_page: current,
            last_page: last_page
        };

    } catch (error) {
        return { error: error.message };
    }
}


// ======================================================
// 3. INFO (detail manhwa)
// ======================================================
async function info(slug) {
    let genres = [];
    let ch_list = [];

    try {
        const res = await axios.get(`${BASE_URL}/manga/${slug}`, { headers: axiosConfig.headers });
        const body = res.data;
        const $ = cheerio.load(body);

        const manhwa_title = $('.post-title h1').text().trim();
        const poster = $('.summary_image img').attr('src');

        const author = $('.author-content a').text().trim();
        const artist = $('.artist-content a').text().trim();

        const other_name_raw = $('.summary_content .post-content_item:contains("Alternative")').text();
        const other_name = other_name_raw.replace(/Alternative:/g, '').trim();

        const status = $('.post-status .post-content_item:nth-child(2) div:nth-child(2)').text().trim();

        let description = $('#panel-story-description').text().trim();
        if (description.startsWith('SUMMARY')) {
            description = description.replace('SUMMARY', '').trim();
        }

        $('.genres-content a').each((i, e) => {
            genres.push($(e).text().trim());
        });

        $('ul.row-content-chapter li').each((index, element) => {
            const $elements = $(element);

            const title = $elements.find('a.chapter-name').text().trim();
            const url = $elements.find('a.chapter-name').attr('href');
            const time = $elements.find('span.chapter-time').text().trim();

            ch_list.push({ ch_title: title, time, url });
        });

        ch_list.reverse();

        return {
            page: manhwa_title,
            other_name,
            poster,
            authors: author,
            artists: artist,
            genres,
            status,
            description,
            ch_list
        };

    } catch (error) {
        return { error: error.message };
    }
}


// ======================================================
// 4. CHAPTER (image list)
// ======================================================
async function chapter(url) {
  try {
    const baseUrl = "https://manga18fx.com";

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);

    // ------------------------------
    // Title Manga
    // ------------------------------
    const mangaTitle =
      $(".breadcrumb li:nth-child(3) a").text().trim() ||
      $(".post-title h1").text().trim();

    // ------------------------------
    // Manga URL
    // ------------------------------
    const mangaUrl =
      $(".breadcrumb li:nth-child(3) a").attr("href") || null;

    // ------------------------------
    // Current Chapter Title
    // ------------------------------
    const chapterTitle =
      $(".breadcrumb li:nth-child(4)").text().trim() ||
      $(".chapter-header h1").text().trim();

    // ------------------------------
    // IMAGE SCRAPING
    // ------------------------------
    const images = [];

    $(".page-break img").each((i, el) => {
      let img =
        $(el).attr("data-src") ||
        $(el).attr("src") ||
        $(el).attr("data-lazy-src");

      if (!img) return;

      // Fix relative URL
      if (img.startsWith("//")) img = "https:" + img;
      if (img.startsWith("/")) img = baseUrl + img;

      images.push(img);
    });

    return {
      manga: mangaTitle || null,
      manga_url: mangaUrl || null,
      current_ch: chapterTitle || null,
      images,
      count: images.length,
    };
  } catch (err) {
    return {
      error: true,
      message: err.message,
    };
  }
}

module.exports = {
    latest,
    all,
    info,
    chapter
};







