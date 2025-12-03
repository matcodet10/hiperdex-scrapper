async function info(slug) {
    try {
        const cleanedSlug = cleanSlug(slug);
        const res = await axios.get(`${BASE_URL}/manga/${cleanedSlug}`, axiosConfig);
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

        // --------------------------------------------------------
        // --- PERBAIKAN PENGAMBILAN SINOPSIS/DESCRIPTION ---
        // --------------------------------------------------------
        let description = "";

        // Target elemen deskripsi
        const description_el = $("#panel-story-description");

        // Periksa apakah ada paragraf (p) di dalamnya
        if (description_el.find("p").length > 0) {
            // Jika deskripsi berisi tag <p>, gabungkan teks dari semua paragraf
            description_el.find("p").each((i, el) => {
                description += $(el).text().trim() + "\n\n";
            });
            description = description.trim();
        } else {
            // Jika tidak ada tag <p>, ambil semua teks langsung
            description = description_el.text().trim();
        }

        // PEMBERSIHAN KHUSUS: Hapus awalan 'SUMMARY' atau 'SINOPSIS' jika ada
        if (description.startsWith("SUMMARY")) {
            description = description.replace("SUMMARY", "").trim();
        } else if (description.startsWith("SINOPSIS")) {
            description = description.replace("SINOPSIS", "").trim();
        }
        
        // --------------------------------------------------------

        $(".genres-content a").each((i, e) => genres.push($(e).text().trim()));

        $("ul.row-content-chapter li").each((i, el) => {
            const $el = $(el);

            ch_list.push({
                ch_title: $el.find("a.chapter-name").text().trim(),
                url: $el.find("a.chapter-name").attr("href"),
                time: $el.find("span.chapter-time").text().trim(),
            });
        });

        //ch_list.reverse();

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
