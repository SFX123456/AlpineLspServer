import * as cheerio from "cheerio";
import {allHtml} from "./allFiles";
import {PageHtml} from "./HtmlParsing/PageHtml";
import log from "./log";

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






