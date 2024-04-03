import {allFiles} from "../../allFiles";
import log from "../../log";
import {RequestMessage} from "../../server";
import * as cheerio from "cheerio";
import {saveCheerioFile} from "../../cheerioFn";
import Log from "../../log";



export type DocumentUri = string;
interface textDocument {
    textDocument : TextDocumentItem,

}
interface TextDocumentItem {
    uri: DocumentUri;
    languageId: string;
    version: number;
    text: string;
}

export const didOpen = async (message : RequestMessage) => {
    const params = message.params as textDocument
    log.write('saved '+ params.textDocument.text)
    allFiles.set(params.textDocument.uri, params.textDocument.text)
    saveCheerioFile(params.textDocument.text, params.textDocument.uri)

    return null
}


