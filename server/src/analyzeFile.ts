import {allFiles, allHtml} from "./allFiles";
import {DocumentUri, lastWordSuggestion, Position, Range, textDocumentType} from "./types/ClientTypes";
import Log from "./log";
import {
    regexEndingOpeningTag,
    regexEndQuotationMarks,
    regexOpeningTagHtml,
    regexStartingAlpineExpression
} from "./allRegex";

export function getLastWordWithUriAndRange(uri : string, position : Position)
{
    return getLastWord({
        position : position,
        textDocument : {
            uri: uri,
            languageId: 'egal',
            version: 2,
            text : 'egal'
        }
    })
}
export function getLastWord( textDocument: textDocumentType) : lastWordSuggestion {
    let character = textDocument.position.character
    const wholeLine = allHtml.get(textDocument.textDocument.uri)!.linesArr[textDocument.position.line]
    let wholeLineSubStrTillChar = wholeLine.substring(0, character)
    let startIndex = getIndexStartLastWord(wholeLineSubStrTillChar)

    let wholeLineEndSubStr = wholeLine.substring(character)
    let spaceCharIndexEnd = wholeLineEndSubStr.indexOf(' ')
    let endTagIndex = wholeLineEndSubStr.indexOf('>');
    let endTagIndex2 = wholeLineEndSubStr.indexOf('"');
    if (endTagIndex == -1) endTagIndex = 900
    if (endTagIndex2 == -1) endTagIndex2 = 900
    if (spaceCharIndexEnd == -1) spaceCharIndexEnd = 900
    let endIndex = Math.min(spaceCharIndexEnd,endTagIndex2, endTagIndex, wholeLine.length - character)
    return {
        wholeLine,
        lastWord: wholeLine.substring(startIndex + 1, endIndex + character),
        wholeLineTillEndofWord : wholeLine.substring(0, endIndex + character)
    }
}
export function getIndexStartLastWord(wholeLineSubStrTillChar : string) : number
{
    let spaceCharIndex = wholeLineSubStrTillChar.lastIndexOf(' ')
    let startTagIndex = wholeLineSubStrTillChar.lastIndexOf('<')
    let startOpenExpr = wholeLineSubStrTillChar.lastIndexOf('="') + 1
    return  Math.max(spaceCharIndex, startTagIndex, startOpenExpr)
}

export function isAlpineComponent(tag : string) : boolean
{
    return tag.match(/^(?:x-[a-z]|@)/) != null
}



