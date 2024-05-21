import {CompletionList, customEvent, lastWordSuggestion, Range} from "../../../types/ClientTypes";
import Log from "../../../log";
import {magicObjects} from "../../../magicobjects";
import {allFiles, allHtml} from "../../../allFiles";
import {
    createRefsStr,
    getAccordingRow,
    getAccordingRefs, getFirstXDataTagName,
    getParentAndOwnIdScopes,
    getParentAndOwnVariables, getParentAndOwnVariablesJustNamesNoFunctions, getParentAndOwnVariablesXData
} from "../../../cheerioFn";
import {requestingMethods} from "../../../typescriptLsp/typescriptServer";
import {addNecessaryCompletionItemProperties, completionResponseType} from "../completion";
import {PageHtml} from "../../../HtmlParsing/PageHtml";
import {
    getJsCodeInQuotationMarksWithProperFormating
} from "../javascriptText";
import { getLastWordWithUriAndRange} from "../../../analyzeFile";
import cheerio, {Cheerio, Element} from "cheerio";
import {CompletionItem} from "../../../types/completionTypes";
import {getKeyWord, positionTreeSitter, rangeIndexTreesitter} from "../../../treeSitterHmtl";
export const completionJs  = async (line : number, character : number, uri : string | undefined, javascriptPos : rangeIndexTreesitter) : Promise<CompletionList | null> => {
    const javascriptText = allFiles.get(uri!)!.substring(javascriptPos.startIndex,javascriptPos.endIndex)
    Log.writeLspServer('completionJS requested',1)
    const keyWord = getKeyWord(uri! , {
        row: line,
        column: character
    })
    if (keyWord)
    {
        if (keyWord === 'x-bind')
        {
            const res = allHtml.get(uri!)!.allBindings
            return {
                isIncomplete: false,
                items: addNecessaryCompletionItemProperties(res, line,character)
            }
        }
        else if (keyWord === 'x-data')
        {
            Log.writeLspServer('gets theat x-data',1)
            if (javascriptText.trim().length === 0)
            {
                const res = Object.keys(allHtml.get(uri!)!.allDataComp)
                return {
                    isIncomplete: false,
                    items: addNecessaryCompletionItemProperties(res, line,character)
                }
            }
        }
    }
    const wholeLine = allHtml.get(uri!)!.linesArr[line]
    let lastWordSuggestion = getLastWordWithUriAndRange(uri!, {
        character,
        line
    })
    const htmpPage = allHtml.get(uri!)
    const node = getAccordingRow(line, htmpPage!)
    if (!node){
        Log.writeLspServer(' matching node could not be found aborting')

        return null
    }
    Log.writeLspServer('check if inside id function')
    if (isWithinId(lastWordSuggestion,character))
    {
        Log.writeLspServer('is inside id function')
        const res = getParentAndOwnIdScopes(node!)

        return {
            isIncomplete: false,
            items: addNecessaryCompletionItemProperties(res, line,character)
        }
    }
    /*
    if (isInsideDispatchSetEvent(wholeLine, character))
    {
        Log.writeLspServer('isinside sipatch',1)
        const events = PageHtml.getAllListedToEvents()
        Log.writeLspServer('should return listed to events',1)
        Log.writeLspServer(events,1)

        return {
            isIncomplete : false,
            items: addNecessaryCompletionItemProperties(events, line, character)
        }
    }

     */
    let optionsStr : string[] = []

    const parentAndOwnVariables = getParentAndOwnVariables(node,uri!)
    Log.writeLspServer('here are variables',1)
    Log.writeLspServer(parentAndOwnVariables,1)
    optionsStr.push(...parentAndOwnVariables)

    Log.writeLspServer('check if inside watch')
    if (isInsideWatch(lastWordSuggestion,character))
    {
        Log.writeLspServer('is inside watch')
        let text = createBlankJavascriptWithBBB(line,character)
        text += optionsStr.map(x => 'var ' + x + ';' ).join('')
        const allKeys : string[] = []
        getParentAndOwnVariablesJustNamesNoFunctions(node,allKeys)
        text += 'var bbb = {'
        text += allKeys.map(item => item.replace('"','')).join(', ')
        text += ' }'
        const res = await requestingMethods( 'completion', text, line, character)
        const message = res as completionResponseType
            //@ts-ignore
        const items = message.result.items as unknown as CompletionItem[]
        const output: CompletionItem[] = items.map(x => {
            return {
                label: x.label,
                kind: x.kind,
            }
        })
        return {
            isIncomplete: true,
            items: output
        }
    }

    optionsStr.push(...magicObjects)
    optionsStr.push(createMagicElVariable(node!))
    const magicEventStr = addMagicEventVariableIfEvent(uri!,line,character, keyWord!)
    if (magicEventStr != '') optionsStr.push(magicEventStr)
    let javascriptTextProperFormating = getJsCodeInQuotationMarksWithProperFormating(javascriptText,javascriptPos.positionStart.row, javascriptPos.positionStart.column)

    optionsStr.push(createDataMagicElement(node))
    const rootElement = createMagicRootVariable(node)
    if (rootElement) optionsStr.push(rootElement)

    javascriptTextProperFormating += optionsStr.map(x => 'var ' + x + ';' ).join('')
    javascriptTextProperFormating +=  (magicObjects.map(x => ' var ' + x +'; ').join(''))

    const refs = getAccordingRefs(node!)
    if (refs.length != 0)
    {
        javascriptTextProperFormating += createRefsStr(refs)
    }
    const storemagicVariable = allHtml.get(uri!)!.buildStoreMagicVariable()
    if (storemagicVariable != '') javascriptTextProperFormating += storemagicVariable
    const res = await requestingMethods( 'completion', javascriptTextProperFormating, line, character)
    if (res)
    {
        const message = res as completionResponseType
        //@ts-ignore
        const items = message.result.items

        return {
            isIncomplete: true,
            items: items
        }
    }

    return null
}

