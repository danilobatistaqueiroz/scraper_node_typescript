"use strict"
const puppeteer = require('puppeteer');

class BrowserPuppeteer {

  constructor(){}

  async startBrowser () {
      let browser;
      try {
          browser = await puppeteer.launch({
              //headless: json.headless, 
              headless: false,
              args: [
                  `--disable-setuid-sandbox`,
                  //`--proxy-server=socks5://127.0.0.1:9050`
              ],
              'ignoreHTTPSErrors': true
          });
      } catch (err) {
          console.log("Could not create a browser instance => : ", err);
      }
      return browser;
  }

  async stopBrowser(browserInstance: any) {
      let browser = await browserInstance;
      await browser.close();
  }
}

module.exports = BrowserPuppeteer;