import * as cheerio from "cheerio";
import * as cheerioType from "domhandler/lib/node"
import Log from "../log";
import {customEvent, dispatchVariables, listenedToObjects} from "../types/ClientTypes";
import {allFiles, allHtml} from "../allFiles";
import {ExecutionSummary, InsertTextMode} from "vscode-languageserver";
import {subscribe} from "diagnostics_channel";

export class PageHtml
{
    public events : customEvent[];
    public cheerioObj : cheerio.CheerioAPI
    public uri : string
    private eventNames : string[]
    public listenedToEventsPosition : listenedToObjects[]

    public constructor(cheerioObj: cheerio.CheerioAPI, uri : string) {
        this.listenedToEventsPosition = []
        this.events = []
        this.eventNames = []
        this.cheerioObj = cheerioObj
        this.uri = uri
        cheerioObj('body').children().each((index : any, element : cheerio.Element) => {
            this.processElement(element);
        })
    }

    public processElement(element : cheerio.Element) {
        element.children.forEach((child : cheerioType.ChildNode) => {
            if (child.type === 'tag') {
                const z = child.attribs
               Log.writeLspServer(child.attribs)
                const createdEvents = this.getCustomNotWindowEventsWithVariables(JSON.stringify(child.attribs))
                this.abstractListenedEvents()
                this.events.push(...createdEvents)
                this.processElement(child);
        }
     });
    }

    private abstractListenedEvents()
    {
        const nodeText = allFiles.get(this.uri)!
        const indLines = nodeText.split('\n')
        const regExpEvents = /@([a-z-]*)[=\.]+/g
        let match
        indLines.forEach((item,index) => {
            while ((match = regExpEvents.exec(item)) != null)
            {
                //do other checks
                if (match[1] != 'click')
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
        Log.writeLspServer('thats the array ')
        Log.writeLspServer(arr)
        let lineAmountFirstPart = arr[0].split('\n').length - 1

        Log.writeLspServer(lineAmountFirstPart.toString())
        arr.shift()
        Log.writeLspServer('get events with variables')
        arr.forEach((match : string, index) => {
            Log.writeLspServer(match)
            match = match.replace('\n','')
            const regExp = /^\(\s*'([a-z-]+)'(?:\s*,+\s*{((?:[a-zA-Z\s-]+:[a-z,0-9\s\n']+)+)}\s*|\s*)\)/
            const res = match.match(regExp)
            if (!res) return
            const keysVar: dispatchVariables  = {}
            if (res.length > 2 && res[2] )
            {
                const zu = res[2].split(',')

                zu.forEach(v => {
                    const p = v.split(':')
                    if (p.length == 2)
                    {
                        let value = p[1].indexOf("'") != -1 ? p[1].replace(/'/g, '') : parseFloat(p[1])
                        keysVar[p[0].trim()] = value
                    }

                })
            }

            if (this.eventNames.indexOf(res[1]) === -1)
            {
                let line = lineAmountFirstPart
                for (let i = 0; i <= index; i++)
                {
                    line += arr[i].split('\n').length - 1
                }

                Log.writeLspServer('thats the oinm i get')
                Log.writeLspServer(line.toString())
                customEvents.push({
                    name : res[1],
                    details: keysVar,
                    position: {
                       line,
                       character : 1
                    }
                })
                this.eventNames.push(res[1])
            }

        })

        const arr2 = allFiles.get(this.uri)!.split('\n')
        customEvents.forEach(item => {
            const regex:RegExp = new RegExp(`\\$dispatch\\(\\s*'${item.name}`, 'g')
            arr2.forEach((line,ind) => {
                const match = regex.exec(line)
                Log.writeLspServer(match)
                if (match)
                {
                    item.position.line = ind
                    item.position.character = match.index + 11
                }
            })
        })
        Log.writeLspServer(customEvents)

        return customEvents
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
