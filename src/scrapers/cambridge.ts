"use strict"

import { Config } from "../config";
import { Files } from "../files";
import { Group } from "./group";

var array = require('lodash/array');
var util = require('../util');
const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');
var dateFormat = require('dateformat');
var result = require('../result');

class Cambridge {
    constructor(private json: Config){}
    
    getFileName (str: string) {
        return str.substring(str.lastIndexOf('/')+1).replace(' ','');
    }
    downloadMp3(lists: Group){
        const https = require('https');
        for(let a = 0; a < lists.audios.length; a++){
            let audio = path.join('https://dictionary.cambridge.org',lists.audios[a]);
            let fileName = this.getFileName(audio);
            const file = fs.createWriteStream(`mp3/${this.json.fileName}/cambridge/${this.json.fileName}-cambridge-${fileName}`);
            const request = https.get(audio, function(response:any) {
                response.pipe(file);
            });
        }
    }
    setMp3Field(lists: Group){
        for(let i = 0; i < lists.audios.length; i++){
            let mp3 = this.getFileName(lists.audios[i]);
            lists.audios[i] = `[sound:${this.json.fileName}-cambridge-${mp3}]`;
        }
        return lists;
    }
    removeDuplications(group: Group){
        let pronunciations = array.uniq(group.pronunciations);
        let translations = array.uniq(group.translations);
        let audios = array.uniq(group.audios);
        let definitions = array.uniq(group.definitions);
        translations = this.removeDuplicatedTranslatedTerms(translations);
        return {pronunciations, translations, audios, definitions};
    }
    removeDuplicatedTranslatedTerms(translations: Array<any>){
        let splited = this.transformCommaSeparatedTermsInItems(translations);
        splited = splited.map(t => t.trim());
        return array.uniq(splited);
    }
    transformCommaSeparatedTermsInItems(translations: Array<any>){
        let str = translations.toString();
        return str.split(',');
    }
    async queryDictionary(page:any, word:string, selector:any){
        if(util.isCapitalized(word)){
            return {"result":result.Fail,"message":'capitalized'};
        }
        let url = `https://dictionary.cambridge.org/dictionary/english-portuguese/${word}`;
        let response;
        try{
            response = await page.goto(url);
        } catch (err) {
            console.log(colors.red(word+' : timeout'));
            return {"result":result.Fail,"message":'timeout goto'};
        }
        const chain = response.request().redirectChain();
        if(chain.length==1){
            return {"result":result.Fail,"message":'redirect'};
        }
        try{
            await page.setDefaultTimeout(15000);
            await page.setDefaultNavigationTimeout(15000);
            await page.waitForSelector(selector);
        } catch (err) {
            return {"result":result.Fail,"message":'timeout selector'};
        }
        return {"result":result.Success,"message":'ok'};
    }
}

class CambridgeScraper {

    constructor(private json: Config){}

    removeLastCharIfCondition(text: string, charCondition: string){
        if(text!=undefined && text!=null && text!=''){
            text = text.trim();
            let lastChar = text.charAt(text.length-1);
            if(lastChar==charCondition){
                return text.slice(0,-1);
            }
        }
        return text;
    }
    async scrape(browser: any){
        let files = new Files();
        let words: string = files.loadInputFile();
        let page = await browser.newPage();

        let count = 0;
        let startLine = 0;
        if(files.exists()) {
            let cntwords = files.getWordsInFile();
            if(cntwords <= 1){
                console.log(`arquivo ${files.outputFile} vazio!`);
            } else if(cntwords > 1){
                console.log(`arquivo ${files.outputFile} com ${cntwords} linhas!`);
                if(cntwords > 999)
                    return
                startLine = cntwords+1
            }
        }

        if(startLine==0){
            files.initializeLog();
            files.initializeFile();
        }

        let ini = new Date()
        files.appendLog('',result.Success,dateFormat(ini, "h:MM:ss l"));
        let mainSelector = '.entry-body.dentry-body';

        let cambridge = new Cambridge(this.json);

        for(let word of words){
            console.log(word);
            count++;
            if (count < startLine) {
                continue;
            }
            if(count > this.json.endLine) {
                break;
            }

            await util.delay(2200);
            let infoquery = await cambridge.queryDictionary(page, word,mainSelector);
            if(infoquery.result==result.Fail){
                console.log(colors.red('fail'));
                files.appendLog(word, result.Fail,infoquery.message);
                files.appendFile(`${word}\t\t\t\t\n`);
                await util.delay(1000);
                continue;
            }
            let html = await page.content();
            let content = util.getDom(html,mainSelector);
            let entryBodies = content.querySelectorAll('.pr.entry-body__el');
            let pronunciations = [];
            let translations = [];
            let audios = [];
            let definitions = [];
            let divDefinitions = content.querySelectorAll('.def.ddef_d.db');
            let definitionsCnt = 0;
            for(let d = 0; d < divDefinitions.length; d++){
                definitionsCnt++;
                let definition = this.removeLastCharIfCondition(divDefinitions[d].textContent,',');
                definitions.push(definitionsCnt+'. '+definition+'. ');
            }
            await util.delay(1500);
            for(let e = 0; e < entryBodies.length; e++){
                let blocks = entryBodies[e].querySelectorAll('.sense-block.pr.dsense.dsense-noh');
                if(blocks==null || blocks.length==0){
                    continue;
                }
                let meanings = content.querySelectorAll('.trans.dtrans.dtrans-se');
                console.log(meanings.length);
                for(let m = 0; m < meanings.length; m++){
                    translations.push(meanings[m].textContent.trim());
                }
                let divPronUS = entryBodies[e].querySelectorAll('.pron-info.dpron-info')[1];
                if(divPronUS==null){
                    continue;
                }
                if(divPronUS.querySelector('audio')==null){
                    divPronUS = entryBodies[e].querySelectorAll('.pron-info.dpron-info')[2];
                    if(divPronUS==undefined)
                        continue;
                }
                let audioMp3 = divPronUS.querySelector('audio source[type="audio/mpeg"]');
                if(audioMp3!=null) {
                    let mp3 = audioMp3.src;
                    audios.push(mp3);
                }
                let divsIPA = divPronUS.querySelectorAll('.pron.dpron');
                for(let p = 0; p < divsIPA.length; p++) {
                    pronunciations.push(divsIPA[p].innerHTML.trim());
                }
            }
            await util.delay(1500);
            let group = {translations,pronunciations,audios,definitions};
            let lists = cambridge.removeDuplications(group);
            cambridge.downloadMp3(lists);
            await util.delay(1500);
            lists = cambridge.setMp3Field(lists);
            files.appendFile(`${word}\t${lists.translations}\t${lists.pronunciations}\t${lists.audios}\t${lists.definitions}\n`);
        }
        let end = new Date()
        files.appendLog('', result.Success, dateFormat(end, "h:MM:ss l"));
        files.appendLog('', result.Success, 'total de palavras:' + count);
    }
}

module.exports = CambridgeScraper;