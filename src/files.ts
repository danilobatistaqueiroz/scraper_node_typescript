import { Result } from "./result";

const json = require('../config.json');
const fs = require('fs');
const util = require('./util');
const colors = require('colors/safe');
const eResult = require('./result');

export class Files {
    outputFile:string='';
    inputFile:string='';
    logFile:string='';

    constructor(){
        this.outputFile = `output/${json.fileName}-${json.site}.${json.fileExt}`;
        this.inputFile = `input/${json.fileName}.${json.fileExt}`;
        this.logFile = `logs/${json.fileName}-${json.site}.log`;
    }

    getWordsInFile(){
        const data = fs.readFileSync(this.outputFile, 'UTF-8');
        const lines = data.split(/\r?\n/);
        let count = 0
        if(lines[lines.length-1]=='')
            count = lines.length-1;
        else
            count = lines.length;
        return count;
    }
    loadInputFile(){
        try {
            const data = fs.readFileSync(this.inputFile, 'UTF-8');
            const lines = data.split(/\r?\n/);
            return lines.map((line:string) => {
                let t = line.indexOf('\t');
                if(t<0){
                    t = line.length;
                }
                return line.substring(0,t)
            });
        } catch (err) {
            console.error(err);
        }
    }
    initializeLog(){
        fs.writeFile(this.logFile,'', 'utf8',(err:any) => {if (err) throw err});
    }
    appendLog(word:string, result:Result, message:string){
        if(result==eResult.Fail)
            console.log(colors.red(message));
        else
            console.log(message);
        let data = word+'\t'+result+'\t'+message+'\n';
        fs.appendFile(this.logFile,data, 'utf8',(err:any) => {if (err) throw err});
    }
    exists(){
        return fs.existsSync(this.outputFile);
    }
    initializeFile(){
        fs.writeFileSync(this.outputFile,'', 'utf8');
    }
    appendNewLineFile(){
        let data='\n';
        fs.appendFileSync(this.outputFile,data, 'utf8');
    }
    appendFile(translations:any){
        let data = translations;
        fs.appendFileSync(this.outputFile,data, 'utf8');
    }
}