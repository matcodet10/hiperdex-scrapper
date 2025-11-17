const scrapper = require('./Scrapper'); 
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    next();
});


app.get('/api/latest/:page', async (req, res) => {
    // Memanggil scraper yang aman dan langsung merespons
    const result = await scrapper.latest(req.params.page);
    res.status(200).json(result); 
});


app.get('/api/all/:page', async (req, res) => {
    const result = await scrapper.all(req.params.page);
    res.status(200).json(result);
});


app.get('/api/info/:slug', async (req, res) => {
    const result = await scrapper.info(req.params.slug);
    res.status(200).json(result);
});


app.get('/api/chapter/:manga/:chapter', async (req, res) => {
    const result = await scrapper.chapter(req.params.manga, req.params.chapter);
    // Cache-Control untuk respons JSON yang tidak akan berubah
    res.setHeader('Cache-Control', 's-maxage=43200'); 
    res.status(200).json(result);
});


module.exports = app;
