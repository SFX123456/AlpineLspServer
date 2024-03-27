import {CompletionList, customEvent, lastWordSuggestion, Range} from "../../../types/ClientTypes";
import Log from "../../../log";
import {magicObjects} from "../../../magicobjects";
import {allFiles, allHtml} from "../../../allFiles";
import {
    createRefsStr,
    findAccordingRow,
    getAccordingRefs,
    getParentAndOwnIdScopes,
    getParentAndOwnVariables
} from "../../../cheerioFn";
import {requestingMethods} from "../../../typescriptLsp/typescriptServer";
import {addNecessaryCompletionItemProperties, completionResponseType} from "../completion";
import {CodeBlock} from "../../../CodeBlock";
import {PageHtml} from "../../../HtmlParsing/PageHtml";
import {
    getJsCodeInQuotationMarksWithProperFormating
} from "../javascriptText";
import {getKeyword, getLastWordWithUriAndRange} from "../../../analyzeFile";
export const completionJs  = async (line : number, character : number, uri : string | undefined, codeBlock : CodeBlock) : Promise<CompletionList | null> => {
    Log.writeLspServer('completion requested')
    let optionsStr : string[] = []
    optionsStr.push(...magicObjects)
    const wholeLine = allHtml.get(uri!)!.linesArr[line]
    Log.writeLspServer('completionJs ' + wholeLine,1)
    let lastWordSuggestion = getLastWordWithUriAndRange(uri!, {
        character,
        line
    })
    const htmpPage = allHtml.get(uri!)
    const node = findAccordingRow(line, htmpPage!)
    if (!node){
        Log.write("node did not found")
        return null
    }
    if (isWithinId(lastWordSuggestion,character))
    {
        const res = getParentAndOwnIdScopes(node!)
        return {
            isIncomplete: false,
            items: addNecessaryCompletionItemProperties(res, line,character)
        }
    }
    if (isWithInDispatch(codeBlock))
    {
        Log.writeLspServer('is inside dispatch',1)
        if (isInsideDispatchSetEvent(wholeLine, character))
        {
            const events = PageHtml.getAllListedToEvents()
            Log.writeLspServer('should return listed to events',1)
            Log.writeLspServer(events,1)
            return {
                isIncomplete : false,
                items: addNecessaryCompletionItemProperties(events, line, character)
            }
        }
        return {
            isIncomplete : false,
            items: []
        }
    }

    Log.writeLspServer('completionJS 2', 1)


    const magicEventStr = addMagicEventVariableIfEvent(uri!,line,character)
    if (magicEventStr != '') optionsStr.push(magicEventStr)

    Log.writeLspServer('completionjs4 ' + optionsStr, 1)
    optionsStr.push(...getParentAndOwnVariables(node))
    Log.writeLspServer('before xfor')
    let javascriptText = getJsCodeInQuotationMarksWithProperFormating(uri!,line, character)
    //let javascriptText = getJSCodeBetweenQuotationMarks(uri!,line,character)
    //Log.writeLspServer(javascriptText,1)
    Log.writeLspServer('after')
    //Log.writeLspServer(javascriptText)
    javascriptText += optionsStr.map(x => 'var ' + x + ';' ).join('')
    javascriptText +=  (magicObjects.map(x => ' var ' + x +'; ').join(''))

    const refs = getAccordingRefs(node!)
    if (refs.length != 0)
    {
        javascriptText += createRefsStr(refs)
    }
    Log.writeLspServer('typescript')
    Log.writeLspServer(javascriptText)
    Log.writeLspServer('completionjs5', 1)
    Log.writeLspServer('sending the following js code '+ javascriptText,1)
    const res = await requestingMethods( 'completion', javascriptText, line, character)
    Log.writeLspServer('res is ' + JSON.stringify(res),1)
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
            Log.writeLspServer('error here', 1)
            Log.writeLspServer(e)
        }
    }

    return null
}
export function addMagicEventVariableIfEvent(uri: string, line: number, character : number) : string
{

    const keyWord = getKeyword(uri,line,character)
    Log.writeLspServer('compeltionjs3 key ' + keyWord, 1)
    let eventText = ''
    if (keyWord[0] === '@' || keyWord.indexOf('x-on:') === 0)
    {
        Log.writeLspServer('gets that it is an event ' + keyWord,1)
        let indexFirstPoint = keyWord.indexOf('.')
        if (indexFirstPoint == -1) {
            indexFirstPoint = keyWord.length

        }
        let indexEventNameStarts = 1
        if (keyWord.indexOf('x-on:') === 0)
        {
            indexEventNameStarts = 5
        }
        const eventName = keyWord.substring(indexEventNameStarts, indexFirstPoint)
        Log.writeLspServer('the detected eventNa,e ' + eventName ,1)
        for (let key of allHtml.keys()) {
            allHtml.get(key)!.events.forEach(item => {
                if (item.name == eventName)
                {
                    eventText+= buildMagiceventVar(item)
                }
            })
        }
    }
    return eventText
}

