import {RequestMessage} from "../../server";
import {getLastWord} from "../../analyzeFile";
import {allHtml} from "../../allFiles";
import Log from "../../log";
import {infos} from "../../typescriptLsp/typescriptServer";
import {textDocumentType} from "../../types/ClientTypes";
interface HoverResult {
    contents: string
}
type predefinedAnswersKeys = 'x-cloak' | 'x-data'| '@' | 'x-init'
const lastWordAnswerMatches : Record<predefinedAnswersKeys, string> = {
    'x-cloak' : 'hides the element until Alpine is fully loaded',
    'x-data' : 'option to create variables',
    'x-init' : 'gets called at initialization',
    '@' : 'event'
}
export const hoverRequest = async (message: RequestMessage) : Promise<HoverResult>  => {
    const textDocumentt = message.params as textDocumentType
    let lastWord = getLastWord(textDocumentt).lastWord
    if (lastWord == '')
        return {
            contents : ''
        }

    for (let key  of Object.keys(lastWordAnswerMatches)) {
       if (lastWord.indexOf(key) == 0)
       {
           if (key === '@')
           {
               const indexEnd = lastWord.indexOf('="')
               const text = getTextForEvent(lastWord.substring(1, indexEnd))
               return {
                   contents : text
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
               const relPath = fileName.split(infos.rootUri!)[1]
               if (fileNames.indexOf(relPath) === -1)
               {
                   output += relPath
                   fileNames.push(relPath)
               }
           }
       })
    }
    if (output === 'dispatched in ') return 'regular event'
    return output
}
