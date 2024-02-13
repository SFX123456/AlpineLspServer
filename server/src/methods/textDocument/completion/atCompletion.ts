import {addNecessaryCompletionItemProperties, completionResponse} from "../completion";
import {allHtml} from "../../../allFiles";
import {findAccordingRow} from "../../../cheerioFn";
import Log from "../../../log";
import {CompletionList, customEvent} from "../../../types/ClientTypes";
import {CompletionItem} from "../../../types/completionTypes";
import {atoptions} from "../../../at-validOptions";
import {Cheerio, Element} from "cheerio";

export const completionJustAT : completionResponse = async (line: number, character : number, uri: string | undefined) : Promise<CompletionList | null> =>
{
    const htmpPage = allHtml.get(uri!)!
    const node = findAccordingRow(line, htmpPage)
    Log.writeLspServer('@reaction')
    Log.writeLspServer(node!.toString())
    const allCustomEvents :customEvent[] = []
    for (let key of allHtml.keys()) {
        const allEventsHtmlPage = allHtml.get(key)
        allCustomEvents.push(...allEventsHtmlPage!.events)
    }
    const eventsWithoutWindow = getCustomNotWindowEventsWithVariables(node!)
    //z.map(item => item.name)
    const completionItemsEvents : CompletionItem[] =  allCustomEvents.map(item => {
        if (eventsWithoutWindow.indexOf(item.name) != -1)
        {
            return {
                label: `@${item.name}\${1:.stop}=" \${2:foo} "`,
                kind: 15,
                insertTextFormat : 2
            }
        }
        return {
            label: `@${item.name}\${1:.window}=" \${2:foo} "`,
            kind: 15,
            insertTextFormat : 2
        }
    })
    completionItemsEvents.push(...atoptions)


    const readyXoptions = addNecessaryCompletionItemProperties(completionItemsEvents, line, character)

    return {
        isIncomplete: false,
        items: readyXoptions
    }
}

export function getCustomNotWindowEventsWithVariables(node : Cheerio<Element>): string[]
{
    const customEvents :  string[] = []
    const content = node.toString()
        const arr = content.split('$dispatch')
        arr.shift()
        Log.writeLspServer('dispatch')
        Log.writeLspServer(content)
        arr.forEach((match : string) => {
            match = match.replace('\n','')
            const regExp = /^\(['\s]+([a-z-]+)(?:[\s',]+{([a-zA-Z\s,':0-9]+)}|[\s'])\)/
            const res = match.match(regExp)
            if (!res) return
            customEvents.push(res[1])

        })

        return customEvents
}
