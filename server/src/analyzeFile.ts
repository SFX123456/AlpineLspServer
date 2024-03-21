import {allFiles, allHtml} from "./allFiles";
import {lastWordSuggestion, Position, Range, textDocumentType} from "./types/ClientTypes";
import Log from "./log";
import {
    regexEndingOpeningTag,
    regexEndQuotationMarks,
    regexOpeningTagHtml,
    regexStartingAlpineExpression
} from "./allRegex";


export function getLastWord( textDocument: textDocumentType) : lastWordSuggestion {
    let character = textDocument.position.character
    const wholeLine = allHtml.get(textDocument.textDocument.uri)!.linesArr[(textDocument.position.line)]
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
    const regExpEndQuotationMarks = regexEndQuotationMarks
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
    const openingTagIndexCharacter = position.character
    while (line >= openingTagIndexLine)
    {
        const lineStr = allHtml.get(uri)!.linesArr[line]
        const resStart = lineStr.match(regExpStart)
        //const resEnd = lineStr.match(regExpEndParenthesis)
        const res = lineStr.match(regExpEndQuotationMarks)
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
    const lineSubstr = allHtml.get(uri)!.linesArr[line].substring(character)
    const regExpEndParenthesis = regexEndQuotationMarks
    const regExpStart= regexStartingAlpineExpression
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

        const lineStr = allHtml.get(uri)!.linesArr[line]
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

