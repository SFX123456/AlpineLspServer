import {ChildProcessWithoutNullStreams, spawn} from 'child_process';
import Log from "./log";
import log from "./log";
import {initializeMethodReaction} from "./MethodsLspClient/RequestInitialized";
import {InitializeParams} from "./ClientTypes";
import * as fs from "fs";
import {data} from "cheerio/lib/api/attributes";
import {allFiles} from "./allFiles";

let  childProcess : ChildProcessWithoutNullStreams;
const command = "typescript-language-server.cmd"
const args = ['--stdio'];

let requestId = 0;

let filePath = ''
let filePathUri = ''

const requestedMethods = new Map<number, string>

export const request = async (id : Boolean,method: string, clientRequest : unknown) : Promise<object | null> => {

        Log.writeLspServer('request method called with method ' + method)


        let message = ''
        if (id)
        {
            requestId++;
            requestedMethods.set(requestId, method)
            //log.write('set ' + method + id)
            message = JSON.stringify({jsonrpc: '2.0',id : requestId,method: method, params:  clientRequest})
        }
        else
        {
            message = JSON.stringify({method: method, params:  clientRequest})
        }

        const headerLength = Buffer.byteLength(message, "utf-8")
        const header = `Content-Length: ${headerLength}\r\n\r\n`
        childProcess.stdin.write(header + message)
        log.writeLspServer('Sending ' + header + message)
        if (id)
        {
            Log.writeLspServer('is called once per id ' + requestId)
        }
        if (id) {
            return (await listenToAnswer(requestId))
        }

        return null

}
type validMethods = 'completion' | 'hover'
let version = 2
export const requestingMethods = async (method : validMethods, content : string, line: number, character: number) : Promise<object | null> =>  {

    if (method == 'completion')
    {
        filePathUri = ''
        Log.writeLspServer('completion on requestingmethods called')
        /*
        await request(false, 'textDocument/didOpen', {
            textDocument: {
                uri: filePathUri,
                languageId:"javascript",
                version:version,
                text: content
            }
        })

         */
        Log.writeLspServer('trsing to give it out')

        await request(false, 'textDocument/didChange', {
            textDocument : {
                uri: filePathUri,
                version: version
            },
            contentChanges: [
                {
                    text: content
                }
            ]
        })
        Log.writeLspServer(content.split('\n')[line])
        Log.writeLspServer(character.toString())
        let lastWord = getLastWord(content.split('\n')[line], character)
        Log.writeLspServer('lastWord here')
        Log.writeLspServer(lastWord)
        //version++;
        return request(true, 'textDocument/completion', {
            textDocument: {uri : filePathUri},
            position:{line,character: character},
            context:{"triggerKind":1}
        })

    }
    return null
}


async function listenToAnswer(id: number): Promise<object>
{
    return  new Promise(resolve => {

        let buffer = ''
        const onData = (data : string) => {
            buffer += data
            //Log.writeLspServer(buffer)
            while (true) {
                const match = buffer.match(/Content-Length: (\d+)\r\n/)
                if (!match) break;
                const contentLength = parseInt(match[1], 10)
                const messageStart = buffer.indexOf('\r\n\r\n') + 4
                if (buffer.length < messageStart + contentLength) break
                const rawMessage = buffer.slice(messageStart, messageStart + contentLength)
                Log.write(buffer)
                if (rawMessage.includes('id') ) {
                    Log.writeLspServer('found matchiong response')
                    const message = JSON.parse(rawMessage)
                    Log.writeLspServer(message)
                    resolve(message)
                    childProcess.stdout.off('data', onData)
                    Log.writeLspServer('resolve did not stop it ')
                    break
                } else {
                    Log.writeLspServer('differnet match for id ')
                    //Log.writeLspServer(message)
                }
                buffer = buffer.slice(messageStart + contentLength)
            }
        }
        Log.writeLspServer('waiting for answer')
        childProcess.stdout.on('data', onData);
    })



}






export const initializeTypescriptServer = async (receivedInitializedMessage : object) => {
    // @ts-ignore
    const receivedInitializedParams = receivedInitializedMessage.params as InitializeParams
    Log.writeLspServer(receivedInitializedMessage)
    childProcess = spawn(command, args);

    childProcess.on('close', (code) => {
        Log.writeLspServer(`child process closed with code ${code}`)
    });

    childProcess.on('exit', (code, signal) => {
        Log.writeLspServer(`child process exited with code ${code}`)
    });
    receivedInitializedParams.processId = childProcess.pid!
    receivedInitializedParams.workspaceFolders = null
    receivedInitializedParams['initializationOptions'] = {
        tsserver : {
            logVerbosity: 'verbose'
        }
    }
    await request(true, 'initialize', receivedInitializedParams)
    await request(false, 'initialized', {})
    Log.writeLspServer('initialized lsp server with params ' + JSON.stringify(receivedInitializedParams))
    await request(false, 'textDocument/didOpen', {
        textDocument: {
            uri: '',
            languageId:"javascript",
            version:version,
            text: ''
        }
    })
    Log.writeLspServer('opened document ')
}

function getLastWord(wholeLine : string, character : number): string {
    let spaceCharIndex = wholeLine.substring(0, character).lastIndexOf(' ')
    let startTagIndex = wholeLine.substring(0, character).lastIndexOf('<')
    let startIndex = Math.max(spaceCharIndex, startTagIndex)
    let spaceCharIndexEnd = wholeLine.substring(character).indexOf(' ')
    let endTagIndex = wholeLine.substring(character).indexOf('>');
    if (endTagIndex == -1) endTagIndex = 900
    if (spaceCharIndexEnd == -1) spaceCharIndexEnd = 900
    let endIndex = Math.min(spaceCharIndexEnd, endTagIndex, wholeLine.length - character)
    return wholeLine.substring(startIndex + 1, endIndex + character)
}
