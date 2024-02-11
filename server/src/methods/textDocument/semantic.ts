import {RequestMessage} from "../../server";
import {allFiles, allHtml} from "../../allFiles";
import {TextDocumentItem} from "./didChange";
import log from "../../log";
import {CompletionItem, xoptions} from "../../x-validOptions";
import {getLastWord} from "../../analyzeFile";
import {findAccordingRow, getParentAndOwnVariables} from "../../cheerioFn";
import Log from "../../log";
import {atoptions, magicObjects} from "../../at-validOptions";
import {ResponseMessage} from "vscode-languageserver";
import {func} from "vscode-languageserver/lib/common/utils/is";

import {textDocument} from "./completion";
//add alpine data

const tokenTypes = ['property', 'type', 'class']

const tokenModifiers = ['private', 'static']

interface semanticResponse  {
    data: number[]
}
export const semantic = async (message : RequestMessage ) : Promise<semanticResponse> => {
    log.write('should give semantic')

    const textDocument = message.params as textDocument
    const res = detectAlpineCharacters(textDocument.textDocument.uri)
    return {
        data:
        res

    }
}

function detectAlpineCharacters(uri: string) : number[]
{
    const lines = allFiles.get(uri)!.split('\n')
// Regular expression with the global flag
    const regExpx = /x-[a-zA-Z]+="/g;

    let match : any;
    const output : number[] = []
    let lastHitChar = 0
    let lastHitLine = 0
    lines.forEach((line, currentLine) => {
        while ((match = regExpx.exec(line)) !== null) {
            output.push(currentLine - lastHitLine)
            lastHitLine = currentLine
            output.push(match.index - lastHitChar)
            lastHitChar = match.index
            output.push(match[0].length)
            output.push(0)
            output.push(3)
        }
        lastHitChar = 0
    })
    return output
}



