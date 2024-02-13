import {RequestMessage} from "../../server";
import {allFiles, allHtml} from "../../allFiles";
import {TextDocumentItem} from "./didChange";
import {CompletionItem, xoptions} from "../../x-validOptions";
import {
    findAccordingRow,
    getCustomNotWindowEventsWithVariables,
    getParentAndOwnVariables
} from "../../cheerioFn";
import Log from "../../log";
import {atoptions, magicObjects} from "../../at-validOptions";
import {requestingMethods} from "../../StartTypescriptServer";
import {customEvent, Position} from "../../ClientTypes";
import {write} from "fs";
//add alpine data
export interface textDocument {
    textDocument: TextDocumentItem,
    position: Position
}



interface CompletionList {
    isIncomplete: boolean;
    items: CompletionItem[];
}
export interface Range {
    start: Position,
    end: Position
}

type completionResponse = (line: number, char: number, uri? : string, lastWord? : string) => Promise<CompletionList | null>

interface completionResponseType {
    id: number,
    result: object
}


const completionVar : completionResponse = async (line : number, character : number, uri : string | undefined) : Promise<CompletionList | null> => {
    Log.write('completion requested')
    let optionsStr : string[] = []
    optionsStr.push(...magicObjects)



    Log.writeLspServer(line.toString())
    Log.writeLspServer(character.toString())

    const htmpPage = allHtml.get(uri!)

    const node = findAccordingRow(line, htmpPage!)
    if (!node){
        Log.write("node did not found")
        return null
    }
    const eventName = getEventName(uri!, line, character)
    if (eventName)
    {
        Log.writeLspServer('eventname found')
        Log.writeLspServer(eventName)
        allHtml.get(uri!)!.events.forEach(item => {
            if (item.name == eventName)
            {
                let full = buildMagiceventVar(item)

                Log.writeLspServer('check here')
                Log.writeLspServer(full)
                optionsStr.push(full)
            }
        })
    }
    Log.write(node[0].attribs)




    optionsStr.push(...getParentAndOwnVariables(node))
    const javascriptText = generateFullTextForLspJavascript(uri!, optionsStr, line, character)
    Log.writeLspServer('string to parse ' + javascriptText)


    const res = await requestingMethods( 'completion', javascriptText, line, character)
    Log.writeLspServer('completion got following res')
    Log.writeLspServer(res)
    Log.writeLspServer('completion two')


    if (res)
    {

        const message = res as completionResponseType
        try {

            //@ts-ignore
            const items = message.result.items
            Log.writeLspServer('search for')
            Log.writeLspServer(items)
            return {
                isIncomplete : true,
                items: items
            }
        }
        catch (e)
        {
            Log.writeLspServer('error here')
           Log.writeLspServer(e)
        }


    }


    return null
}

function getEventName(uri: string, line: number, character: number) : string | null
{
    const arr = allFiles.get(uri)!.split('\n')
    let lineFound = line
    let char = character
    while (lineFound >= 0)
    {

        let subStrLine = lineFound == line ? arr[lineFound].substring(0, char) : arr[lineFound]
        const match = subStrLine.lastIndexOf('="')
        if (match != -1)
        {
            const lastIndexWhitespace = subStrLine.substring(0, match).lastIndexOf(' ')
            if (subStrLine[lastIndexWhitespace + 1] === '@')
            {
                return subStrLine.substring(lastIndexWhitespace + 2, match)
            }
            return null
        }
        lineFound--

    }
    return null

}

const completionJustAT : completionResponse = async (line: number, character : number, uri: string | undefined) : Promise<CompletionList | null> =>
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
                label: `@${item.name}=" \${1:foo} ".stop`,
                kind: 15,
                insertTextFormat : 2
            }
        }
         return {
                label: `@${item.name}=" \${1:foo} ".window`,
                kind: 15,
                insertTextFormat : 2
        }
    })
    completionItemsEvents.push(...atoptions)
    /*
    if (!node){
        Log.write("node did not found")
        return null
    }

     */
    //const customEvents = getCustomEvents(node)
    const readyXoptions = addNecessaryCompletionItemProperties(completionItemsEvents, line, character)

    return {
        isIncomplete: false,
        items: readyXoptions
    }
}

const completionX : completionResponse = async (line: number, char : number) : Promise<CompletionList | null> =>
{
    const readyXoptions = addNecessaryCompletionItemProperties(xoptions, line, char)

    return {
        isIncomplete: false,
        items: readyXoptions
    }
}

