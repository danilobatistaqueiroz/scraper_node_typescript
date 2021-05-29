import { Config } from "./config";

const CambridgeScraper = require('./scrapers/cambridge');

class ListScanner {
    constructor(private json: Config){}

    async scan(browser: any){
        if( this.json.site == '1x'){
            let slash = this.json.fileName.indexOf('-')
            let ini = parseInt(this.json.fileName.substring(0,slash));
            let len = this.json.fileName.length;
            let end = parseInt(this.json.fileName.substring(slash+1,len));
            console.log(ini, end);
            let scraper = new CambridgeScraper(this.json);
            for(let i = 1; i <= 40; i++){
                this.json.fileName = ini.toString()+'-'+end.toString();
                console.log('iniciando cambridge ' + this.json.fileName);
                this.json.site = 'cambridge';
                await scraper.scrape(browser);
                ini+=1000;
                end+=1000;
                this.json.startLine = 0
                if(ini == 41000)
                    break;
                if(end == 41000)
                    end = 41284;
            }
        }
    }
}

module.exports = ListScanner;