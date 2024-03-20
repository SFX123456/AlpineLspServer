import * as cheerio from "cheerio";
import * as cheerioType from "domhandler/lib/node"
import Log from "../log";
import {customEvent, dispatchVariables, listenedToObjects} from "../types/ClientTypes";
import {allFiles, allHtml} from "../allFiles";
import {ExecutionSummary, InsertTextMode} from "vscode-languageserver";
import {subscribe} from "diagnostics_channel";
import {IsEventToIgnore} from "../EventToIgnore";
import {it} from "node:test";

export class PageHtml
{
    public events : customEvent[];
    public cheerioObj : cheerio.CheerioAPI
    public uri : string
    public listenedToEventsPosition : listenedToObjects[]

    public constructor(cheerioObj: cheerio.CheerioAPI, uri : string) {
        this.listenedToEventsPosition = []
        this.events = []
        this.cheerioObj = cheerioObj
        this.uri = uri
        cheerioObj('html').children().each((index : any, element : cheerio.Element) => {
            this.processElement(element);
        })
        this.setIndexesOfDispatchedEevents()
        this.abstractListenedEvents()
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

    private abstractListenedEvents()
    {
        const nodeText = allFiles.get(this.uri)!
        const indLines = nodeText.split('\n')
        const regExpEvents = /@([a-z-]*)[=\.]+/g
        let match
        indLines.forEach((item,index) => {
            while ((match = regExpEvents.exec(item)) != null)
            {
                if (!IsEventToIgnore(match[1]))
                {
                    console.log("added " + match[1])
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
        console.log(content)
        console.log('ananalyzed test '  +  content)
        const arr = content.split('$dispatch')
        if (!arr) return []
        arr.shift()
        arr.forEach((match : string, index) => {
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


                customEvents.push({
                    name : res[1],
                    details: keysVar,
                    position: {
                       line : 1,
                       character : 1
                    }
                })


        })

        return customEvents
    }

    private setIndexesOfDispatchedEevents()
    {
        console.log('\n\n\n\n')
        console.log('adding indexes')
        const arr2 = allFiles.get(this.uri)!.split('\n')
        const alreadyFoundEvents : Record<string, number> = {}
        this.events.forEach(item => {
            let counterFoundEvent = 0
            let found = false
            arr2.forEach((line,ind) => {
                console.log(line)
                const regex:RegExp = new RegExp(`\\$dispatch\\(\\s*'${item.name}`, 'gm')
                if (!found)
                {
                    const match = regex.exec(line)

                    if (match)
                    {
                        console.log(match)
                        if (alreadyFoundEvents[item.name])
                        {
                            console.log('trying for  ' + item.name)
                            if (counterFoundEvent == alreadyFoundEvents[item.name])
                            {
                                item.position.line = ind
                                item.position.character = match.index + 11
                                alreadyFoundEvents[item.name]++
                                found = true
                                console.log('counter fouhnd equal for ' + item.name + ' at linme ' + ind)
                            }
                            else {
                                console.log('countefound event not equal for  ' + item.name + ' ' + alreadyFoundEvents[item.name])
                            }
                        }
                        else {
                            item.position.line = ind
                            item.position.character = match.index + 11
                            alreadyFoundEvents[item.name] = 1
                            found = true
                            console.log(' event ' + item.name + ' set')
                        }
                        counterFoundEvent++;
                    }
                }
            })
        })
        console.log('\n\n\n\n')
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