function addNecessaryCompletionItemProperties(options : CompletionItem[], line: number, char : number)
{
    return options.map(x => {
        if (x.insertTextFormat === 2) {
            x.textEdit = {
                range: {
                    start: {
                        line: line,
                        character: char - 1
                    },
                    end: {
                        line: line,
                        character: char
                    }
                },
                newText: x.label
            }
        }
        return x
    })
}

const tableCompletion : Record<string, completionResponse> = {
    'insideP' : completionVar,
    '@' : completionJustAT,
    'x-' :  completionX
}


export const completion = async (message : RequestMessage) : Promise<CompletionList | null> => {

    Log.writeLspServer('1. completion called')
    const textDocument = message.params as textDocument

    const line = textDocument.position.line;
    const wholeLine = allFiles.get(textDocument.textDocument.uri)!.split('\n')[line]
    const character = textDocument.position.character;
    const lastWord = getLastWord(wholeLine, character)
    Log.write('lastword ' + lastWord)

    if (!isInsideElement(line,character, textDocument.textDocument.uri))
    {
        Log.write('not inside hmtl tag')
        return createReturnObject([])
    }

    Log.write('inside html element')
    Log.write(wholeLine)
    const key = getMatchingTableLookUp(textDocument.textDocument.uri, lastWord,line , character)
    Log.write(' 2 key: ' + key)
    if (!key) return createReturnObject([])

    let res = tableCompletion[key]( line, character, textDocument.textDocument.uri, lastWord)
    const output = await res
    Log.writeLspServer('response for completion')
    Log.writeLspServer(output)
    if (!output) return createReturnObject([])
    return output



}

function isInsideElement(line : number , char : number, uri: string): boolean {
    const startPattern =  /<[a-z]+\s/;
    const endPattern = />[\r]*$/;
    const arr = allFiles.get(uri)!.split('\n')
    let goUp = 0;
    let startTag = startPattern.exec(arr[line])
    while (!startTag && goUp < 200 && line - goUp > 0)
    {
        goUp++;
        if (line - goUp == 0)
        startTag = startPattern.exec(arr[line - goUp])
    }
    if (!startTag) return false
    Log.write({openTag: line - goUp})
    let endTag = endPattern.exec(arr[line - goUp])
    let i = 0;
    while (!endTag && i < 200 && line - goUp + i < arr.length - 1)
    {
        i++;
        endTag = endPattern.exec(arr[line - goUp + i])
    }
    Log.write({endTag: line - goUp + i})
    return line - goUp + i >= line
        && line - goUp <= line
        && ( startTag!.index + 2 < char || goUp != 0 )
        && ( endTag!.index  > char || goUp - i != 0 )
}

function createReturnObject(arr : CompletionItem[]) :CompletionList
{
    return {
        isIncomplete: false,
        items: arr
    }
}

function getMatchingTableLookUp(uri: string, lastWord : string, line: number, character: number): string | null
{
    if (isInsideParenthesis(line,character, uri)) return 'insideP'
    if (lastWord === '@' ) return '@'
    if (lastWord.indexOf('x') != -1 && lastWord.length < 2) return 'x-'


    return null;
}

function isInsideParenthesis(line : number , char : number, uri: string): boolean {
    const startPattern =  /="/g
    const endPattern = /(?<![\\=])"/g
    const arr = allFiles.get(uri)!.split('\n')
    let goUp = 0;
    let startTag : any
    let lastMatchIndex = 0
    let foundAMatch = false
    let wholeLineSubStrTillChar = arr[line].substring(0, char)
    while (!foundAMatch && goUp < 200 && line - goUp >= 0)
    {

        while ((startTag = startPattern.exec(arr[line - goUp])) !== null) {
            if (startTag.index < char)
            {
                foundAMatch = true

                lastMatchIndex = startTag.index;
            }
        }

        goUp++;
    }
    goUp--
    if (!foundAMatch) return false

    let endTag : any

    foundAMatch = false
    let lastMatchEndingIndex = 0
    let i = 0;
    const endPatternHtml = />[\r]*$/;
    while (!foundAMatch && i < 200 && line - goUp + i < arr.length - 1)
    {
        while ((endTag = endPattern.exec(arr[line - goUp + i])) !== null) {
            if (endTag.index > char)
            {
                foundAMatch = true
                lastMatchEndingIndex = endTag.index;
            }
        }
        if (!foundAMatch)
        {
            if (arr[line - goUp + i].match(endPatternHtml))
            {
                return false
            }
        }
        i++
    }
    i--;
    if (!foundAMatch) return false
    Log.writeLspServer('here to search')
    Log.writeLspServer(lastMatchIndex.toString())
    Log.writeLspServer(goUp.toString())
    Log.writeLspServer((goUp - i).toString())
    return line - goUp + i >= line
        && line - goUp <= line
        && (lastMatchIndex + 2 < char || goUp != 0 )
        && ( lastMatchEndingIndex  > char || goUp - i != 0 )
}




