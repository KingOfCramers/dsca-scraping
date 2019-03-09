const fs = require("fs");
const pupeteer = require("puppeteer");
const cheerio = require("cheerio");
const path = require("path");
const moment = require("moment");

const asyncForEach = async(array, callback) => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index]);
    }
};

const range = Array(36).fill(1).map((x, y) => x + y);
const fetchContracts = async (url) => {
    const browser = await pupeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' }); // Ensure no network requests are happening (in last 500ms).
    let html = await page.content();

    //// Cheerio...
    let links = [];
    let $ = cheerio.load(html);
    let dayLinks = $("div.alist div.title a");
    dayLinks.each((i,link) => {
        let linkPath = ($(link).attr('href'));
        links.push(linkPath);
    });

    let allFiles = [];

    await asyncForEach(links, async(link) => {
        let file = { date : '', contracts: [] };

        await page.goto(link, { waitUntil: 'networkidle2' });
        let html = await page.content();
        let $ = cheerio.load(html);        
        
        let date = $('div.article-body h1');
        let dateTextLong = ($(date).text());
        let dateText = moment(dateTextLong.substring(14, dateTextLong.length)).format("M-D-YYYY")
        file.date = dateText;

        let contracts = $('div.article-body p');
        contracts.each((i,contract) => {
            let textContent = ($(contract).text());
            file.contracts.push(textContent);
        });
        allFiles.push(file)
    });
    await browser.close();
    return allFiles;
};

let execute = async () => {
    for(const pageNum in range){
        await fetchContracts(`https://dod.defense.gov/News/Contracts/?Page=${pageNum}`)
                .then(async(allFiles) => {
                    asyncForEach(allFiles, async({ date, contracts }) => {
                        var file = fs.createWriteStream(path.join(__dirname, `${date}.txt`));        
                        file.on('error', (err) => { 
                            throw err;
                        });
                        contracts.forEach((p) => { 
                            file.write(p.concat(' \n')); 
                        });

                        file.end();
                    })
                })
                .catch((err) => console.log(err));
        console.log(`Fetched and wrote contracts for ${pageNum}...`);
    };
    console.log('Done.')
}

execute();