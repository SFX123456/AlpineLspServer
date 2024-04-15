import log from "./log";
import * as process from "process";
import {initialize} from "./methods/initialize";
import {completion} from "./methods/textDocument/completion";
import {didChange} from "./methods/textDocument/didChange";
import {hoverRequest} from "./methods/textDocument/hover";
import {didOpen} from "./methods/textDocument/didOpen";
import {semantic} from "./methods/textDocument/semantic";
import Log from "./log";
import {definitionRequest} from "./methods/textDocument/definition";

export interface RequestMessage{
    id: number | string;
    method: string;
    params? : unknown[] | object
}
type RequestMethod = (message : RequestMessage) => Promise<unknown | null>;
const methodLookUp : Record<string, RequestMethod> = {
    initialize,
    'textDocument/completion' : completion,
    'textDocument/didChange': didChange,
    'textDocument/hover': hoverRequest,
    'textDocument/didOpen': didOpen,
    'textDocument/semanticTokens/full' : semantic,
    'textDocument/definition' : definitionRequest
}
const respond = async (id : number, fn : Function, params: unknown) => {
    const res = await fn(params)
    if (!res) return
    const message = JSON.stringify({id,result:  res})
    const headerLength = Buffer.byteLength(message, "utf-8")
    const header = `Content-Length: ${headerLength}\r\n\r\n`
    Log.writeLspServer('responding with ' + header + message)
    process.stdout.write(header + message)

}

let initializeMethod = true

let buffer = ''
process.stdin.on('data', async (chunk) => {
    buffer += chunk;
    while (true)
    {
        const match = buffer.match(/Content-Length: (\d+)\r\n/)
        if (!match) break;
        const contentLength = parseInt(match[1], 10)
        const messageStart = buffer.indexOf('\r\n\r\n') + 4
        if (buffer.length < messageStart + contentLength) break
        const rawMessage = buffer.slice(messageStart, messageStart + contentLength)
        const message = JSON.parse(rawMessage)
        const method = methodLookUp[message.method]
        if (method)
        {
            if (initializeMethod)
            {
                Log.writeLspServer('got initilaize method')
                await respond(message.id, method, message)
                initializeMethod = false
            }
            else
            {
                await respond(message.id, method, message)
            }
        }
        log.write({id: message.id, method: message.method, params : message.params})
        buffer = buffer.slice(messageStart + contentLength)
    }
})
