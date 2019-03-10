const fs = require("fs");
const path = require("path");
const util = require("util");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

readDir = util.promisify(fs.readdir);
readFile = util.promisify(fs.readFile);

let allFiles = readDir(path.resolve(__dirname, "Contracts"));

allFiles
    .then(async(files) => {
        let texts = [];
        for(const file of files){
            let contents = await readFile(path.resolve(__dirname, "Contracts", file));
            texts.push({ date: file.substring(0, file.length - 4), content: contents.toString()} );
        };
        return texts;
    })
    .then(async(texts) => {
        let total = 0; largest = 0; dateTotals = [];
        texts.forEach(({ content, date }) => {
            // let contracts = content.split('\n');

            let n = content.match(/\$([0-9.,]+)/) // Find value of contract (must build failsafe if contract value is undefined...)
            if(n){
                let n2 = n[1].replace(/[,.]/g, "");
                nInt = parseInt(n2);
                if(nInt > largest){
                    largest = nInt;
                };
                total = total + nInt;
                dateTotals.push({ date, total: nInt })
            }
        });
        return { dateTotals, total, largest };
    })
    .then(({ dateTotals, total, largest }) => {
        
        const csvWriter = createCsvWriter({
            path: path.join(__dirname, "totals"),
            header: [
                {id: 'date', title: 'DATE'},
                {id: 'total', title: 'TOTAL'}
            ]
        });

        csvWriter.writeRecords(dateTotals)       // returns a promise
            .then(() => {
                console.log('...Done');
            });
    });

    