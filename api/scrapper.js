const cheerio = require("cheerio");
const axios = require("axios");

// ==============================
// CONFIG (ANTI BOT)
// ==============================
const BASE_URL = "https://manga18fx.com";

const axiosConfig = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: BASE_URL,
  },
};

// =========================================
// 1. LATEST
// =========================================
async function latest(page) {
  try {
    const res = await axios.get(`${BASE_URL}/page/${page}`, axiosConfig);
    const $ = cheerio.load(res.data);

    let m_list = [];

    $(".listupd .bsx-item").each((i, el) => {
      const $el = $(el);

      const url = $el.find("a").attr("href");
      const image = $el.find("img").attr("src");
      const title = $el.find("a").attr("title");
      const rating = $el.find(".numscore").text().trim();

      let chapters = [];
      $el.find(".epxs a").each((i, c) => {
        chapters.push({
          c_title: $(c).text().trim(),
          c_url: $(c).attr("href"),
          c_date: $(c).parent().find("span").text().trim(),
          status: null,
        });
      });

      m_list.push({ title, rating, image, url, chapters });
    });

    const current = parseInt($(".pagination .current").text() || 1);
    let last_page = current;

    const last_page_link = $(".pagination .last a").attr("href");
    if (last_page_link) {
      const match = last_page_link.match(/page\/(\d+)/);
      if (match) last_page = parseInt(match[1]);
    }

    return {
      p_title: "Latest Updates",
      list: m_list,
      current_page: current,
      last_page,
    };
  } catch (e) {
    return { error: e.message };
  }
}

// =========================================
// 2. ALL
// =========================================
async function all(page) {
  try {
    const pageNumber = parseInt(page) || 1;
    const endpoint = (pageNumber > 1) 
      ? `/hot-manga?page=${pageNumber}` 
      : `/hot-manga`;
    const url = `${BASE_URL}${endpoint}`;
    const res = await axios.get(url, axiosConfig);

    const $ = cheerio.load(res.data);

    let m_list = [];

    $(".listupd .bsx-item").each((i, el) => {
      const $el = $(el);

      const url = $el.find("a").attr("href");
      const image = $el.find("img").attr("src");
      const title = $el.find("a").attr("title");
      const rating = $el.find(".numscore").text().trim();

      let chapters = [];
      $el.find(".epxs a").each((i, c) => {
        chapters.push({
          c_title: $(c).text().trim(),
          c_url: $(c).attr("href"),
          c_date: $(c).parent().find("span").text().trim(),
          status: null,
        });
      });

      m_list.push({ title, rating, image, url, chapters });
    });

    const current = parseInt($(".pagination .current").text() || 1);
    let last_page = current;

    const last_page_link = $(".pagination .last a").attr("href");
    if (last_page_link) {
      const match = last_page_link.match(/\/(\d+)\/?$/);
      if (match) last_page = parseInt(match[1]);
    }

    return {
      p_title: "Manhwa Genre List",
      list: m_list,
      current_page: current,
      last_page,
    };
  } catch (e) {
    return { error: e.message };
  }

// =========================================
// 3. INFO
// =========================================
async function info(slug) {
  try {
    const res = await axios.get(`${BASE_URL}/manga/${slug}`, axiosConfig);
    const $ = cheerio.load(res.data);

    let genres = [];
    let ch_list = [];

    const manhwa_title = $(".post-title h1").text().trim();
    const poster = $(".summary_image img").attr("src");

    const author = $(".author-content a").text().trim();
    const artist = $(".artist-content a").text().trim();

    const other_name_raw = $(
      '.summary_content .post-content_item:contains("Alternative")'
    ).text();
    const other_name = other_name_raw.replace(/Alternative:/g, "").trim();

    const status = $(".post-status .post-content_item:nth-child(2) div:nth-child(2)")
      .text()
      .trim();

    let description = $("#panel-story-description").text().trim();
    if (description.startsWith("SUMMARY")) {
      description = description.replace("SUMMARY", "").trim();
    }

    $(".genres-content a").each((i, e) => genres.push($(e).text().trim()));

    $("ul.row-content-chapter li").each((i, el) => {
      const $el = $(el);

      ch_list.push({
        ch_title: $el.find("a.chapter-name").text().trim(),
        url: $el.find("a.chapter-name").attr("href"),
        time: $el.find("span.chapter-time").text().trim(),
      });
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
      ch_list,
    };
  } catch (e) {
    return { error: e.message };
  }
}

// =========================================
// 4. CHAPTER (FULL FIXED)
// =========================================
async function chapter(manga, chapter) {
  try {
    const BASE_URL = "https://manga18fx.com";

    // Build URL secara aman
    const url = `${BASE_URL}/manga/${manga}/${chapter}/`;

    console.log("🔍 Fetching Chapter:", url);

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      }
    });

    const $ = cheerio.load(data);

        // -------------------------
        // ⭐ BREADCRUMB FIX FINAL
        // -------------------------
        const breadcrumb = $(".breadcrumb li");

        const mangaTitle = $(breadcrumb[2]).find("a").text().trim();
        const mangaUrl = $(breadcrumb[2]).find("a").attr("href")?.trim() || null;

        // Chapter title ambil dari breadcrumb → fallback ke <h1>
        const chapterTitle =
            $(breadcrumb[3]).text().trim() ||
            $(".entry-title").text().trim() ||
            chapter.replace("-", " ").toUpperCase();

        // -------------------------
        // ⭐ SCRAPE IMAGES
        // -------------------------
        const images = [];

        $(".page-break img").each((i, el) => {
            const dataSrc = $(el).attr("data-src");
            const src = $(el).attr("src");

            const img = dataSrc || src;
            if (img && img.startsWith("http")) {
                images.push(img.trim());
            }
        });

        return {
            manga: mangaTitle || "Unknown Title",
            manga_url: mangaUrl,
            current_ch: chapterTitle,
            images: images,
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
  chapter,
};






