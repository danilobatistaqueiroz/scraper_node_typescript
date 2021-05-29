"use strict"
const Scanner = require('./listScanner');
const json = require('../config.json');
async function scrapeAll(browserInstance: any){
    let browser;
    try{
        browser = await browserInstance;
        await (new Scanner(json)).scan(browser)
    }
    catch(err){
        console.log("Could not resolve the browser instance => ", err);
    }
}

module.exports = (browserInstance: any) => scrapeAll(browserInstance)