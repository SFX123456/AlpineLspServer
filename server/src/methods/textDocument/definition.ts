import {RequestMessage} from "../../server";
import {customEvent, listenedToObjects, Range, textDocumentType} from "../../types/ClientTypes";
import {getLastWord} from "../../analyzeFile";
import Log from "../../log";
import {allHtml} from "../../allFiles";
import {InsertTextMode} from "vscode-languageserver";

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
    const line = textDocumentt.position.line
    const character = textDocumentt.position.character
    const lastWord = getLastWord(textDocumentt)

    Log.writeLspServer('definitonrequest')
    Log.writeLspServer(lastWord)
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
        Log.writeLspServer('answer')
        Log.writeLspServer(answer)
        return answer
    }
   // if (!isDispatchEvent(lastWord.wholeLineTillEndofWord)) return  null
    const dispatcher = isEventListener(lastWord.lastWord)
    if (dispatcher)
    {
        Log.writeLspServer('line ')
        Log.writeLspServer(dispatcher)
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

function buildResponseMessage()
{

}

function isEventListener(lastWord : string) :null | dispatchedEvents[]
{
    Log.writeLspServer('is event listener')
    const regExp = /@([a-z-]*)/
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
    const regexp = /\$dispatch\(\s*'([a-z]+)'/
    const match = lastWord.match(regexp)
    if (!match) return null

    Log.writeLspServer('search here jonas')
    Log.writeLspServer(match[1])



    let output : dispatchedEvents[] = []


    for (let key of allHtml.keys()) {
    const kober : Record<string, number> = {}
    let isIn = false
    allHtml.get(key)!.listenedToEventsPosition.forEach(item => {

        Log.writeLspServer(match[1])
        Log.writeLspServer(item.name)
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

    Log.writeLspServer('all keys')
    Log.writeLspServer(output)

    return output
}

function isItADispatchFn(line : string): boolean
{
    const regExp = /\$dispatch\(\s*'([a-z-]+)'(?:\s*,+\s*{((?:[a-zA-Z\s-]+:[a-z,0-9\s\n']+)+)}\s*|\s*)\)/
    return line.match(regExp) != null
}
