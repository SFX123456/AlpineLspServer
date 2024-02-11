import {allFiles, allHtml} from "../../allFiles";
import log from "../../log";
import {RequestMessage} from "../../server";
import * as cheerio from "cheerio";
import {func} from "vscode-languageserver/lib/common/utils/is";
import {saveCheerioFile} from "../../cheerioFn";


export type DocumentUri = string;
type contentChange = {
    text: string
}
interface textDocument {
    textDocument : TextDocumentItem,
    contentChanges: contentChange[]
}
export interface TextDocumentItem {
    uri: DocumentUri;
    languageId: string;
    version: number;
    text: string;
}



export const didChange = async (message : RequestMessage): Promise<null> => {
    const params = message.params as textDocument
    saveCheerioFile(params.contentChanges[0].text, params.textDocument.uri)
        allFiles.set(params.textDocument.uri, params.contentChanges[0].text)
log.write('safing ' + params.textDocument.uri +  params.contentChanges[0].text)

    params.contentChanges.forEach(x => {
       log.write(x.text)
    })
    //log.write(allFiles.size.toString())
    //log.write(params.textDocument.uri)
    return null
}





