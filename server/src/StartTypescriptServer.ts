import {ChildProcessWithoutNullStreams, spawn} from 'child_process';
import Log from "./log";
import log from "./log";
import {initializeMethodReaction} from "./MethodsLspClient/RequestInitialized";
import {InitializeParams} from "./ClientTypes";
import * as fs from "fs";

let  childProcess : ChildProcessWithoutNullStreams;
const command = "typescript-language-server.cmd"
const args = ['--stdio'];

let requestId = 1;

let filePath = ''
let filePathUri = ''

const requestedMethods = new Map<number, string>

export const request = (id : number | null,method: string, clientRequest : unknown) : object | void=> {

        Log.writeLspServer('request method called with method ' + method)
        if (!clientRequest)
        {
            //Log.write("was empty " + JSON.stringify(clientRequest))
            return
        }
        let message = ''
        if (id != null)
        {
            requestedMethods.set(id, method)
            //log.write('set ' + method + id)
            message = JSON.stringify({jsonrpc: '2.0',id,method: method, params:  clientRequest})
        }
        else
        {
            message = JSON.stringify({method: method, params:  clientRequest})
        }

        const headerLength = Buffer.byteLength(message, "utf-8")
        const header = `Content-Length: ${headerLength}\r\n\r\n`
        childProcess.stdin.write(header + message)
        log.writeLspServer('Sending ' + header + message)

        if (id != null) {
            requestId++;
            return listenToAnswer(id! - 1)
        }

        return

}
type validMethods = 'completion' | 'hover'
let version = 2
export const requestingMethods = (uri: string, method : validMethods, additionalVar : string[], content : string, lastWord : string) : object | void=> {
    const fullText = createFullFakeFileContent(content, additionalVar)
    //first line all variables
    if (method == 'completion')
    {
         fs.writeFileSync(filePath, fullText)
        //fs.close(x,null )
        //filePathUri = 'file:///e%3A/fsd/test/index.ts'
        Log.writeLspServer('completion on requestingmethods called')
        const indexLastWord = fullText.lastIndexOf(lastWord)
        request(null, 'textDocument/didOpen', {
            textDocument: {
                uri: filePathUri,
                languageId:"typescript",
                version:version,
                text: fullText
            }
        })
        version++
        request(null, 'textDocument/didChange', {
            textDocument : {
                uri: filePathUri,
                version: version
            },
            contentChanges: [
                {
                    text: fullText
                }
            ]
        })
        version++;
        return request(requestId, 'textDocument/completion', {
            textDocument: {uri : filePathUri},
            position:{line:0,character:indexLastWord + lastWord.length},
            context:{"triggerKind":1}
        })

    }
    return
}


function listenToAnswer(id: number): object
{
    let output : object | null = null
    let buffer = ''
    Log.writeLspServer('waiting for answer')
    childProcess.stdout.on('data', (data ) => {
        buffer+= data
        Log.writeLspServer(buffer)
        //console.log(data.toString())
        while (output == null)
        {
            const match = buffer.match(/Content-Length: (\d+)\r\n/)
            if (!match) break;
            const contentLength = parseInt(match[1], 10)
            const messageStart = buffer.indexOf('\r\n\r\n') + 4
            if (buffer.length < messageStart + contentLength) break
            const rawMessage = buffer.slice(messageStart, messageStart + contentLength)
            const message = JSON.parse(rawMessage)
            if (message.id === id)
            {
                Log.writeLspServer('found matchiong response')
                output = message
            }
            Log.writeLspServer('differnet match')
            buffer = buffer.slice(messageStart + contentLength)
        }
    });
    return output!
}

function createFullFakeFileContent(content : string, variables : string[])
{
    let varText = variables.map(variab => 'let ' + variab + ';').join(' ')
    Log.writeLspServer('generated fake content ' + varText + content)
    return varText + content;
}



export function createFakeTsFile(path: string, uri: string)
{
    //file:///e%3A/fsd/test/tomas.txt
    Log.writeLspServer('that has rto work')
    Log.writeLspServer('creating file ' + uri)
    filePathUri = uri + "/" + 'temp.ts'
    filePath = path + '/' + 'temp.ts'
        fs.writeFileSync(filePath, '');
    request(null, 'textDocument/didOpen', {
        textDocument: {
            uri: filePathUri,
            languageId:"typescript",
            version:1,
            text:" "
        }
    })
}

export const initializeTypescriptServer = (receivedInitializedMessage : object) => {
    // @ts-ignore
    const receivedInitializedParams = receivedInitializedMessage.params as InitializeParams
    Log.writeLspServer(receivedInitializedMessage)
    childProcess = spawn(command, args);
    createFakeTsFile(receivedInitializedParams.rootPath!, receivedInitializedParams.rootUri)

    childProcess.on('close', (code) => {
        Log.writeLspServer(`child process closed with code ${code}`)
        //console.log(`child process exited with code ${code}`);
    });

    childProcess.on('exit', (code, signal) => {
        //console.log(`child process exited with code ${code}, signal ${signal}`);
        Log.writeLspServer(`child process exited with code ${code}`)
    });
    receivedInitializedParams.processId = childProcess.pid!
    receivedInitializedParams.workspaceFolders = null
    receivedInitializedParams['initializationOptions'] = {
        tsserver : {
            logVerbosity: 'verbose'
        }
    }
    request(requestId, 'initialize', receivedInitializedParams)
    initializeMethodReaction({}  )
    Log.writeLspServer('initialized lsp server with params ' + JSON.stringify(receivedInitializedParams))
}
