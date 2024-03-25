import {allHtml} from "./allFiles";
import {PageHtml} from "./HtmlParsing/PageHtml";
import log from "./log";
import Log from "./log";
import {regexEndingOpeningTag, regexOpeningTagHtml} from "./allRegex";
import cheerio, { Cheerio, Element } from 'cheerio';

export function saveCheerioFile(text: string, uri : string)
{
    let contentLinesOr = text.split("\n")
    let contentLines = addLineAttributes(contentLinesOr)
    Log.writeLspServer("look here")
    Log.writeLspServer(contentLines)
    const finalStr = contentLines.join('\n')
    const cheer = cheerio.load(finalStr)
    const htmlPage = new PageHtml(cheer, uri.trim())
  //  Log.writeLspServer('savef  ile with uri ' + uri)
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

export function getAccordingRefs(node: Cheerio<Element>): any[] {
    const refs: any[] = [];
    const parentNode = node.parent();

    // Make sure to pass a Cheerio object to the helper function
    getRefsFromNodeAndChildren2(parentNode, refs);
    return refs;
}

function getRefsFromNodeAndChildren2(element: Cheerio<Element>, refs: any[]): void {
    element.each((_, childElement) => {
//        Log.writeLspServer(childElement,1)
        const child = cheerio(childElement);

        if (childElement.type === 'tag' && childElement.attribs) {
            const ref = childElement.attribs['x-ref'];
            if (ref) {
                refs.push({
                    tag: childElement.tagName,
                    name: ref
                });
            }
            getRefsFromNodeAndChildren2(child.children(), refs);
        }
    });
}


export function createRefsStr(arr : any[])
{
    let output = 'var $refs = { '
    arr.forEach(item => {
        output += item.name
        output += ' : '
        output+= 'document.createElement("' + item.tag + '"),'
    })

    output += ' }'
    return output
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
            const func = new Function(`return ${data}`)
            const obj = func()
            /*
            Object.keys(obj).forEach(item => {
                variables.push(item)
            })
             */
             JSON.stringify(obj, function(key, value) {
                // Check if the value is a function
                if (typeof value === 'function') {
                    // Convert the function to a string
                    variables.push(' function ' + value.toString());
                    return 'sdf'
                }
                variables.push(' ' + key)
                return value;
            });

            /*
            data.split(",").forEach((keyVal : string) => {
                Log.write(keyVal,1)
                const key = keyVal.split(":")[0]
                    .split(' {')[0]
                    .replaceAll("{", "")
                    .replaceAll('}', '')
                    .trim()
                variables.push(key)
            })

             */
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









