import * as cheerio from "cheerio";
import * as cheerioType from "domhandler/lib/node"
import Log from "../log";
import {customEvent, dispatchVariables} from "../ClientTypes";

export class PageHtml
{
    public events : customEvent[];
    public cheerioObj : cheerio.CheerioAPI
    public folderName : string
    private eventNames : string[]

    public constructor(cheerioObj: cheerio.CheerioAPI, folderName : string) {
        this.events = []
        this.eventNames = []
        this.cheerioObj = cheerioObj
        cheerioObj('body').children().each((index : any, element : cheerio.Element) => {
            this.processElement(element);
        })
        this.folderName = folderName

    }


    public processElement(element : cheerio.Element) {
        element.children.forEach((child : cheerioType.ChildNode) => {
            if (child.type === 'tag') {
                const z = child.attribs
               Log.writeLspServer(child.attribs)
                const createdEvents = this.getCustomNotWindowEventsWithVariables(JSON.stringify(child.attribs))

                this.events.push(...createdEvents)
                this.processElement(child);
        }
    });
    }

    public getCustomNotWindowEventsWithVariables(nodeText : string): customEvent[]
    {
        const customEvents : customEvent[] = []
        const content = nodeText
        const arr = content.split('$dispatch')
        Log.writeLspServer('dispatch')
        Log.writeLspServer(content)
        arr.forEach((match : string) => {
            match = match.replace('\n','')
            if (match.includes('customevent'))
            {
                Log.writeLspServer('customevent trigger')
            }
            Log.writeLspServer(match)
            const regExp = /^\(['\s]+([a-z-]+)(?:[\s',]+{([a-zA-Z\s,':0-9]+)}|[\s'])\)/
            const res = match.match(regExp)
            if (!res){
                Log.writeLspServer('event regex did not work')
                return
            }
            const keysVar: dispatchVariables  = {}
            Log.writeLspServer(res[1])
            if (res.length > 2 && res[2] )
            {
                Log.writeLspServer('hits here')
                Log.writeLspServer(res[2])
                const zu = res[2].split(',')

                zu.forEach(v => {
                    const p = v.split(':')
                    let value = p[1].indexOf("'") != -1 ? p[1].replace(/'/g, '') : parseFloat(p[1])
                     keysVar[p[0].trim()] = value
                })
            }

            if (this.eventNames.indexOf(res[1]) === -1)
            {
                customEvents.push({
                    name : res[1],
                    details: keysVar
                })
                this.eventNames.push(res[1])
            }

        })
        Log.writeLspServer('results')
        Log.writeLspServer(customEvents)

        return customEvents
    }
}
