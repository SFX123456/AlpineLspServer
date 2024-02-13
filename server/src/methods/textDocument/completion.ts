import {RequestMessage} from "../../server";
import {xoptions} from "../../x-validOptions";
import Log from "../../log";
import {CompletionList, textDocumentType} from "../../types/ClientTypes";
import {CompletionItem} from "../../types/completionTypes";
import {completionJustAT} from "./completion/atCompletion";
import {completionJs} from "./completion/completionJs";
import {getLastWord, isInsideElement, isInsideElement2, isInsideParenthesis} from "../../analyzeFile";
import {CodeBlock} from "../../CodeBlock";
import {completionX} from "./completion/xCompletion";



export type completionResponse = (line: number, char: number, uri? : string, lastWord? : string) => Promise<CompletionList | null>

export interface completionResponseType {
    id: number,
    result: object
}



export function addNecessaryCompletionItemProperties(options : CompletionItem[], line: number, char : number)
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
    '@' : completionJustAT,
    'x-' :  completionX
}


export const completion = async (message : RequestMessage) : Promise<CompletionList | null> => {

    Log.writeLspServer('1. completion called')
    const textDocumentt = message.params as textDocumentType

    const line = textDocumentt.position.line;
    const character = textDocumentt.position.character;
    const lastWord = getLastWord(textDocumentt)
    Log.write('lastword ' + lastWord)
    const rangeHtmlTag = isInsideElement2(line, character, textDocumentt.textDocument.uri)
    if (!rangeHtmlTag)
    {
        Log.writeLspServer('range idd nto work')
        Log.writeLspServer(rangeHtmlTag)
    }


    const codeBlock = new CodeBlock(rangeHtmlTag!, textDocumentt)
   if (codeBlock.isInsideParenthesis())
   {
       if (codeBlock.getKeyWord() === 'x-data')
       {
           return createReturnObject([])
       }
      const output = await completionJs(line, character, textDocumentt.textDocument.uri, codeBlock)
       if (!output) return createReturnObject([])
       return output
   }


    const key = getMatchingTableLookUp(lastWord)
    if (!key) return createReturnObject([])

    let res = tableCompletion[key]( line, character, textDocumentt.textDocument.uri, lastWord)
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

function getMatchingTableLookUp(lastWord : string): string | null
{
    if (lastWord === '@' ) return '@'
    if (lastWord.indexOf('x') != -1 && lastWord.length < 2) return 'x-'


    return null;
}













