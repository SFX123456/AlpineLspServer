import {RequestMessage} from "../../server";
import {getLastWord} from "../../analyzeFile";
import {allHtml} from "../../allFiles";
import Log from "../../log";
import {infos} from "../../typescriptLsp/typescriptServer";
import {textDocumentType} from "../../types/ClientTypes";
import { atOptionsJustString} from "../../at-validOptions";
interface HoverResult {
    contents: string
}
type predefinedAnswersKeys = 'x-cloak' | 'x-data'| '@' | 'x-init' | '$dispatch'
const lastWordAnswerMatches : Record<predefinedAnswersKeys, string> = {
    'x-cloak' : 'hides the element until Alpine is fully loaded',
    'x-data' : 'option to create variables',
    'x-init' : 'gets called at initialization',
    '$dispatch' : 'dispatch an event',
    '@' : 'event'
}
export const hoverRequest = async (message: RequestMessage) : Promise<HoverResult>  => {
    const textDocumentt = message.params as textDocumentType
    checkIfInsideDispatchMinimal()
    let lastWord = getLastWord(textDocumentt).lastWord
    Log.writeLspServer('hover')
    Log.writeLspServer(lastWord)
    if (lastWord == '')
        return {
            contents : ''
        }

    for (let key  of Object.keys(lastWordAnswerMatches)) {
       if (lastWord.indexOf(key) == 0)
       {
           if (key === '@')
           {
               let indexEnd = lastWord.indexOf('="')
               const indexPoint = lastWord.indexOf('.')
               if (indexPoint != -1)
               {
                   indexEnd = indexPoint
               }
               const text = getTextForEvent(lastWord.substring(1, indexEnd))
               return {
                   contents : text
               }
           }
           if (key === '$dispatch')
           {
                const res = getListenersToDispatch(lastWord)
               if (!res) return {
                   contents : 'dispatch not valid'
               }
               return {
                   contents : res.join(' and ')
               }
           }
           return {
               contents : lastWordAnswerMatches[key as predefinedAnswersKeys]
           }
       }
    }
    return {
        contents : ''
    }
}

function getTextForEvent(event : string) : string
{
    Log.writeLspServer('triggered')
    Log.writeLspServer(event)
    let output = 'dispatched in '
    let fileNames : string[] = []
    for (let key of allHtml.keys()) {
        Log.writeLspServer(key)
        Log.writeLspServer(allHtml.get(key)!.events.length.toString())
       allHtml.get(key)!.events.forEach(x => {
           Log.writeLspServer(x)
           if (x.name === event)
           {
               let fileName =allHtml.get(key!)!.uri
               Log.writeLspServer('saved uri name')
               Log.writeLspServer(fileName)
               const relPath = getRelativePath(fileName)
               if (fileNames.indexOf(relPath) === -1)
               {
                   output += relPath
                   output +=' and '
                   fileNames.push(relPath)
               }
           }
       })
    }
    if (output === 'dispatched in ')
    {
        if (checkIfStandardEvent(event))
        {
            return `regular event : ${event} not dispatched yet`
        }
        return `custom event ${event} not dispatched yet`
    }
    return output
}

function checkIfStandardEvent(event : string) :Boolean
{
    atOptionsJustString.forEach(x => {
        if (x === event) return true
    })
    return false
}

function getListenersToDispatch(lastWord : string) : null | string[]
{
    const regexp = /\$dispatch\(\s*'([a-z]+)'/
    const match = lastWord.match(regexp)
    if (!match) return null
    Log.writeLspServer('search here jonas')
    Log.writeLspServer(match[1])
    let output : string[] = []
    for (let key of allHtml.keys()) {
        let isIn = false
       allHtml.get(key)!.listenedToEventsPosition.forEach(item => {

           Log.writeLspServer(item)
           if (item.name === match[1])
           {
               isIn = true
           }
       })
        if (isIn) output.push(getRelativePath(key))

    }

    return output
}


function getRelativePath(path : string) :string
{
    return path.split(infos.rootUri!)[1]
}

function checkIfInsideDispatchMinimal()
{

}
