const Browser = require('./browser');
const pager = require('./pager');
let browser = new Browser();
let instance = browser.startBrowser();
pager(instance).then(()=>{
    browser.stopBrowser(instance);
});