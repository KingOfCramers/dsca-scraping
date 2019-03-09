const fs = require("fs");
const pupeteer = require("puppeteer");
const cheerio = require("cheerio");

let fetchPage = async (url) => {
    const browser = await pupeteer.launch({ headless: true });
    const page = await browser.newPage();
    // await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle2' }); // Ensure no network requests are happening (in last 500ms).
    let html = await page.content();
    await browser.close();
    return html;
};

fetchPage('https://dod.defense.gov/News/Contracts/?Page=1')
    .then(async(html) => {
        let links = [];
        $ = cheerio.load(html);
        let dayLinks = $("div.alist div.title a");
        dayLinks.each((i,link) => {
            let linkPath = ($(link).attr('href'));
            links.push(linkPath);
        });
        return links;
    })
    .then((links) => {
        links.forEach()
    })
    .catch((err) => {
        console.log(err);
    })