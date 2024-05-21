import * as cheerio from "cheerio";
import * as cheerioType from "domhandler/lib/node"
import Log from "../log";
import {customEvent, dispatchVariables, listenedToObjects} from "../types/ClientTypes";
import {allFiles, allHtml} from "../allFiles";
import {IsEventToIgnore} from "../EventToIgnore";
import {extractKeysAndGenerateStr} from "../cheerioFn";
import {getDispatchKeywords} from "../treeSitterJavascript";
import {getAllJavascriptText} from "../treeSitterHmtl";

export class PageHtml
{
    public events : customEvent[];
    public cheerioObj : cheerio.CheerioAPI
    public uri : string
    public listenedToEventsPosition : listenedToObjects[]
    public linesArr : string[]
    public allStores : Record<string, string> = {}
    public allDataComp : Record<string, string> = {}
    public allBindings : string[] = []

    public constructor(cheerioObj: cheerio.CheerioAPI, uri : string) {
        this.listenedToEventsPosition = []
        this.linesArr = allFiles.get(uri)!.split('\n')
        this.events = []
        this.allBindings = []
        this.cheerioObj = cheerioObj
        this.uri = uri

        const javascriptText = getAllJavascriptText(uri)
        this.events = getDispatchKeywords(uri, javascriptText)

        this.abstractListenedEvents()


        this.registerJavaScriptBetweenScriptTags()
    }
    public get listenedToEvents()
    {
        return this.listenedToEventsPosition.map(item => {
            return item.name
        })
    }


    public get eventNames()
    {
        return this.events.map((item :customEvent)=> item.name)
    }

    public registerJavaScriptBetweenScriptTags()
    {
        Log.writeLspServer('get javascript between script tags',1)
        const content = allFiles.get(this.uri)!
        const regExp = /<script>([\s\S]*)<\/script>/g
        let match : any;
        while((match = regExp.exec(content)) != null)
        {
            Log.writeLspServer(match,1)
            const javascriptText = match[1]
            Log.writeLspServer(javascriptText,1)
            this.getAlpineStore(javascriptText)
            this.getAlpineBind(javascriptText)
            this.getAlpineData(javascriptText)
        }

    }


    public getAlpineBind(javascriptText : string)
    {
        Log.writeLspServer('get alpine store',1)
        const regExp = /Alpine\.bind\(\s*'([a-zA-Z-]*)'/g

        let match : any;
        while((match = regExp.exec(javascriptText)) != null)
        {
            this.allBindings.push(match[1])
        }
    }
    public getAlpineData(javascriptText : string)
    {
        Log.writeLspServer('get alpine data',1)
        Log.writeLspServer(javascriptText,1)
        const regExp = /Alpine\.data\(\s*'([a-zA-Z-]*)'\s*,\s*\(\)\s*=>\s*\(\s*({[\s\S]*?})\s*\)/g

        let match : any;
        while((match = regExp.exec(javascriptText)) != null)
        {
            Log.writeLspServer(match,1)
            try {
                const dataName = match[1]
                Log.writeLspServer(dataName,1)
                Log.writeLspServer(match[2],1)
                const keys: string[] = []
                const strToPush = extractKeysAndGenerateStr(match[2], keys)
                this.allDataComp[dataName] = strToPush
                Log.writeLspServer(this.allDataComp[dataName],1)

            }
            catch (e) {
                Log.writeLspServer('error extracting data on alpine stiore', 1)
            }
        }
    }
    public getAlpineStore(javascriptText : string)
    {
        Log.writeLspServer('get alpine store',1)
        const regExp = /Alpine\.store\(\s*'([a-zA-Z-]*)'\s*,(?:(\s*\{[\s\S]*?\}\s*)|\s*(['a-zA-Z-0-9]*)\s*)\)/g

        let match : any;
        while((match = regExp.exec(javascriptText)) != null)
        {
            try {
                const storeName = match[1]
                if (match[2] != undefined)
                {
                    const keys : string[] =[]
                    const strToPush = extractKeysAndGenerateStr(match[2], keys)
                    this.allStores[storeName] = 'var ' + storeName +  '= (() => { let ' + strToPush + '; return  { ' + keys.join(',') + ' } })()\n'
                }
                else if (match[3].indexOf('\'') != -1) {
                    const parameter = match[3].trim().replaceAll('\'','')
                    this.allStores[storeName] = 'var ' + storeName +  '= "' + parameter + '" ;'
                }
                else {
                    const parameter = parseFloat(match[3])
                    this.allStores[storeName] = 'var ' + storeName +  '= ' + parameter + ' ;'
                }
            }
            catch (e) {
               Log.writeLspServer('error extracting data on alpine stiore', 1)
            }
        }
    }

    public buildStoreMagicVariable()
    {
        if (Object.keys(this.allStores).length == 0) return ''
        var text = ''
        for (let allStoresKey in this.allStores) {
            text += this.allStores[allStoresKey]
        }

        text += 'var $store = { '
        text += Object.keys(this.allStores).join(',')
        text+= ' }'

        return text
    }


    private abstractListenedEvents()
    {
        const regExpEvents = /@([a-z-]*)[=\.]+/g
        let match
        this.linesArr.forEach((item,index) => {
            while ((match = regExpEvents.exec(item)) != null)
            {
                if (!IsEventToIgnore(match[1]))
                {
                    this.listenedToEventsPosition.push(
                        {
                            name: match[1],
                            positon : {
                                line: index,
                                character : match.index
                            }
                        })
                }

            }
        })
    }

}
