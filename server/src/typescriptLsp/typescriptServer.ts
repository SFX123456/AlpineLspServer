import {ChildProcessWithoutNullStreams, spawn} from 'child_process';
import Log from "../log";
import log from "../log";
import {InitializeParams} from "../types/ClientTypes";
import * as dotenv from 'dotenv'
dotenv.config()
let  childProcess : ChildProcessWithoutNullStreams;
const command = "typescript-language-server.cmd"
const args = ['--stdio'];

let requestId = 0;

let filePathUri = ''


export let infos : {
    rootPath?: string,
    rootUri? : string
} = {}


export const request = async (id : Boolean,method: string, clientRequest : unknown) : Promise<object | null> => {

        Log.writeLspServer('request method called with method ' + method)


        let message = ''
        if (id)
        {
            requestId++;
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
        if (id) {
            return (await listenToAnswer(requestId))
        }

        return null

}
type validMethods = 'completion' | 'hover' | 'semantic'
let version = 2
export const requestingMethods = async (method : validMethods, content : string, line: number, character: number) : Promise<object | null> =>  {
    version++
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
    if (method == 'completion')
    {
        return request(true, 'textDocument/completion', {
            textDocument: {uri : filePathUri},
            position:{line,character: character},
            context:{"triggerKind":1}
        })

    }
    else if (method === 'semantic')
    {
        return request(true, 'textDocument/semanticTokens/full', {
            textDocument: {
                uri:''
            }
        })
    }
    return null
}


async function listenToAnswer(id: number): Promise<object>
{
    return new Promise(resolve => {

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
    if (process.env.TYPESCRIPTSERVERLOG === 'true')
    {
        receivedInitializedParams['initializationOptions'] = {
            tsserver : {
                logVerbosity: 'verbose'
            }
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

