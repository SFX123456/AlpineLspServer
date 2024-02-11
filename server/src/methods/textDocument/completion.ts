import {RequestMessage} from "../../server";
import {allFiles, allHtml} from "../../allFiles";
import {TextDocumentItem} from "./didChange";
import {CompletionItem, xoptions} from "../../x-validOptions";
import {findAccordingRow, getParentAndOwnVariables} from "../../cheerioFn";
import Log from "../../log";
import {atoptions, magicObjects} from "../../at-validOptions";
import {requestingMethods} from "../../StartTypescriptServer";
import {Position} from "../../ClientTypes";
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

const completionJustAT : completionResponse = async (line: number, char : number) : Promise<CompletionList | null> =>
{
    const readyXoptions = addNecessaryCompletionItemProperties(atoptions, line, char)

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
    const startPattern =  /="/
    const endPattern = /(?<![\\=])"/
    const arr = allFiles.get(uri)!.split('\n')
    let goUp = 0;
    let startTag = startPattern.exec(arr[line])
    while (!startTag && goUp < 200 && line - goUp > 0)
    {
        goUp++;
        startTag = startPattern.exec(arr[line - goUp])
    }
    if (!startTag) return false
    let openingiIndex = arr[line - goUp].lastIndexOf('="') + 2
    let endTag = endPattern.exec(arr[line - goUp])
    if (endTag)
    {
        if (endTag.index < openingiIndex )
        {
            endTag = null
        }
    }

    let i = 0;
    while (!endTag && i < 200 && line - goUp + i < arr.length - 1)
    {
        i++;
        endTag = endPattern.exec(arr[line - goUp + i])
    }
    if (!endTag) return false
    return line - goUp + i >= line
        && line - goUp <= line
        && ( startTag!.index + 2 < char || goUp != 0 )
        && ( endTag!.index  > char || goUp - i != 0 )
}

function getOpeningIdentifierIndex(wholeLine : string, character : number) : number
{

    const lineTillCharacter = wholeLine.substring(0, character)
    return lineTillCharacter.lastIndexOf('="') + 2
}

function getOpeningParenthesisPosition(uri: string, line:number, character: number) : Position | null
{
    const content = allFiles.get(uri)!
    const regExpEndParenthesis = /(?<![\\=])"/
    const regExpStart= /="/

    const wholeLineSubStr = content.split('\n')[line].substring(0, character)
    const res = wholeLineSubStr.match(regExpStart)

    if (res)
    {
        return {
            line: line,
            character: res.index! + 2
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
        output += '\n'
    }
    return output
}

function generateFullTextForLspJavascript(uri : string,variables : string[], line : number, character : number)
{
    const fullText = getAllJavascriptCode(uri, line, character)
    let varAsTextStr = variables.map(x => 'let ' + x + ';' ).join('')
    const openingTagIndex = getOpeningParenthesisPosition(uri, line, character)
    if (!openingTagIndex || fullText == '') return ''

    for (let i = 0; i < openingTagIndex.line; i++)
    {
        varAsTextStr += '\n'
    }
    return varAsTextStr + fullText
}


function getLastWord(wholeLine : string, character : number): string {
    let spaceCharIndex = wholeLine.substring(0, character).lastIndexOf(' ')
    let startTagIndex = wholeLine.substring(0, character).lastIndexOf('<')
    let startIndex = Math.max(spaceCharIndex, startTagIndex)
    let spaceCharIndexEnd = wholeLine.substring(character).indexOf(' ')
    let endTagIndex = wholeLine.substring(character).indexOf('>');
    if (endTagIndex == -1) endTagIndex = 900
    if (spaceCharIndexEnd == -1) spaceCharIndexEnd = 900
    let endIndex = Math.min(spaceCharIndexEnd, endTagIndex, wholeLine.length - character)
    return wholeLine.substring(startIndex + 1, endIndex + character)
}


