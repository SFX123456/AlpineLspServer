import {CompletionList, customEvent} from "../../../types/ClientTypes";
import Log from "../../../log";
import {magicObjects} from "../../../magicobjects";
import {allFiles, allHtml} from "../../../allFiles";
import {findAccordingRow, getParentAndOwnVariables} from "../../../cheerioFn";
import {requestingMethods} from "../../../typescriptLsp/typescriptServer";
import { completionResponseType} from "../completion";
import {getOpeningParenthesisPosition} from "../../../analyzeFile";
import {getAllJavascriptCode} from "../javascriptText";
import {CodeBlock} from "../../../CodeBlock";

export const completionJs  = async (line : number, character : number, uri : string | undefined, codeBlock : CodeBlock) : Promise<CompletionList | null> => {
    Log.write('completion requested')
    let optionsStr : string[] = []
    optionsStr.push(...magicObjects)

    const htmpPage = allHtml.get(uri!)

    const node = findAccordingRow(line, htmpPage!)
    if (!node){
        Log.write("node did not found")
        return null
    }

    const keyWord = codeBlock.getKeyWord()
    if (keyWord[0] === '@')
    {
        const eventName = keyWord.substring(1)
        allHtml.get(uri!)!.events.forEach(item => {
            if (item.name == eventName)
            {
                let full = buildMagiceventVar(item)
                optionsStr.push(full)
            }
        })
    }

    optionsStr.push(...getParentAndOwnVariables(node))
    const javascriptText = codeBlock.generateFullTextJavascriptLsp(optionsStr)

    const res = await requestingMethods( 'completion', javascriptText, line, character)
    if (res)
    {
        const message = res as completionResponseType
        try {
            //@ts-ignore
            const items = message.result.items
            return {
                isIncomplete : true,
                items: items
            }
        }
        catch (e)
        {
            Log.writeLspServer('error here')
            Log.writeLspServer(e)
        }
    }

    return null
}



function getEventName(uri: string, line: number, character: number) : string | null
{
    const arr = allFiles.get(uri)!.split('\n')
    let lineFound = line
    let char = character
    while (lineFound >= 0)
    {

        let subStrLine = lineFound == line ? arr[lineFound].substring(0, char) : arr[lineFound]
        const match = subStrLine.lastIndexOf('="')
        if (match != -1)
        {
            const lastIndexWhitespace = subStrLine.substring(0, match).lastIndexOf(' ')
            if (subStrLine[lastIndexWhitespace + 1] === '@')
            {
                return subStrLine.substring(lastIndexWhitespace + 2, match)
            }
            return null
        }
        lineFound--

    }
    return null

}


function buildMagiceventVar(item : customEvent )
{
    const keys = Object.keys(item.details)
    let tempStr = keys.map(key => {
        let tempStr = ' '
        tempStr += key
        tempStr += ' : '
        tempStr += item.details[key]
        return tempStr
    }).join(',')

    return  '$event = ' + '{ target: { ' +  tempStr   +  '  }, srcElement : { dispatchEvent: 5 } } '
}







