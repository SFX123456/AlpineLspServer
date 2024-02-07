import {RequestMessage} from "../server";

type ServerCapabilities = Record<string, unknown>

interface InitializeResult
{
    capabilities : ServerCapabilities;
    serverInfo?: {
        name: string;
        version? : string;
    }
}

export const initialize = (message : RequestMessage) : InitializeResult => {
    return {
        capabilities : {
            completionProvider: {
                triggerCharacters: ['@', 'x', '\"']
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
