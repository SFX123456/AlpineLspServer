import {allFiles} from "../../allFiles";
import {magicObjects} from "../../magicobjects";
import Log from "../../log";
import {getEndingParenthesisPosition, getOpeningParenthesisPosition} from "../../analyzeFile";

export function getAllJavaScriptText(uri: string )
{
    const regExpStart = /(?:x-([a-z]+)|@([a-z-]+)[\.a-z-]*)="/g
    const arrLines = allFiles.get(uri)!.split('\n')
    let output = ''
    let lastY = 0
    arrLines.forEach((lineStr , line) => {
        let match :any
        while((match = regExpStart.exec(lineStr)) != null)
        {
            if (match[1] === 'data'){

                continue
            }
            const fullText = getAllJavascriptCode(uri, line, match.index + match[0].length)
            if (lastY == line)
            {
                const input = output.split('\n')
                const laenge = input[line].length
                input[line] += fullText.substring(laenge)
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


    for (let i = 0; i < 500;i++)
    {
        output += '\n'
    }
    output += (magicObjects.map(x => ' var ' + x +'; ').join(''))

    return output
}



export function getAllJavascriptCode(uri: string, line: number, character : number ) : string
{
    const openingParenthesisPosition = getOpeningParenthesisPosition(uri, line, character)
    const endingParenthesisPosition = getEndingParenthesisPosition(uri, line, character)
    if (!openingParenthesisPosition || !endingParenthesisPosition)
    {
        return ''
    }
    let output = ''
    const content = allFiles.get(uri)!.split('\n')
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
