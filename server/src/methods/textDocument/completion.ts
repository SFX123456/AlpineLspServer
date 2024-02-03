import {RequestMessage} from "../../server";
import {allFiles, allHtml} from "../../allFiles";
import {TextDocumentItem} from "./didChange";
import log from "../../log";
import {CompletionItem, xoptions} from "../../x-validOptions";
import {getLastWord} from "../../analyzeFile";
import {findAccordingRow, getParentAndOwnVariables} from "../../cheerioFn";
import Log from "../../log";
import {boolean, func} from "vscode-languageserver/lib/common/utils/is";
import {atoptions, magicObjects} from "../../at-validOptions";
//add alpine data
export interface textDocument {
    textDocument: TextDocumentItem,
    position: Position
}

type Position = {
    line: number,
    character: number
}

interface CompletionList {
    isIncomplete: boolean;
    items: CompletionItem[];
}
export interface Range {
    start: Position,
    end: Position
}

type completionResponse = (line: number, char: number, uri? : string, lastWord? : string) => CompletionList | null

const completionVar : completionResponse = (line : number, char, uri, lastWord ) : CompletionList | null => {
    const htmpPage = allHtml.get(uri!)
    const node = findAccordingRow(line, htmpPage!)
    if (!node){
        Log.write("node did not found")
        return null
    }

    Log.write(node[0].attribs)
    const optionsStr = []
    optionsStr.push(...magicObjects)
    optionsStr.push(...getParentAndOwnVariables(node))

    Log.write('length of wariabelist ' + optionsStr.length)
    const options : CompletionItem[] = optionsStr.map(x => {
        if (x.indexOf('(') != -1) return {
            label: x,
            kind: 3
        }
        return {
            label: x,
            kind: 6
        }
    })
    if (!node)
    {
        log.write("could not find according row")
        return null
    }

    return {
        isIncomplete : false,
        items:
        options

    }
}



const completionJustAT : completionResponse = (line: number, char : number) : CompletionList | null =>
{
    const readyXoptions = addNecessaryCompletionItemProperties(atoptions, line, char)

    return {
        isIncomplete: false,
        items: readyXoptions
    }
}

const completionX : completionResponse = (line: number, char : number) : CompletionList | null =>
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


export const completion = (message : RequestMessage) : CompletionList => {
    const textDocument = message.params as textDocument

    const line = textDocument.position.line;
    const char = textDocument.position.character;
    const lastWord = getLastWord(textDocument)
    log.write(lastWord)
    if (!isInsideElement(line,char, textDocument.textDocument.uri))
    {
        log.write('not inside hmtl tag')
        return createReturnObject([])
    }
    log.write('inside html element')
    const lineStr = allFiles.get(textDocument.textDocument.uri)!.split('\n')[line]
    Log.write(lineStr)
    const key = getMatchingTableLookUp(lastWord,lineStr , char)
    if (!key) return createReturnObject([])
    const output = tableCompletion[key](line, char, textDocument.textDocument.uri, lastWord)
    if (!output) return createReturnObject([])
    return output
    /*
    const options = createSuggestions(line, char)
    return createReturnObject(options)

     */
}

function isInsideElement(line : number , char : number, uri: string): boolean {
    const startPattern =  /<[a-z]+\s/;
    const endPattern = />[\r]*$/;
    const arr = allFiles.get(uri)!.split('\n')
    let goUp = 0;
    let startTag = startPattern.exec(arr[line])
    while (!startTag && goUp < 200)
    {
        goUp++;
        startTag = startPattern.exec(arr[line - goUp])
    }
    log.write({openTag: line - goUp})
    let endTag = endPattern.exec(arr[line - goUp])
    let i = 0;
    while (!endTag && i < 200)
    {
        i++;
        endTag = endPattern.exec(arr[line - goUp + i])
    }
    log.write({endTag: line - goUp + i})
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

function getMatchingTableLookUp(lastWord : string, line: string, char: number): string | null
{
    if (isInsideParenthesis(line,char)) return 'insideP'
    if (lastWord === '@' ) return '@'
    if (lastWord.indexOf('x') != -1 && lastWord.length < 2) return 'x-'


    return null;
}

function isInsideParenthesis(line: string, char: number) : boolean
{
    const cutLine = line.substring(0, char)
    Log.write("starting")
    Log.write(cutLine)
    const matches = cutLine.match(/(?<!\\)"/)
    if (!matches) return false

    Log.write(matches)
    if ( matches.length % 2 == 0) return false
    const indexFirstP = cutLine.lastIndexOf('"')
    if (indexFirstP == 0) return false
    const regExp = /(x-[a-zA-Z]*="|@[a-zA-Z]*=")/
    const res = cutLine.match(regExp)
    Log.write(res)
    if (!res) return false
    Log.write("returned truw")
    return res[res.length - 1] != 'x-data'

}


