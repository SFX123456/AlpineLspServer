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
import {findAccordingRow, getParentAndOwnVariables} from "../../cheerioFn";
import {func} from "vscode-languageserver/lib/common/utils/is";

export function getAllJavaScriptText(uri: string,startLine : number | null = null, tillLine : number| null = null ) : string[]
{
    const regExpStart = regexHighlightingSemantics
    const arrLines = allHtml.get(uri)!.linesArr
    let output : string[] = []
    let lastY = startLine ?? 0
    arrLines.forEach((lineStr , line) => {
        if (startLine && startLine > line) return;
        if (tillLine && line > tillLine) return
        let match :any
        while((match = regExpStart.exec(lineStr)) != null)
        {
            Log.writeLspServer(match,1)
            let fullText = ''
            if (isXData(match[1])){

                fullText+= 'let m = \n'
            }
            fullText += getJsCodeInQuotationMarksWithProperFormating(uri, line, match.index + match[0].length)
            const node = findAccordingRow(line,allHtml.get(uri)!)
            const variables = getParentAndOwnVariables(node!)
            fullText = addMagicObjects(fullText)
            fullText += 'var '
            fullText += variables.join('; var')
            output.push(fullText)
            Log.writeLspServer('got text : ' + fullText,1)
            if (lastY == line)
            {
                continue
            }
            while (lastY < line )
            {
                lastY++
            }
            const lineBreakCount = fullText.split('\n').length
            lastY += lineBreakCount
            lastY--
        }
    })
    return output
}


export function getAllJava(uri : string)
{

}

function isXData(key : string)
{
   if (key === 'data') return true
   return false
}
function isKeyJavascriptSymbol(key : string)
{
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

