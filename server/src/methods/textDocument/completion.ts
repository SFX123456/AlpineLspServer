import {RequestMessage} from "../../server";
import {allFiles} from "../../allFiles";
import {TextDocumentItem} from "./didChange";
import log from "../../log";
import {CompletionItem, xoptions} from "../../x-validOptions";
import {func} from "vscode-languageserver/lib/common/utils/is";
import {getLastWord} from "../../analyzeFile";

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
function createSuggestions(line: number, char : number)
{
    return xoptions.map(x => {
        if (x.insertTextFormat === 2)
        {
            x.textEdit = {
                range: {
                    start: {
                        line : line,
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



export const completion = (message : RequestMessage) : CompletionList => {
    const textDocument = message.params as textDocument

    const line = textDocument.position.line;
    const char = textDocument.position.character;
    const lastWord = getLastWord(textDocument)
    if (!isInsideElement(line,char, textDocument.textDocument.uri))
    {
        log.write('not inside hmtl tag')
        return createReturnObject([])
    }
    log.write('inside html element')
    if (lastWord != 'x-' && lastWord != 'x' && lastWord != 'x->' && lastWord != 'x>') return createReturnObject([])

    const options = createSuggestions(line, char)
    return createReturnObject(options)
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
