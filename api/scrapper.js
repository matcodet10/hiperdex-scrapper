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
  let cleaned = slug.replace(/^(info\/|chapter\/|manga\/|manga-)/i, "");
  cleaned = cleaned.replace(/^\//, "");
  return cleaned;
}

// 📌 LATEST
async function latest(page) {
  try {
    const res = await axios.get(`${BASE_URL}/page/${page}`, axiosConfig);
    const $ = cheerio.load(res.data);

    let m_list = [];

    $(".listupd .bs").each((i, el) => {
      const $el = $(el);

      const url = $el.find("a").attr("href");
      const title = $el.find(".tt").text().trim();
      const image =
        $el.find("img").attr("src") || $el.find("img").attr("data-src");
      const rating = $el.find(".numscore").text().trim();

      let chapters = [];
      $el.find(".epxs a").each((i, c) => {
        chapters.push({
          c_title: $(c).text().trim(),
          c_url: $(c).attr("href"),
          c_date: $(c).parent().find("span").text().trim(),
        });
      });

      m_list.push({ title, rating, image, url, chapters });
    });

    const current = parseInt($(".pagination .current").text() || 1);
    let last_page = current;

    const last_page_link = $(".p
