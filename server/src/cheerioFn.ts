import * as cheerio from "cheerio";
import {allHtml} from "./allFiles";
import {PageHtml} from "./HtmlParsing/PageHtml";
import log from "./log";
import Log from "./log";
import {Cheerio, Element} from "cheerio";
import {func} from "vscode-languageserver/lib/common/utils/is";

export function saveCheerioFile(text: string, uri : string)
{
    log.write('sparsing html ')
    let contentLinesOr = text.split("\n")
    let contentLines = addLineAttributes(contentLinesOr)
    const finalStr = contentLines.join('\n')
    const cheer = cheerio.load(finalStr)
    const htmlPage = new PageHtml(cheer)
    allHtml.set(uri, htmlPage)
}
function addLineAttributes(contentLines : string[]) : string[]
{
    return contentLines.map((line, i) : string => {
        const regExp = /<[a-z]+\s/;
        const regexMatch = line.match(regExp)
        if (regexMatch)
        {
            const ind =  regexMatch!.index;
            const lengthMatch = regexMatch[0].length;
            const toAdd = `x-line=\"${i}\"  `
            return  line.substring(0, ind! + lengthMatch) + toAdd + line.substring(ind! + lengthMatch)
        }
        return line;
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
    let run = true;

    while (run)
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

            Log.write("found something in row")
        }
        else
        {
            Log.write("found nothing in row")
        }

        const parentNodeArr= node.parent()
        if (parentNodeArr.length)
        {
            node = node.parent()
        }
        else
        {
            run = false
        }
    }
    return variables;
}