export function createMagicRootVariable(node : Cheerio<Element>)
{
    const res = getFirstXDataTagName(node)
    if (!res) return null

    return '$root = document.createElement("' + res + '")'
}

function createBlankJavascriptWithBBB(line : number, character : number)
{
    let output = ''
    for (let i = 0; i < line; i++) {
        output += '\n'
    }
    for (let i = 0; i < character-4; i++) {
        output+= ' '
    }
    output+= 'bbb.'
    for (let i = 0; i < 500; i++) {
        output+= '\n'
    }
    return output
}



function isInsideWatch(lastWordSuggestion : lastWordSuggestion, character : number)
{
    return  lastWordSuggestion.wholeLineTillEndofWord.substring(0,character).match(/\$watch\(\s*'$/) != null
}
export function createMagicElVariable(node : Cheerio<Element> )
{
    return '$el = document.createElement("' + node[0].tagName + '") '
}

export function createDataMagicElement(node : Cheerio<Element>)
{
    let output = '$data = { '
    const variables : string[] = []
    Log.writeLspServer('yoyoyo',1)
    getParentAndOwnVariablesXData(node,variables)
    Log.writeLspServer(variables)

    output += variables.map(item => item.replace('"','')).join(', ')
    output += ' }'
    Log.writeLspServer('the output : ' + output)
    return output
}
export function addMagicEventVariableIfEvent(uri: string, line: number, character : number, keyWord : string) : string
{
    if (!keyWord) return ''
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
                Log.writeLspServer(item,1)
                if (item.name == eventName && item.details != null)
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
function isWithInDispatch(javascriptText : string, line : number, character : number, position : rangeIndexTreesitter): Boolean
{
    Log.writeLspServer('checks whether insode dispatch')
    const textWithinParenthesis = javascriptText
    Log.writeLspServer(textWithinParenthesis)
    const regExp = /\$dispatch\([\s\S]*\)/
    const match = textWithinParenthesis.match(regExp)
Log.writeLspServer('jjjjjjjjjjjjjjjj ' + match,1)
    if (!match) return false
    const h = javascriptText.substring(0,match.index).split('\n')
    const newLineCountBefore = h.length - 1
    let characterRelativeStart = h[h.length-1].length
    if (h.length == 1)
    {
        characterRelativeStart += character
    }
    const splitLines = match[0].split('\n')
    const countNewLines = splitLines.length - 1
    let characterEnd = splitLines[splitLines.length -1].length
    if (countNewLines == 0 && newLineCountBefore == 0 )
    {
        characterEnd += character
    }
    const endPosition : positionTreeSitter= {
        row : position.positionStart.row + newLineCountBefore + countNewLines ,
        column : characterEnd
    }
    Log.writeLspServer('endposition : ' + JSON.stringify(endPosition),1)
    const startPosition : positionTreeSitter = {
        row : position.positionStart.row + newLineCountBefore,
        column : characterRelativeStart
    }
    Log.writeLspServer('startPosition : ' + JSON.stringify(startPosition),1)
    if (line <= endPosition.row && line >= startPosition.row && (
        (
            startPosition.row != line || startPosition.column <= character
        )
        &&
        (
            endPosition.row != line || endPosition.column >= character
        )
    ))
    {
        return true
    }
    return false

}


export function isInsideDispatchSetEvent(wholeLine : string, character: number) : Boolean
{
    Log.writeLspServer('isinsidedispatchsetvent',1)
    const regExpEnd= /\$dispatch\([\s]*'$/
    if (wholeLine.substring(0, character).match(regExpEnd))
    {
        return true
    }

    return false
}




function buildMagiceventVar(item : customEvent )
{
    if (typeof item.details === 'string' || typeof item.details === 'number')
    {
        Log.writeLspServer('string or num,ber',1)
        return  '$event = ' + '{ detail= ' + item.details +  ', srcElement : { dispatchEvent: 5 } } '
    }
    const keys = Object.keys(item.details!)
    Log.writeLspServer(keys,1)
    try {
        let tempStr = keys.map(key => {
            let tempStr = ' '
            tempStr += key
            tempStr += ' : '
            //@ts-ignore
            tempStr += item.details[key]
            return tempStr
        }).join(',')

        Log.writeLspServer('$event = ' + '{ detail: { ' +  tempStr   +  '  }, srcElement : { dispatchEvent: 5 } } ',1)
        return  '$event = ' + '{ detail: { ' +  tempStr   +  '  }, srcElement : { dispatchEvent: 5 } } '
    }
    catch (e) {
        Log.writeLspServer('not working')
        return ''
    }
}








