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
async function chapter(manga, chapter) {
  let ch_list = [];

  try {
    const url = `${BASE_URL}/manga/${manga}/${chapter}`;
    const res = await axios.get(url, { headers: axiosConfig.headers });

    console.log("DEBUG CHAPTER HTML:", res.data);  // debug

    const $ = cheerio.load(res.data);

    const selectors = [
      "div.read-content img",
      ".page-break img",
      ".reader-area img",
      "img[data-src]",
    ];

    selectors.forEach(sel => {
      $(sel).each((i, el) => {
        let img = $(el).attr("data-src") || $(el).attr("src");
        if (!img) return;
        img = img.trim().split("?")[0];
        if (img.startsWith("http") && !img.includes("ads")) {
          ch_list.push({ ch: img });
        }
      });
    });

    // dedupe
    ch_list = [...new Map(ch_list.map(v => [v.ch, v])).values()];

    if (ch_list.length === 0) {
      return { error: "No images found in chapter", url, html: res.data };
    }

    // ambil meta
    const current_ch = $(".breadcrumb > li:nth-child(3)").text().trim();
    const manga_title = $(".breadcrumb > li:nth-child(2) > a").text().trim();
    const manga_url = $(".breadcrumb > li:nth-child(2) > a").attr("href");
    let prev = $(".nav-links .prev-link a").attr("href");
    let next = $(".nav-links .next-link a").attr("href");

    if (prev === "#") prev = null;
    if (next === "#") next = null;

    return {
      manga: manga_title,
      manga_url,
      current_ch,
      chapters: ch_list,
      nav: [{ prev, next }],
    };
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = {
    latest,
    all,
    info,
    chapter
};