function getOpeningParenthesisPosition(uri: string, line:number, character: number) : Position | null
{
    const content = allFiles.get(uri)!
    const regExpEndParenthesis = /(?<![\\=])"/
    const regExpStart= /="/g

    const wholeLineSubStr = content.split('\n')[line].substring(0, character)
    let res
    let lastIndex = 0
    let hit = false
    while ((res = regExpStart.exec(wholeLineSubStr)) != null )
    {
        hit = true
        lastIndex = res.index!
    }

    if (hit)
    {
        return {
            line: line,
            character: lastIndex + 2
        }
    }

    line--
    const position = getOpeningTagPosition(uri, line)
    if (position == null) return null
    const openingTagIndexLine = position.line
    const openingTagIndexCharacter = position.character
    while (line >= openingTagIndexLine)
    {

        const lineStr = content.split('\n')[line]
        const resStart = lineStr.match(regExpStart)
        //const resEnd = lineStr.match(regExpEndParenthesis)
        const res = lineStr.match(regExpEndParenthesis)
        if (res != null)
        {
            if (resStart == null)
            {
                return null
            }

            if (line == openingTagIndexCharacter) {
                if (resStart.index! < openingTagIndexCharacter)
                {
                    return null
                }
            }
            if (resStart.index! > res.index!)
            {
                return {
                    line: line,
                    character: resStart.index! + 2
                }
            }
            return null
        }
        if (resStart != null)
        {
            return {
                line: line,
                character : resStart.index! + 2
            }
        }
        line--
    }
    return null


}


function getEndingParenthesisPosition(uri: string, line: number, character: number) :Position | null
{
    const content = allFiles.get(uri)!
    const lineSubstr = content.split('\n')[line].substring(character)
    const regExpEndParenthesis = /(?<!\\)"/
    const regExpStart= /(x-[a-zA-Z]*="|@[a-zA-Z]*=")/
    const res = lineSubstr.match(regExpEndParenthesis)
    if (res != null)
    {
        return {
            line : line,
            character : res.index! + character
        }
    }
    line++
    const position = getEndTagPosition(uri, line)
    if (position == null) return null
    const closingTagIndexLine = position.line
    const closingTagIndexCharacter = position.character
    while (line <= closingTagIndexLine)
    {

        const lineStr = content.split('\n')[line]
        const resEnd = lineStr.match(regExpEndParenthesis)


        const res = lineStr.match(regExpStart)

        if (res != null)
        {
            if (resEnd == null)
            {
                return null
            }


            if (line == closingTagIndexLine) {
                if (resEnd.index! > closingTagIndexCharacter)
                {
                    return null
                }
            }
            if (resEnd.index! < res.index!)
            {
                return {
                    line: line,
                    character: resEnd.index!
                }
            }
            return null

        }
        if (resEnd != null)
        {
            return {
                line: line,
                character : resEnd.index!
            }
        }
        line++
    }
    return null
}

function getEndTagPosition(uri: string, line : number) : Position | null
{

    const endPattern = />[\r]*$/;
    let res = null
    do
    {
        const wholeLine = allFiles.get(uri)!.split('\n')[line]
        res = wholeLine.match(endPattern)
        if (res != null)
        {
            return {
                line : line,
                character : res.index!
            }
        }
        line++
    }while (res == null)
    return null
}

function getOpeningTagPosition(uri: string, line: number) : Position | null
{
    const startPattern =  /<[a-z]+\s/;
    let res = null
    do
    {
        const wholeLine = allFiles.get(uri)!.split('\n')[line]
        res = wholeLine.match(startPattern)
        if (res != null)
        {
            return {
                line : line,
                character : res.index!
            }
        }
        line--
    }while (res == null)
    return null
}


