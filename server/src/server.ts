import log from "./log";
import * as process from "process";
import {initialize} from "./methods/initialize";
import {completion} from "./methods/textDocument/completion";
import {didChange} from "./methods/textDocument/didChange";
import {hoverRequest} from "./methods/textDocument/hover";
import {didOpen} from "./methods/textDocument/didOpen";
import {semantic} from "./methods/textDocument/semantic";
import Log from "./log";
import {initializeMethodReaction} from "./MethodsLspClient/RequestInitialized";

log.write("data")



export interface RequestMessage{
    id: number | string;
    method: string;
    params? : unknown[] | object
}
type RequestMethod = (message : RequestMessage) => unknown | null;
const methodLookUp : Record<string, RequestMethod> = {
    initialize,
    'textDocument/completion' : completion,
    'textDocument/didChange': didChange,
    'textDocument/hover': hoverRequest,
    'textDocument/didOpen': didOpen,
    'textDocument/semanticTokens/full' : semantic
}


const respond = (id : number, serverResponse : unknown) => {
    if (!serverResponse) return
    const message = JSON.stringify({id,result:  serverResponse})
    const headerLength = Buffer.byteLength(message, "utf-8")
    const header = `Content-Length: ${headerLength}\r\n\r\n`
    process.stdout.write(header + message)

}



let buffer = ''
process.stdin.on('data', (chunk) => {
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
            respond(message.id, method(message))
        }

        log.write({id: message.id, method: message.method, params : message.params})
        buffer = buffer.slice(messageStart + contentLength)
    }
})
