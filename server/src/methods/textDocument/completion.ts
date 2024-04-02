import {RequestMessage} from "../../server";
import Log from "../../log";
import {CompletionList, lastWordSuggestion, textDocumentType} from "../../types/ClientTypes";
import {CompletionItem} from "../../types/completionTypes";
import {completionJustAT} from "./completion/atCompletion";
import {completionJs} from "./completion/completionJs";
import {getLastWord, getLastWordWithUriAndRange, isInsideElement} from "../../analyzeFile";
import {CodeBlock} from "../../CodeBlock";
import {completionX} from "./completion/xCompletion";
import {chainableOnAt, chainableOnAtKeyboard} from "../chainableOnAt";
import {chainableOnXShow} from "../../x-validOptions";
import {doublePointCompletions} from "../../doublePoint-validOptions";
import {
    getJavascriptBetweenQuotationMarksPosition,
    isInsideTag,
    positionTreeSitter
} from "../../treeSitterHmtl";

export type completionResponse = (line: number, char: number, uri? : string, lastWord? : string) => Promise<CompletionList | null>

export interface completionResponseType {
    id: number,
    result: object
}

export function addNecessaryCompletionItemProperties(options : CompletionItem[] | string[], line: number, char : number) : CompletionItem[]
{
    if (!options.length)
    {
        return []
    }
    if (typeof options[0] == 'string')
    {
        const optionsStr = options as string[]

        return optionsStr.map(x=> {
            return {
                label: x,
                kind : 6
            }
        })
    }
    const optionsComp = options as CompletionItem[]

    return optionsComp.map(x => {

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
    '@' : completionJustAT,
    'x-' :  completionX,
    '@.' : completionAtPoint,
    ':' : completionDoublePoint
}

async function completionAtPoint(line : number, char : number, uri : string | undefined, lastWord : string | undefined) : Promise<CompletionList | null>
{
    Log.writeLspServer('completion at point called')
    const lastWordWithoutAt = lastWord!.substring(1)
    const arr = lastWordWithoutAt.split('.')

    if (arr[0] == '-show') return createReturnObject(addNecessaryCompletionItemProperties(chainableOnXShow,line, char))
    if (arr[0] === 'keydown' || arr[0] === 'keyup')
    {

        return createReturnObject(addNecessaryCompletionItemProperties(chainableOnAtKeyboard, line, char))
    }

    return createReturnObject(addNecessaryCompletionItemProperties(chainableOnAt,line, char))
}

async function completionDoublePoint(line : number, char : number, uri : string | undefined, lastWord : string | undefined) : Promise<CompletionList | null>
{
    Log.writeLspServer('completion at doublepoint called',1)
    return createReturnObject(addNecessaryCompletionItemProperties(doublePointCompletions,line,char))
}

export const completion = async (message : RequestMessage) : Promise<CompletionList | null> => {

    Log.writeLspServer('completion called',1)
    const textDocumentt = message.params as textDocumentType

    const line = textDocumentt.position.line;
    const character = textDocumentt.position.character;
    const lastWord = getLastWordWithUriAndRange(textDocumentt.textDocument.uri,{
        line,
        character
    })
    Log.writeLspServer('lastWordSuggestion: ' + JSON.stringify(lastWord),1)
    const position : positionTreeSitter = {
        row : line,
        column : character
    }
    const isInside = isInsideTag(position,textDocumentt.textDocument.uri)
    Log.writeLspServer('checking if inside Tag',1)
    if (!isInside)
    {
        Log.writeLspServer('is not inside tag ',1)

        return null
    }
    Log.writeLspServer('get delimiting quotation marks')
    const javaScriptbetweemQuotationMarks = getJavascriptBetweenQuotationMarksPosition(textDocumentt.textDocument.uri,position )
    if (javaScriptbetweemQuotationMarks)
    {
       Log.writeLspServer('is inside quptation marks awaiting completionJS ',1)
       const output = await completionJs(line, character, textDocumentt.textDocument.uri,javaScriptbetweemQuotationMarks )

       if (!output) return createReturnObject([])

       return output
    }
    Log.writeLspServer('not inside quotation marks')
    const key = getMatchingTableLookUp(lastWord, character)
    Log.writeLspServer('key ' + key,1)

    if (!key) return createReturnObject([])

    let res = tableCompletion[key]( line, character, textDocumentt.textDocument.uri, lastWord.lastWord)
    const output = await res

    if (!output) return createReturnObject([])

    return output
}



function createReturnObject(arr : CompletionItem[]) :CompletionList
{

    return {
        isIncomplete: false,
        items: arr
    }
}

function getMatchingTableLookUp(lastWord : lastWordSuggestion, character : number): string | null
{
    if (lastWord.lastWord === '@' || lastWord.lastWord === 'x-on:' ) return '@'
    if (lastWord.lastWord.indexOf('x') == 0 && lastWord.lastWord.length <= 2) return 'x-'
    if ((lastWord.lastWord.indexOf('@') == 0 || lastWord.lastWord.indexOf('x-show') == 0) && lastWord.wholeLine[character-1] ==='.') return '@.'
    if (lastWord.lastWord.indexOf(':') == lastWord.lastWord.length -1 && lastWord.lastWord.length > 0 ) return ':'

    return null;
}













