import {allFiles, allHtml} from "../../allFiles";
import {magicObjects} from "../../magicobjects";
import Log from "../../log";
import {getEndingParenthesisPosition, getOpeningParenthesisPosition} from "../../analyzeFile";
import {Cheerio, Element} from "cheerio";
import {PageHtml} from "../../HtmlParsing/PageHtml";
import {InsertTextMode, LogTraceNotification} from "vscode-languageserver";
import {it} from "node:test";
import {last} from "cheerio/lib/api/traversing";
import {regexHighlightingSemantics} from "../../allRegex";

export function getAllJavaScriptText(uri: string,startLine : number | null = null, tillLine : number| null = null )
{
    const regExpStart = regexHighlightingSemantics
    const arrLines = allHtml.get(uri)!.linesArr
    let output = ''
    let lastY = startLine ?? 0
    arrLines.forEach((lineStr , line) => {
        if (startLine && startLine > line) return;
        if (tillLine && line > tillLine) return
        let match :any
        while((match = regExpStart.exec(lineStr)) != null)
        {
            if (!isKeyJavascriptSymbol(match[1])){

                continue
            }
            const fullText = getJSCodeBetweenQuotationMarks(uri, line, match.index + match[0].length)
            if (lastY == line)
            {
                const input = output.split('\n')
                const laenge = input[line - (startLine ?? 0)].length
                input[line - (startLine ?? 0)] += fullText.substring(laenge)
                output = input.join('\n')
                continue
            }
            while (lastY < line )
            {
                lastY++
                output += '\n'
            }
            const lineBreakCount = fullText.split('\n').length
            lastY += lineBreakCount
            lastY--
            output += fullText
        }
    })
    if (startLine) return output

    return addMagicObjects(output)
}


function isKeyJavascriptSymbol(key : string)
{
    if (key === 'data') return false
    return true
}

export function getJsCodeInQuotationMarksWithProperFormating(uri: string, line: number, character : number) : string
{
    let output = ''
    const openingParenthesisPosition = getOpeningParenthesisPosition(uri, line, character)
    for (let i = 0; i < openingParenthesisPosition!.line; i++)
    {
        output+= '\n'
    }
    output += getJSCodeBetweenQuotationMarks(uri, line, character)
    for (let i = 0; i < 500; i++)
    {
        output += '\n'
    }
    return output
}

export function getJSCodeBetweenQuotationMarks(uri: string, line: number, character : number ) : string
{
    const openingParenthesisPosition = getOpeningParenthesisPosition(uri, line, character)
    const endingParenthesisPosition = getEndingParenthesisPosition(uri, line, character)
    if (!openingParenthesisPosition || !endingParenthesisPosition)
    {
        return ''
    }
    let output = ''
    const content = allHtml.get(uri)!.linesArr
    for (let i = openingParenthesisPosition.line; i <= endingParenthesisPosition.line; i++)
    {
        //  console.log(allFiles.get(uri)!.split('\n')[i])
        let c = openingParenthesisPosition.line == i ? openingParenthesisPosition.character : 0
        let cEnd = endingParenthesisPosition.line == i ? endingParenthesisPosition.character : content[i].length
        for (let column = 0; column < cEnd; column++)
        {
            if (openingParenthesisPosition.line == i && column < openingParenthesisPosition.character)
            {
                output += ' '
            }
            else
            {
                output += content[i][column]
            }
        }
        if (i != endingParenthesisPosition.line)
            output += '\n'
    }
    return output
}

function addMagicObjects(output : string)
{
    for (let i = 0; i < 500;i++)
    {
        output += '\n'
    }
    return output + (magicObjects.map(x => ' var ' + x +'; ').join(''))
}

