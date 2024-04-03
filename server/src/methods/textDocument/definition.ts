import {RequestMessage} from "../../server";
import { listenedToObjects, Range, textDocumentType} from "../../types/ClientTypes";
import {getLastWordInfos} from "../../analyzeFile";
import Log from "../../log";
import {allHtml} from "../../allFiles";
import {regexAtEvent, regexDispatchGetEventName} from "../../allRegex.js";

interface location {
    uri : string,
    range: Range,
}

interface dispatchedEvents extends listenedToObjects
{
    uri: string
}
export const definitionRequest = async (message: RequestMessage) : Promise<location[] | location | null>  => {
    const textDocumentt = message.params as textDocumentType
    const lastWord = getLastWordInfos(textDocumentt)

    Log.writeLspServer('definitonrequest')
    const listenedEvents = isDispatchEvent(lastWord.wholeLineTillEndofWord)
    if (listenedEvents)
    {
       const answer =  listenedEvents.map(item => {
        return {
            uri : item.uri,
            range : {
                start : {
                    line : item.positon.line,
                    character: item.positon.character
                },
                end : {
                    line: item.positon.line,
                    character: item.positon.character + item.name.length
                }
            }
        }

        })
        return answer
    }
   // if (!isDispatchEvent(lastWord.wholeLineTillEndofWord)) return  null
    const dispatcher = isEventListener(lastWord.lastWord)
    if (dispatcher)
    {
        return dispatcher.map(item => {
            return {
                uri : item.uri,
                range: {
                    start: {
                        line: item.positon.line,
                        character: item.positon.character
                    },
                    end:
                        {
                            line: item.positon.line,
                            character: item.positon.character + item.name.length
                        }

                }
            }
        })
    }

    return null
}

function isEventListener(lastWord : string) :null | dispatchedEvents[]
{
    Log.writeLspServer('is event listener')
    const regExp = regexAtEvent
    const match = lastWord.match(regExp)
    if (!match) return null

    const output : dispatchedEvents[] = []
    for (let key of allHtml.keys()) {
        const kober : Record<string, number> = {}
        allHtml.get(key)!.events.forEach(item => {
            if (item.name === match[1])
            {
                const str = JSON.stringify(item)
                if (!kober[str]) {
                    Log.writeLspServer('adding ' + item.name)
                    kober[str] = 1
                    output.push({
                        uri : key,
                        positon : item.position,
                        name : item.name
                    })
                }
            }
        })
    }

    return output
}


function isDispatchEvent(lastWord : string) :null | dispatchedEvents[]
{
    const regexp = regexDispatchGetEventName
    const match = lastWord.match(regexp)
    if (!match) return null

    let output : dispatchedEvents[] = []

    for (let key of allHtml.keys()) {
        const kober : Record<string, number> = {}
        allHtml.get(key)!.listenedToEventsPosition.forEach(item => {

            if (item.name === match[1])
            {
                const str = JSON.stringify(item)
                if (!kober[str])
                {
                    Log.writeLspServer('added to kober')
                    kober[str] = 1
                    output.push({
                        uri: key,
                        name: item.name,
                        positon : item.positon
                    })
                }
            }
        })
    }

    return output
}

function isItADispatchFn(line : string): boolean
{
    const regExp = /\$dispatch\(\s*'([a-z-]+)'(?:\s*,+\s*{((?:[a-zA-Z\s-]+:[a-z,0-9\s\n']+)+)}\s*|\s*)\)/
    return line.match(regExp) != null
}
