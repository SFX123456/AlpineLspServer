import {RequestMessage} from "../server";
import {initializeTypescriptServer} from "../StartTypescriptServer";
import {InitializeParams} from "../ClientTypes";
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
    const initializeParams = message as unknown as InitializeParams
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
                    tokenTypes: ['property', 'type', 'class'],
                    tokenModifiers: ['private', 'static']
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
