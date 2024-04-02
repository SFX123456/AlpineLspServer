import {allHtml} from "./allFiles";
import {PageHtml} from "./HtmlParsing/PageHtml";
import log from "./log";
import Log from "./log";
import {regexEndingOpeningTag, regexOpeningTagHtml} from "./allRegex";
import cheerio, { Cheerio, Element } from 'cheerio';
import {InsertTextMode} from "vscode-languageserver";

export function saveCheerioFile(text: string, uri : string)
{
    let contentLinesOr = text.split("\n")
    let contentLines = addLineAttributes(contentLinesOr)
    Log.writeLspServer("look here")
    Log.writeLspServer(contentLines)
    let finalStr = contentLines.join('\n')
    finalStr = replaceUnknownTags(finalStr)
    const cheer = cheerio.load(finalStr)
    const htmlPage = new PageHtml(cheer, uri.trim())
  //  Log.writeLspServer('savef  ile with uri ' + uri)
    allHtml.set(uri, htmlPage)
}
function replaceUnknownTags(text : string) : string
{
    return text.replaceAll('template','section')
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



export function getParentAndOwnIdScopes(node : Cheerio<Element>): string[]
{
    const idNameSpaces : string[] = []

    while (true)
    {
        const data = node[0].attribs["x-id"]
        Log.writeLspServer('for data ' + data,1)
        if (data)
        {
            try {
                const regExp = /\[\s*(['a-zA-Z-,]+)\s*\]/
                const res = regExp.exec(data)
                if (!res) continue
                res[1].split(',').map(item => {
                    idNameSpaces.push(item.replaceAll('\'','').trim())
                })
            }
            catch (e)
            {
                Log.writeLspServer('error parsing x-id',1)
            }
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
    return idNameSpaces;
}

export function getParentAndOwnVariablesXData(node: Cheerio<Element>, variablesToBuldXData : string[]) : string[]
{

    const variables : string[] = []

    while (true)
    {
        const data = node[0].attribs["x-data"]
        Log.writeLspServer('for data ' + data,1)
        if (data)
        {
            try {

                Log.writeLspServer('mx1',1)
                const func = new Function(`return ${data}`)
                const obj = func()
                Log.writeLspServer('mx2',1)
                let keys = Object.keys(obj)
                variablesToBuldXData.push(...keys)
                const strToPush = '{ ' + keys.join(', ') + '} = ' + data
                Log.writeLspServer('here5 ' + strToPush,1)
                variables.push(strToPush)
            }
            catch (e)
            {
                Log.writeLspServer('error parsing x-data',1)
            }
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


export function getFirstXDataTagName(node : Cheerio<Element>) : string | null
{
    while (true)
    {
        const data = node[0].attribs["x-data"]
        if (data)
        {
            return node[0].tagName
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
    return null;
}

export function getParentAndOwnVariablesJustNamesNoFunctions(node: Cheerio<Element>, variablesToBuldXData : string[]) : string[]
{

    const variables : string[] = []

    while (true)
    {
        const data = node[0].attribs["x-data"]
        Log.writeLspServer('for data ' + data,1)
        if (data)
        {
            try {

                Log.writeLspServer('mx1',1)
                const func = new Function(`return ${data}`)
                const obj = func()
                Log.writeLspServer('mx2',1)
                let keys = Object.keys(obj)
                keys.forEach(item => {
                    if ( typeof obj[item] != 'function')
                    {
                        variablesToBuldXData.push(item)
                    }
                })
                const strToPush = '{ ' + keys.join(', ') + '} = ' + data
                Log.writeLspServer('here5 ' + strToPush,1)
                variables.push(strToPush)
            }
            catch (e)
            {
                Log.writeLspServer('error parsing x-data',1)
            }
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
export function getParentAndOwnVariables(node : Cheerio<Element>, uri : string): string[]
{
    const variables : string[] = []

    while (true)
    {
        const data = node[0].attribs["x-data"]
        const xFor = node[0].attribs["x-for"]
        if (xFor)
        {
                const regExp = /([a-z]+)\s*,\s*([a-z]+)\s*\)(\s+)in(\s+)([a-z-]+)/g
                const res = regExp.exec(xFor)
                if (res)
                {
                    Log.writeLspServer(res[1],1)
                    variables.push(res[1])
                    variables.push(res[2])
                }
            else
            {
                const regExp = /([a-z-]+)(\s+)in(\s+)([a-z-]+)/g
                const res = regExp.exec(xFor)
                if (res)
                {
                    variables.push(res[1] + ' = ' + res[4] + '[0]' )
                }

            }
        }
        if (data)
        {
            if (data.indexOf('{') != -1 && data.indexOf('}') != -1)
            {
                try {
                    const strToPush = extractKeysAndGenerateStr(data,[])
                    variables.push(strToPush)
                }
                catch (e)
                {
                    Log.writeLspServer('error parsing x-data',1)
                }
            }
            else {
                const maybeDataName = data.trim()
                if (allHtml.get(uri)!.allDataComp[maybeDataName])
                {
                    variables.push(allHtml.get(uri)!.allDataComp[maybeDataName])
                }
            }
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


export function extractKeysAndGenerateStr(data : string, keys : string[])
{
    const func = new Function(`return ${data}`)
    const obj = func()
    Log.writeLspServer('mx2',1)
    keys.push(...Object.keys(obj))
    return  '{ ' + keys.join(', ') + '} = ' + data
}












