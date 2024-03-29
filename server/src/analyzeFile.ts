import {allFiles} from "./allFiles";
import {lastWordInfos, Position, Range, textDocumentType} from "./types/ClientTypes";
import {
    regexEndHtmlElement,
    regexEndingQuotationMarks,
    regexStartHtmlElement,
    regexStartQuotationMarks, regexXAttrAndATMethods
} from "./allRegex.js";


export function getLastWordInfos(textDocument: textDocumentType) : lastWordInfos {
    const text = allFiles.get(textDocument.textDocument.uri)!
    let character = textDocument.position.character
    const wholeLine = text!.split('\n')[(textDocument.position.line)]
    let wholeLineSubStrTillChar = wholeLine.substring(0, character)
    let spaceCharIndex = wholeLineSubStrTillChar.lastIndexOf(' ')
    let startTagIndex = wholeLineSubStrTillChar.lastIndexOf('<')
    let startOpenExpr = wholeLineSubStrTillChar.lastIndexOf('="') + 1
    let startIndex = Math.max(spaceCharIndex, startTagIndex, startOpenExpr)

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

export function getOpeningParenthesisPosition(uri: string, line:number, character: number) : Position | null
{
    const content = allFiles.get(uri)!
    const regExpEndParenthesis = regexEndingQuotationMarks
    const regExpStart= regexStartQuotationMarks
    const wholeLineSubStr = content.split('\n')[line].substring(0, character)
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


export function getEndingParenthesisPosition(uri: string, line: number, character: number) :Position | null
{
    const content = allFiles.get(uri)!
    const lineSubstr = content.split('\n')[line].substring(character)
    const regExpEndParenthesis = regexEndingQuotationMarks
    const regExpStart= regexXAttrAndATMethods
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

export function getEndTagPosition(uri: string, line : number) : Position | null
{
    const endPattern = regexEndHtmlElement
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

export function getOpeningTagPosition(uri: string, line: number) : Position | null
{
    const startPattern = regexStartHtmlElement
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

export function isInsideElement(line : number , char : number, uri: string): null | Range {
    const startPattern =  regexStartHtmlElement;
    const endPattern = regexEndHtmlElement;
    const arr = allFiles.get(uri)!.split('\n')
    let goUp = 0;
    let startTag = null
    while (!startTag && goUp < 200 && line - goUp >= 0)
    {
        startTag = startPattern.exec(arr[line - goUp])
        goUp++
    }
    goUp--
    if (!startTag) return null
    let endTag = endPattern.exec(arr[line - goUp])
    let i = 0;
    while (!endTag && i < 200 && line - goUp + i < arr.length - 1)
    {
        i++;
        endTag = endPattern.exec(arr[line - goUp + i])
    }
    if (!endTag) return null
    if (
        line - goUp + i >= line
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

