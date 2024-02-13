export interface InitializeParams {
    processId: number;


    clientInfo?: {
        name: string;

        version?: string;
    };
    initializationOptions: {
        tsserver : {
            logVerbosity : string
        }
    }

    locale?: string;
    rootPath?: string | null;
    rootUri: string;

    capabilities: object;

    workspaceFolders?: unknown;
}

export interface Position {

    line: number;

    character: number;
}
export interface customEvent  {
    name: string,
    details: dispatchVariables
}
export type dispatchVariables = Record<string, unknown>


