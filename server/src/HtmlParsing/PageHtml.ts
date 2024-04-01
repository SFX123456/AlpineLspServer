import * as cheerio from "cheerio";
import * as cheerioType from "domhandler/lib/node"
import Log from "../log";
import {customEvent, dispatchVariables, listenedToObjects} from "../types/ClientTypes";
import {allFiles, allHtml} from "../allFiles";
import {IsEventToIgnore} from "../EventToIgnore";
import {extractKeysAndGenerateStr} from "../cheerioFn";

interface store {
    keys : string[]
}
export class PageHtml
{
    public events : customEvent[];
    public cheerioObj : cheerio.CheerioAPI
    public uri : string
    public listenedToEventsPosition : listenedToObjects[]
    public linesArr : string[]
    public allStores : Record<string, string> = {}

    public constructor(cheerioObj: cheerio.CheerioAPI, uri : string) {
        this.listenedToEventsPosition = []
        this.linesArr = allFiles.get(uri)!.split('\n')
        this.events = []
        this.cheerioObj = cheerioObj
        this.uri = uri
        cheerioObj('html').children().each((index : any, element : cheerio.Element) => {
            this.processElement(element);
        })
        this.setIndexesOfDispatchedEevents()
        this.abstractListenedEvents()
        this.getJavaScriptBetweenScriptTags()
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

    public getJavaScriptBetweenScriptTags()
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
        }

    }

    public getAlpineStore(javascriptText : string)
    {
        Log.writeLspServer('get alpine store',1)
        const regExp = /Alpine\.store\(\s*'([a-zA-Z-]*)'\s*,(\s*\{[\s\S]*?\})\s*\)/g

        let match : any;
        while((match = regExp.exec(javascriptText)) != null)
        {
            const storeName = match[1]
            Log.writeLspServer(storeName,1)
            Log.writeLspServer(match[2],1)
            const keys : string[] =[]
            const strToPush = extractKeysAndGenerateStr(match[2], keys)
            this.allStores[storeName] = 'var ' + storeName +  '= (() => { let ' + strToPush + '; return  { ' + keys.join(',') + ' } })()\n'
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

    public processElement(element : cheerio.Element) {
        element.children.forEach((child : cheerioType.ChildNode) => {
            if (child.type === 'tag') {

                const z = child.attribs
               Log.writeLspServer(child.attribs,1)
                const createdEvents = this.getCustomNotWindowEventsWithVariables(JSON.stringify(child.attribs))
                Log.writeLspServer('got following events',1)
                Log.writeLspServer(createdEvents,1)
                this.events.push(...createdEvents)
                this.processElement(child);
        }
     });
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






    public getCustomNotWindowEventsWithVariables(nodeText : string): customEvent[]
    {
        const customEvents : customEvent[] = []
        const content = nodeText
        const arr = content.split('$dispatch')
        if (!arr) return []
        arr.shift()
        Log.writeLspServer(arr,1)
        arr.forEach((match : string, index) => {
            match = match.replace('\n','')
            const regExp = /^\(\s*'([a-z-]+)'(?:\s*,([\s\S]*)|\s*)\)/
            const res = match.match(regExp)
            Log.writeLspServer('what',1)
            Log.writeLspServer(res,1)
            if (!res) return
            if (res.length >= 2)
            {
                if (res[2].indexOf('{') != -1 && res[2].indexOf('}') != -1)
                {
                    try {
                        const obj: dispatchVariables = {}
                        const arr = res[2].substring(res[2].indexOf('{')+1,res[2].indexOf('}')-1).split(',')
                        for (let i = 0; i < arr.length; i++)
                        {
                            Log.writeLspServer('here',1)
                            try {
                                const lineStr = arr[i]
                                Log.writeLspServer(lineStr,1)
                                const key2 = lineStr.split(':')[0]
                                Log.writeLspServer(key2,1)
                                 const m =   key2.match(/([a-zA-Z][a-zA-Z-]*)/)![1].trim()
                                Log.writeLspServer(m,1)
                                obj[m] = 1
                            }
                            catch (e) {
                                Log.writeLspServer('errors here',1)
                            }
                        }
                        Log.writeLspServer(obj,1)
                        customEvents.push({
                            name : res[1],
                            details: obj,
                            position: {
                                line : 1,
                                character : 1
                            }
                        })
                    }
                    catch (e) {
                        Log.writeLspServer('another error happened',1)
                    }
                }
                else {
                    if (res[2].indexOf('\'') != -1 && res[2].lastIndexOf('\'') != res[2].indexOf('\''))
                    {
                        customEvents.push({
                            name : res[1],
                            details: res[2].trim().replaceAll('\'',''),
                            position: {
                                line : 1,
                                character : 1
                            }
                        })
                    }
                    else
                    {
                        const floatVal = parseFloat(res[2])
                        customEvents.push({
                            name : res[1],
                            details: floatVal,
                            position: {
                                line : 1,
                                character : 1
                            }
                        })
                    }
                }
            }
        })
        Log.writeLspServer('return ing',1)
        Log.writeLspServer(customEvents,1)
        return customEvents
    }

    private setIndexesOfDispatchedEevents()
    {
        const alreadyFoundEvents : Record<string, number> = {}
        this.events.forEach(item => {
            let counterFoundEvent = 0
            let found = false
            this.linesArr.forEach((line,ind) => {
                const regex:RegExp = new RegExp(`\\$dispatch\\(\\s*'${item.name}`, 'gm')
                if (!found)
                {
                    const match = regex.exec(line)

                    if (match)
                    {
                        //console.log(match)
                        if (alreadyFoundEvents[item.name])
                        {
                            //console.log('trying for  ' + item.name)
                            if (counterFoundEvent == alreadyFoundEvents[item.name])
                            {
                                item.position.line = ind
                                item.position.character = match.index + 11
                                alreadyFoundEvents[item.name]++
                                found = true
                            }
                        }
                        else {
                            item.position.line = ind
                            item.position.character = match.index + 11
                            alreadyFoundEvents[item.name] = 1
                            found = true
                        }
                        counterFoundEvent++;
                    }
                }
            })
        })
    }

    public static getAllListedToEvents() :string[]
    {
        const output : string[] = []
        const set : Set<string> = new Set()
        for (let key of allHtml.keys()) {
            allHtml.get(key)!.listenedToEventsPosition.forEach(x => {
                set.add(x.name)
            })
        }
        for (let key of set.keys()) {
           output.push(key)
        }
        Log.writeLspServer(set)
        return output
    }
}