function getAllJavascriptCode(uri: string, line: number, character : number ) : string
{
    const openingParenthesisPosition = getOpeningParenthesisPosition(uri, line, character)
    const endingParenthesisPosition = getEndingParenthesisPosition(uri, line, character)
    if (!openingParenthesisPosition || !endingParenthesisPosition)
    {
        return ''
    }
    let output = ''
    const content = allFiles.get(uri)!.split('\n')
    for (let i = openingParenthesisPosition.line; i <= endingParenthesisPosition.line; i++)
    {
        //  console.log(allFiles.get(uri)!.split('\n')[i])
        let c = openingParenthesisPosition.line == i ? openingParenthesisPosition.character : 0
        let cEnd = endingParenthesisPosition.line == i ? endingParenthesisPosition.character : content[i].length
        for (let column = 0; column < cEnd; column++)
        {
            if (openingParenthesisPosition.line == i && column < openingParenthesisPosition.character)
            {
                output += ' '
            }
            else
            {
                output += content[i][column]
            }
        }
        if (i != endingParenthesisPosition.line)
            output += '\n'
    }
    return output
}
export function getAllJavaScriptText(uri: string )
{
    const regExpStart = /([a-z]+)="/g
    const arrLines = allFiles.get(uri)!.split('\n')
    let output = ''
    let lastY = 0
    arrLines.forEach((lineStr , line) => {
        let match :any
        while((match = regExpStart.exec(lineStr)) != null)
        {
            if (match[1] === 'data'){

                continue
            }
            const fullText = getAllJavascriptCode(uri, line, match.index + 2 + match[1].length)
            if (lastY == line)
            {
                const input = output.split('\n')
                const laenge = input[line].length
                input[line] += fullText.substring(laenge)
                output = input.join('\n')
                continue
            }
            while (lastY < line )
            {
                lastY++
                output += '\n'
            }
            const lineBreakCount = fullText.split('\n').length
            lastY += lineBreakCount
            lastY--
            output += fullText
        }
    })
    for (let i = 0; i < 500;i++)
    {
        output += '\n'
    }
    output += (magicObjects.map(x => ' var ' + x +'; ').join(''))
    Log.writeLspServer('should have added')
    Log.writeLspServer(output)
    Log.writeLspServer(magicObjects[0].toString())
    return output
}

function generateFullTextForLspJavascript(uri : string,variables : string[], line : number, character : number)
{
    const fullText = getAllJavascriptCode(uri, line, character)
    let fullTextWithVariables = fullText
    for (let i = 0; i < 500; i++)
    {
        fullTextWithVariables+= '\n'
    }
    let varAsTextStr = variables.map(x => 'var ' + x + ';' ).join('')
    varAsTextStr += (magicObjects.map(x => ' var ' + x +'; ').join(''))
    const openingTagIndex = getOpeningParenthesisPosition(uri, line, character)
    if (!openingTagIndex || fullText == '') return ''
    let beforeText = ''
    for (let i = 0; i < openingTagIndex.line; i++)
    {
        beforeText += '\n'
    }
    return beforeText + fullTextWithVariables + varAsTextStr
}


function getLastWord(wholeLine : string, character : number): string {
    let spaceCharIndex = wholeLine.substring(0, character).lastIndexOf(' ')
    let startTagIndex = wholeLine.substring(0, character).lastIndexOf('<')
    let startOpenExpr = wholeLine.substring(0, character).lastIndexOf('="') + 1
    let startIndex = Math.max(spaceCharIndex, startTagIndex, startOpenExpr)
    let spaceCharIndexEnd = wholeLine.substring(character).indexOf(' ')
    let endTagIndex = wholeLine.substring(character).indexOf('>');
    if (endTagIndex == -1) endTagIndex = 900
    if (spaceCharIndexEnd == -1) spaceCharIndexEnd = 900
    let endIndex = Math.min(spaceCharIndexEnd, endTagIndex, wholeLine.length - character)
    return wholeLine.substring(startIndex + 1, endIndex + character)
}


function buildMagiceventVar(item : customEvent )
{
    const keys = Object.keys(item.details)
    let tempStr = keys.map(key => {
        let tempStr = ' '
        tempStr += key
        tempStr += ' : '
        tempStr += item.details[key]
        return tempStr
    }).join(',')

    return  '$event = ' + '{ target: { ' +  tempStr   +  '  }, srcElement : { dispatchEvent: 5 } } '
}


