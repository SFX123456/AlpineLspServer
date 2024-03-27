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
import {createRefsStr, findAccordingRow, getAccordingRefs, getParentAndOwnVariables} from "../../cheerioFn";
import {func} from "vscode-languageserver/lib/common/utils/is";
import {addMagicEventVariableIfEvent, createDataMagicElement, createMagicElVariable} from "./completion/completionJs";
import {chainableOnXShow} from "../../x-validOptions";

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

            fullText += getJsCodeInQuotationMarksWithProperFormating(uri, line, match.index + match[0].length, false)
            const node = findAccordingRow(line,allHtml.get(uri)!)
            const variables = getParentAndOwnVariables(node!)
            variables.push(createMagicElVariable(node!))
            fullText = addMagicObjects(fullText)
            fullText += 'var '
            fullText += variables.join('; var')
            const refs = getAccordingRefs(node!)
            if (refs.length != 0)
            {
                fullText += createRefsStr(refs)
            }
            const magicEventStr = addMagicEventVariableIfEvent(uri, line,match.index + match[0].length)
            if (magicEventStr != '') fullText += ('var '  + magicEventStr)
            output.push(fullText)
            Log.writeLspServer('looking at index ' + (match.index + match[0].length))
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

export function getJsCodeInQuotationMarksWithProperFormating(uri: string, line: number, character : number, shouldWatchForQuotationmarksOpening : boolean) : string
{
    let output = ''
    if (shouldWatchForQuotationmarksOpening)
    {
        const pos = getOpeningParenthesisPosition(uri,line,character)
        if (!pos) return ''
        line = pos.line
        character = pos.character
    }
    for (let i = 0; i < line; i++)
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
    const openingQuotationPosition = {
        line ,
        character
    }
    const endingQuotationPosition = getEndingParenthesisPosition(uri, line, character)
    Log.writeLspServer('ending position')
    Log.writeLspServer(endingQuotationPosition)
    if (!openingQuotationPosition || !endingQuotationPosition)
    {
        return ''
    }
    let output = ''
    const content = allHtml.get(uri)!.linesArr
    for (let i = openingQuotationPosition.line; i <= endingQuotationPosition.line; i++)
    {
        //  console.log(allFiles.get(uri)!.split('\n')[i])
        let c = openingQuotationPosition.line == i ? openingQuotationPosition.character : 0
        let cEnd = endingQuotationPosition.line == i ? endingQuotationPosition.character : content[i].length
        for (let column = 0; column < cEnd; column++)
        {
            if (openingQuotationPosition.line == i && column < openingQuotationPosition.character)
            {
                output += ' '
            }
            else
            {
                output += content[i][column]
            }
        }
        if (i != endingQuotationPosition.line)
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

