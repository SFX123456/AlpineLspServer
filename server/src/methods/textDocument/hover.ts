import {RequestMessage} from "../../server";
import {textDocument} from "./completion";
import {getLastWord} from "../../analyzeFile";
import log from "../../log";
interface HoverResult {
    contents: string
}
export const hoverRequest = async (message: RequestMessage) : Promise<HoverResult>  => {
    const textDocument = message.params as textDocument
    const lastWord = getLastWord(textDocument)
    if (lastWord === 'x-cloak')
        return {
            contents: 'hides the element until Alpine is fully loaded'
        }

    return {
        contents: 'test'
    }

}
