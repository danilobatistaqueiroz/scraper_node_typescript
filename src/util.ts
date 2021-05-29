const jsdom = require("jsdom");
export class util {
    getDom(html:any,selector:any){
        const dom = new jsdom.JSDOM(html);
        let doc = dom.window.document;
        let content = doc.querySelector(selector);
        return content;
    }
    isCapitalized(word:string) {
        return word.charAt(0).toUpperCase() === word.charAt(0);
    }
    removeLastComma(str:string){
        if(str==undefined || str==null)
            return str;
        if(str.trim().slice(-1)==',') 
            return str.trim().slice(0,-1);
        else
            return str;
    }
    removeLastDot(str:string){
        if(str==undefined || str==null)
            return str;
        if(str.trim().slice(-1)=='.') 
            return str.trim().slice(0,-1);
        else
            return str;
    }
    async delay(ms:number) {
        return new Promise(res => setTimeout(res, ms));
    }
    sleepFor( sleepDuration: number ){
        var now = new Date().getTime();
        while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
    }
    replaceAll(str:string, find:string, replace:string) {
        return str.replace(new RegExp(find, 'g'), replace);
    }
}

module.exports = util;