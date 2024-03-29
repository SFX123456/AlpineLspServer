import {RequestMessage} from "../../server";
import Log from "../../log";
import {CompletionList, lastWordInfos, textDocumentType} from "../../types/ClientTypes";
import {CompletionItem} from "../../types/completionTypes";
import {completionJustAT} from "./completion/atCompletion";
import {completionJs} from "./completion/completionJs";
import {getLastWordInfos, isInsideElement} from "../../analyzeFile";
import {CodeBlock} from "../../CodeBlock";
import {completionX} from "./completion/xCompletion";
import {chainableOnAt, chainableOnAtKeyboard} from "../chainableOnAt";



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
    '@.' : completionAtPoint
}

async function completionAtPoint(line : number, char : number, uri : string | undefined, lastWord : string | undefined) : Promise<CompletionList | null>
{
    Log.writeLspServer('completion at point called')
    const lastWordWithoutAt = lastWord!.substring(1)
    const arr = lastWordWithoutAt.split('.')
    if (arr[0] === 'keydown' || arr[0] === 'keyup')
    {

        return createReturnObject(addNecessaryCompletionItemProperties(chainableOnAtKeyboard, line, char))
    }

    return createReturnObject(addNecessaryCompletionItemProperties(chainableOnAt,line, char))
}


export const completion = async (message : RequestMessage) : Promise<CompletionList | null> => {

    Log.writeLspServer('1. completion called')
    const textDocument = message.params as textDocumentType

    const line = textDocument.position.line;
    const character = textDocument.position.character;
    const lastWordInfos = getLastWordInfos(textDocument)
    Log.write('lastword ' + lastWordInfos)
    const rangeHtmlTag = isInsideElement(line, character, textDocument.textDocument.uri)
    if (!rangeHtmlTag)
    {
        Log.writeLspServer('range idd nto work')
        Log.writeLspServer(rangeHtmlTag)

        return null
    }

    Log.writeLspServer(rangeHtmlTag)
    const codeBlock = new CodeBlock(rangeHtmlTag!, textDocument)
    if (codeBlock.isInsideParenthesis())
    {
       if (codeBlock.getKeyWord() === 'x-data')
       {

           return createReturnObject([])
       }
       Log.writeLspServer('works so far')
       const output = await completionJs(line, character, textDocument.textDocument.uri, codeBlock)
       if (!output) return createReturnObject([])

       return output
    }

    const key = getMatchingTableLookUp(lastWordInfos, character)

    if (!key) return createReturnObject([])

    let res = tableCompletion[key]( line, character, textDocument.textDocument.uri, lastWordInfos.lastWord)
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

function getMatchingTableLookUp(lastWord : lastWordInfos, character : number): string | null
{
    Log.writeLspServer('deciding where to go')
    Log.writeLspServer(lastWord)
    Log.writeLspServer(lastWord.wholeLine[character])
    Log.writeLspServer(lastWord.lastWord.indexOf('@').toString())

    if (lastWord.lastWord === '@' ) return '@'
    if (lastWord.lastWord.indexOf('x') != -1 && lastWord.lastWord.length < 2) return 'x-'
    if (lastWord.lastWord.indexOf('@') == 0 && lastWord.wholeLine[character-1] ==='.') return '@.'

    return null;
}













