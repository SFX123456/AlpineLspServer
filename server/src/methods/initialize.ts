import {RequestMessage} from "../server";
import {initializeTypescriptServer, infos} from "../typescriptLsp/typescriptServer";
import {InitializeParams} from "../types/ClientTypes";
import Log from "../log";

type ServerCapabilities = Record<string, unknown>

interface InitializeResult
{
    capabilities : ServerCapabilities;
    serverInfo?: {
        name: string;
        version? : string;
    }
}




export const initialize = async (message : RequestMessage) : Promise<InitializeResult> => {
    const initializeParams = message.params as unknown as InitializeParams
    Log.writeLspServer('search here 2')
    Log.writeLspServer(initializeParams)
    infos.rootUri = initializeParams.rootUri
    infos.rootPath = initializeParams.rootPath!
    Log.writeLspServer('initialized methjod callled once')
    await initializeTypescriptServer(message)
    return {
        capabilities : {
            completionProvider: {
                triggerCharacters: ['@', 'x', '\"', 'c', '$', '.']
            },
            resolveProvider: true,
            textDocumentSync: 1,
            hoverProvider: {

            },
            semanticTokensProvider: {
                legend: {
                    tokenTypes:["class","enum","interface","namespace","typeParameter","type","parameter","variable","enumMember","property","function","member"],
                    tokenModifiers:["declaration","static","async","readonly","defaultLibrary","local"]
                },
                full: true,
                documentSelector: null
            }


        },
        serverInfo: {
            name: "alpinelspServer",
            version: "0.0.1"
        }
    }
}