function isWithinId(lastword : lastWordSuggestion, character : number): Boolean
{
    Log.writeLspServer('checks whether insode id')
    const regExp = /\$id\(\s*'*$/
    const match = lastword.wholeLineTillEndofWord.substring(0,character).match(regExp)
    Log.writeLspServer(match)
    if (!match) return false
    return true
}
function isWithInDispatch(codeBlock : CodeBlock): Boolean
{
    Log.writeLspServer('checks whether insode dispatch')
    const textWithinParenthesis = codeBlock.generateTextJavascript()
    Log.writeLspServer(textWithinParenthesis)
    const regExp = /\$dispatch\(['{}:a-zA-Z\s,\n\$]*\)/
    const match = textWithinParenthesis.match(regExp)
    Log.writeLspServer(match)
    if (!match) return false
    //Log.writeLspServer((match.index! + match[0].length - textWithinParenthesis.substring(0,match.index!).lastIndexOf('\n') + 1).toString())
    let realIndexFactor =  textWithinParenthesis.substring(0,codeBlock.character).lastIndexOf('\n') + 1

    Log.writeLspServer((codeBlock.character + realIndexFactor).toString())
    Log.writeLspServer((match.index!).toString())
    Log.writeLspServer((match[0].length + match.index!).toString())
    if ((match[0].length + match.index!) > (codeBlock.character + realIndexFactor)
        && match.index! < codeBlock.character + realIndexFactor
    ) return true
    return false
}


function isInsideDispatchSetEvent(wholeLine : string, character: number) : Boolean
{
    const regExpEnd = /\$dispatch\([\s]*'$/
    if (wholeLine.substring(0, character).match(regExpEnd))
    {
        return true
    }
    return false
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

    return  '$event = ' + '{ detail: { ' +  tempStr   +  '  }, srcElement : { dispatchEvent: 5 } } '
}


function changeXForForTypescriptServer(content : string): string
{
    const regExp = /([a-z-]+)(\s+)in(\s+)([a-z-]+)/g
    let test = content
    let match
    while ((match = regExp.exec(content)) != null)
    {
        Log.writeLspServer('found match at index ' + match.index)
        Log.writeLspServer(match)
        const arrName = match[4]
        const keyName = match[1]
        const firstWhite = match[2]
        const secondWhite = match[3]
        const newText = 'for(let ' + keyName + firstWhite + 'of' + secondWhite + arrName + "){"
        Log.writeLspServer(newText)
        let textToReplace = '       ' + match[0] + '  '
        let counter  = 0
        do {
            textToReplace = textToReplace.substring(0, textToReplace.length - 2)
            counter++
        }while (content.indexOf(textToReplace) == -1 && counter < 2)
        Log.writeLspServer(content.indexOf(textToReplace).toString())
        test = test.replaceAll(textToReplace, newText)
    }
    return test
}







