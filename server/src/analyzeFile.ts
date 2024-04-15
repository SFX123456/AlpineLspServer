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
    Log.writeLspServer(wholeLine,1)
    Log.writeLspServer(textDocument.textDocument.uri,1)
    Log.writeLspServer(textDocument.position.line.toString(),1)
    let wholeLineSubStrTillChar = wholeLine.substring(0, character)
    let startIndex = getIndexStartLastWord(wholeLineSubStrTillChar)

    let wholeLineEndSubStr = wholeLine.substring(character)
    let spaceCharIndexEnd = wholeLineEndSubStr.indexOf(' ')
    let endTagIndex = wholeLineEndSubStr.indexOf('>');
    if (endTagIndex == -1) endTagIndex = 900
    if (spaceCharIndexEnd == -1) spaceCharIndexEnd = 900
    let endIndex = Math.min(spaceCharIndexEnd, endTagIndex, wholeLine.length - character)
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
export function getOpeningParenthesisPosition(uri: string, line:number, character: number) : Position | null
{
    const regExpStart= /="/g
    const wholeLineSubStr = allHtml.get(uri)!.linesArr[line].substring(0, character)
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
    while (line >= openingTagIndexLine)
    {
        const lineStr = allHtml.get(uri)!.linesArr[line]
        let matchFinal = null
        let match = null
        while ((match = regExpStart.exec(lineStr)) != null)
        {
            matchFinal = match
        }
        if (matchFinal)
        {
            return {
                line,
                character : matchFinal.index + 2
            }
        }
        Log.writeLspServer('test')
        line--
    }
    return null


}


export function getEndingParenthesisPosition(uri: string, line: number, character: number) :Position | null
{
    const lineSubstr = allHtml.get(uri)!.linesArr[line].substring(character)
    Log.writeLspServer(lineSubstr)
    const regExpEndParenthesis = new RegExp(regexEndQuotationMarks)
    const res = regExpEndParenthesis.exec(lineSubstr)
    if (res != null)
    {
        Log.writeLspServer('founded first line')
        Log.writeLspServer(res)
        return {
            line : line,
            character : res.index! + character
        }
    }
    const position = getEndTagPosition(uri, line)
    line++
    if (position == null) return null
    const closingTagIndexLine = position.line
    const closingTagIndexCharacter = position.character
    while (line <= closingTagIndexLine)
    {

        const lineStr = allHtml.get(uri)!.linesArr[line]
       const res = regExpEndParenthesis.exec(lineStr)
        if (res)
        {
            Log.writeLspServer('found match later')
            Log.writeLspServer(res)
            return {
                line,
                character : res.index
            }
        }
        line++
    }
    return null
}
export function isAlpineComponent(tag : string) : boolean
{
    return tag.match(/^(?:x-[a-z]|@)/) != null
}

export function getEndTagPosition(uri: string, line : number) : Position | null
{
    const endPattern = regexEndingOpeningTag
    let res = null
    do
    {
        const wholeLine = allHtml.get(uri)!.linesArr[line]
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

export function getOpeningTagPosition(uri: string, line: number) : Position | null
{
    const startPattern = regexOpeningTagHtml
    let res = null
    do
    {
        const wholeLine = allHtml.get(uri)!.linesArr[line]
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

export function isInsideElement(line : number , char : number, uri: string): null | Range {
    const startPattern = regexOpeningTagHtml
    const endPattern = regexEndingOpeningTag
    let goUp = 0;
    let startTag = null
    while (!startTag && goUp < 200 && line - goUp >= 0)
    {
        startTag = startPattern.exec(allHtml.get(uri)!.linesArr[line - goUp])
        goUp++
    }
    goUp--
    if (!startTag) return null
    let endTag = endPattern.exec(allHtml.get(uri)!.linesArr[line - goUp])
    let i = 0;
    while (!endTag && i < 200 && line - goUp + i < allHtml.get(uri)!.linesArr.length - 1)
    {
        i++;
        endTag = endPattern.exec(allHtml.get(uri)!.linesArr[line - goUp + i])
    }
    if (!endTag) return null
    if ( line - goUp + i >= line
        && ( startTag!.index + 2 < char || goUp != 0 )
        && ( endTag!.index  > char || goUp - i != 0 )
    )
    {
        return {
            start: {
                line: line - goUp,
                character : startTag!.index + 2
            },
            end : {
                line: line - goUp + i,
                character : endTag!.index
            }
        }
    }
    return null
}

