import {CompletionItem} from "./completionTypes";

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

export interface listenedToObjects {
    name : string,
    positon : Position
}
export interface customEvent  {
    name: string,
    details: dispatchVariables,
    position : Position
}
export type dispatchVariables = Record<string, unknown> | string | number

export interface Range {
    start: Position,
    end: Position
}

export interface textDocumentType {
    textDocument: TextDocumentItem,
    position: Position
}

export interface CompletionList {
    isIncomplete: boolean;
    items: CompletionItem[];
}

export interface TextDocumentItem {
    uri: DocumentUri;
    languageId: string;
    version: number;
    text: string;
}

export type DocumentUri = string;

export type lastWordInfos = {
    wholeLine : string,
    lastWord : string,
    wholeLineTillEndofWord : string
}

