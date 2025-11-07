const axios = require('axios');
const cheerio = require('cheerio');

const domain = 'https://hiperdex.com'

// --- Fungsi untuk mendapatkan daftar chapter terbaru ---
exports.latest = async (page) => {
    try {
        const response = await axios.get(`${domain}/page/${page}/?m_orderby=latest`)
        const $ = cheerio.load(response.data)
        const result = []

        $('.page-content .post-listing .post-item').each((i, el) => {
            const element = $(el)
            const slug = element.find('a').attr('href').split('/').slice(-2)[0]
            const title = element.find('.post-header .post-title a').text().trim()
            const cover = element.find('.post-thumbnail img').attr('src')
            const latestChapter = element.find('.post-latest-chapter a').text().trim()
            const link = element.find('a').attr('href')

            result.push({
                slug: slug,
                title: title,
                cover: cover,
                latestChapter: latestChapter,
                link: link
            })
        })

        return result
    } catch (e) {
        return { error: e.message }
    }
}

// --- Fungsi untuk mendapatkan daftar semua manhwa ---
exports.all = async (page) => {
    try {
        const response = await axios.get(`${domain}/page/${page}/?m_orderby=title`)
        const $ = cheerio.load(response.data)
        const result = []

        $('.page-content .post-listing .post-item').each((i, el) => {
            const element = $(el)
            const slug = element.find('a').attr('href').split('/').slice(-2)[0]
            const title = element.find('.post-header .post-title a').text().trim()
            const cover = element.find('.post-thumbnail img').attr('src')
            const latestChapter = element.find('.post-latest-chapter a').text().trim()
            const link = element.find('a').attr('href')

            result.push({
                slug: slug,
                title: title,
                cover: cover,
                latestChapter: latestChapter,
                link: link
            })
        })

        return result
    } catch (e) {
        return { error: e.message }
    }
}

// --- Fungsi untuk mendapatkan detail manhwa (Info + Daftar Chapter) ---
exports.info = async (slug) => {
    try {
        const response = await axios.get(`${domain}/manga/${slug}`)
        const $ = cheerio.load(response.data)
        const result = {}

        const title = $('.post-title').text().trim()
        const cover = $('.post-thumbnail img').attr('src')
        const summary = $('.post-summary').text().trim()

        const genre = []
        $('.post-content .post-genres a').each((i, el) => {
            genre.push($(el).text().trim())
        })

        const chapterList = []
        $('.list-chapters li').each((i, el) => {
            const element = $(el)
            const name = element.find('a').text().trim()
            const link = element.find('a').attr('href')
            const chapterSlug = link.split('/').slice(-2)[0]

            chapterList.push({
                name: name,
                chapterSlug: chapterSlug,
                link: link
            })
        })

        result.title = title
        result.cover = cover
        result.summary = summary
        result.genre = genre
        result.chapters = chapterList

        return result
    } catch (e) {
        return { error: e.message }
    }
}

// --- Fungsi untuk mendapatkan gambar-gambar dalam chapter ---
exports.chapter = async (manga, chapter) => {
    try {
        const response = await axios.get(`${domain}/manga/${manga}/${chapter}`)
        const $ = cheerio.load(response.data)
        const result = []

        $('#chapter-content img').each((i, el) => {
            const element = $(el)
            const url = element.attr('src')

            if (url) {
                result.push(url)
            }
        })

        return result
    } catch (e) {
        return { error: e.message }
    }
}
