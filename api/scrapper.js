const cheerio = require("cheerio");
const axios = require("axios");

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

function cleanSlug(slug) {
  if (!slug) return "";
  return slug
    .replace(/^\/+/, "")
    .replace(/(info\/|manga\/|chapter\/)/gi, "")
    .replace(/\/$/, "")
    .trim();
}

/* ========================================== */
/*                LATEST                      */
/* ========================================== */
async function latest(page = 1) {
  try {
    const res = await axios.get(`${BASE_URL}/page/${page}`, axiosConfig);
    const $ = cheerio.load(res.data);

    let list = [];

    $(".listupd .bs").each((i, el) => {
      const $el = $(el);

      const url = $el.find("a").attr("href");
      const image = $el.find("img").attr("src") || $el.find("img").attr("data-src");
      const title = $el.find(".tt").text().trim();
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

      list.push({ title, rating, image, url, chapters });
    });

    const current = parseInt($(".pagination .current").text() || "1");
    const last = $(".pagination a").last().attr("href");
    const last_page = last ? parseInt(last.match(/page\/(\d+)/)?.[1] || current) : current;

    return {
      p_title: "Latest Updates",
      list,
      current_page: current,
      last_page,
    };
  } catch (e) {
    return { error: e.message };
  }
}

/* ========================================== */
/*                ALL / HOT MANGA             */
/* ========================================== */
async function all(page = 1) {
  try {
    const res = await axios.get(
      `${BASE_URL}/hot-manga?page=${page}`,
      axiosConfig
    );

    const $ = cheerio.load(res.data);

    let list = [];

    $(".listupd .bs").each((i, el) => {
      const $el = $(el);

      const url = $el.find("a").attr("href");
      const image = $el.find("img").attr("src") || $el.find("img").attr("data-src");
      const title = $el.find(".tt").text().trim();
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

      list.push({ title, rating, image, url, chapters });
    });

    const current = parseInt($(".pagination .current").text() || "1");
    const lastHref = $(".pagination a").last().attr("href");
    const last_page =
      lastHref?.includes("page=")
        ? parseInt(lastHref.split("page=")[1])
        : current;

    return {
      p_title: "All Manhwa",
      list,
      current_page: current,
      last_page,
    };
  } catch (e) {
    return { error: e.message };
  }
}

/* ========================================== */
/*                INFO                        */
/* ========================================== */
async function info(slug) {
  try {
    const cleaned = cleanSlug(slug);
    const res = await axios.get(`${BASE_URL}/manga/${cleaned}`, axiosConfig);
    const $ = cheerio.load(res.data);

    let genres = [];
    let ch_list = [];

    const title = $(".post-title h1").text().trim();
    const poster = $(".summary_image img").attr("src");

    const author = $(".author-content a").text().trim();
    const artist = $(".artist-content a").text().trim();

    const otherName = $('.post-content_item:contains("Alternative")')
      .text()
      .replace("Alternative", "")
      .trim();

    const status = $(".post-status div:nth-child(2) div:nth-child(2)")
      .text()
      .trim();

    let description = $("#panel-story-description").text().trim();
    description = description.replace(/^SUMMARY/i, "").trim();

    $(".genres-content a").each((i, e) => genres.push($(e).text().trim()));

    // ⬇️ BALIK URUTAN CHAPTERS
    $("ul.row-content-chapter li").get().reverse().forEach((el) => {
      const $el = $(el);
      ch_list.push({
        ch_title: $el.find("a.chapter-name").text().trim(),
        url: $el.find("a.chapter-name").attr("href"),
        time: $el.find(".chapter-time").text().trim(),
      });
    });

    return {
      page: title,
      other_name: otherName,
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


/* ========================================== */
/*                CHAPTER                     */
/* ========================================== */
async function chapter(manga, chapter) {
  try {
    const cleanedManga = cleanSlug(manga);
    const cleanedChapter = cleanSlug(chapter);

    const url = `${BASE_URL}/manga/${cleanedManga}/${cleanedChapter}`;

    const { data } = await axios.get(url, axiosConfig);
    const $ = cheerio.load(data);

    const breadcrumb = $(".breadcrumb li");
    const mangaTitle = $(breadcrumb[2]).find("a").text().trim();
    const mangaUrl = $(breadcrumb[2]).find("a").attr("href");

    const chapterTitle =
      $(breadcrumb[3]).text().trim() ||
      $(".entry-title").text().trim() ||
      chapter;

    const images = [];

    $(".page-break img").each((i, el) => {
      const img =
        $(el).attr("data-src") ||
        $(el).attr("data-lazy-src") ||
        $(el).attr("src");

      if (img && img.startsWith("http")) images.push(img.trim());
    });

    return {
      manga: mangaTitle,
      manga_url: mangaUrl,
      current_ch: chapterTitle,
      images,
      count: images.length,
    };
  } catch (err) {
    return { error: true, message: err.message };
  }
}

module.exports = {
  latest,
  all,
  info,
  chapter,
};

