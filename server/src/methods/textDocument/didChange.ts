import {allFiles, allHtml} from "../../allFiles";
import log from "../../log";
import {RequestMessage} from "../../server";
import {saveCheerioFile} from "../../cheerioFn";
import {TextDocumentItem} from "../../types/ClientTypes";


type contentChange = {
    text: string
}
interface textDocument {
    textDocument : TextDocumentItem,
    contentChanges: contentChange[]
}


export const didChange = async (message : RequestMessage): Promise<void> => {
    const params = message.params as textDocument
    saveCheerioFile(params.contentChanges[0].text, params.textDocument.uri)
    allFiles.set(params.textDocument.uri, params.contentChanges[0].text)
    log.write('safing ' + params.textDocument.uri +  params.contentChanges[0].text)

    params.contentChanges.forEach(x => {
       log.write(x.text)
    })
}





