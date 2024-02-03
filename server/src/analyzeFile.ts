import {allFiles} from "./allFiles";
import log from "./log";
import {textDocument} from "./methods/textDocument/completion";
export function getLastWord( textDocument: textDocument) : string
{

    const text = allFiles.get(textDocument.textDocument.uri)
    if (!text) return ''
    const lineStr = text!.split('\n')[(textDocument.position.line)]
    let spaceCharIndex = lineStr.substring(0,textDocument.position.character).lastIndexOf(' ')
    log.write('analyzing rest '+ lineStr.substring(textDocument.position.character))
    let spaceCharIndexEnd = lineStr.substring(textDocument.position.character).indexOf(' ')
    let endTagIndex = lineStr.substring(textDocument.position.character).indexOf('>');
    if (endTagIndex === -1) endTagIndex = 900
    let spaceCharIndexEndF = Math.min(endTagIndex, spaceCharIndexEnd)
    log.write(spaceCharIndexEndF.toString())
    if (spaceCharIndexEndF === -1 ) spaceCharIndexEndF = lineStr.length - 1
    spaceCharIndexEndF += textDocument.position.character
    log.write('lastLine ' + spaceCharIndex)
    if (spaceCharIndex === -1) spaceCharIndex = 0
    return  lineStr.substring(spaceCharIndex, spaceCharIndexEndF).trim()
}
