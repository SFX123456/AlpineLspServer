import * as cheerio from "cheerio";
import {allHtml} from "./allFiles";
import {PageHtml} from "./HtmlParsing/PageHtml";
import log from "./log";
import Log from "./log";
import {Cheerio, Element} from "cheerio";
import {it} from "node:test";
import {end} from "cheerio/lib/api/traversing";
import {isDataView} from "util/types";
import {regexEndingOpeningTag, regexOpeningTagHtml} from "./allRegex";

export function saveCheerioFile(text: string, uri : string)
{
    let contentLinesOr = text.split("\n")
    let contentLines = addLineAttributes(contentLinesOr)
    Log.writeLspServer("look here")
    Log.writeLspServer(contentLines)
    const finalStr = contentLines.join('\n')
    const cheer = cheerio.load(finalStr)
    const htmlPage = new PageHtml(cheer, uri.trim())
    Log.writeLspServer('savef  ile with uri ' + uri)
    allHtml.set(uri, htmlPage)
}
function addLineAttributes(contentLines : string[]) : string[]
{
    let endLines : Record<number, number> = {}
    let lastOpenRow = 0;
    const addedStartLine =  contentLines.map((line, i) : string => {
        const regExp = regexOpeningTagHtml
        const regExpEnd = regexEndingOpeningTag
        const regexMatch = line.match(regExp)
        const regExEndMatch = line.match(regExpEnd)

        if (regexMatch)
        {
            const ind =  regexMatch!.index;
            const lengthMatch = regexMatch[0].length;
            const toAdd = `x-line=\"${i}\"  `
            lastOpenRow = i
            if (regExEndMatch)
            {
                Log.writeLspServer("ok regex worked " + i.toString())
                endLines[lastOpenRow] = i
            }
            return  line.substring(0, ind! + lengthMatch) + toAdd + line.substring(ind! + lengthMatch)
        }

        return line;
    })

   return addedStartLine.map((item: string, line: number) => {
       if (endLines[line])
       {
           const startIndex = item.indexOf("x-line")

          const firstPart = item.substring(0,startIndex)
           const secondPart = item.substring(startIndex)
           return firstPart + "x-end=\"" + endLines[line] + "\"" + secondPart
       }
       return item
   })
}




export function findAccordingRow(row : number, htmlPage : PageHtml)
{
    while (row >= 0)
    {
        const node = htmlPage.cheerioObj(`[x-line=\"${row}\"]`).first()
        if (node.length)
        {
            return node;
        }
        row--;
    }
    return null;
}

export function getParentAndOwnVariables(node : Cheerio<Element>): string[]
{
    const variables : string[] = []

    while (true)
    {
        const data = node[0].attribs["x-data"]
        Log.write("checking if line has data" + data)

        if (data)
        {
            data.split(",").forEach((keyVal : string) => {
                Log.write(keyVal)
                const key = keyVal.split(":")[0]
                    .split(' {')[0]
                    .replaceAll("{", "")
                    .replaceAll('}', '')
                    .trim()
                variables.push(key)
            })
        }

        const parentNodeArr= node.parent()
        if (parentNodeArr.length)
        {
            node = node.parent()
        }
        else
        {
            break
        }
    }
    return variables;
}









