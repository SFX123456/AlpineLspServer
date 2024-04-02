import {CompletionList} from "../../../types/ClientTypes";
import {xoptions} from "../../../x-validOptions";
import {addNecessaryCompletionItemProperties, completionResponse} from "../completion";
import {getLastWordWithUriAndRange} from "../../../analyzeFile";
import Log from "../../../log";

export const completionX : completionResponse = async (line: number, char : number,uri : string | undefined , lastWord : string| undefined) : Promise<CompletionList | null> =>
{
    const readyXoptions = addNecessaryCompletionItemProperties(xoptions, line, char)
    return {
        isIncomplete: false,
        items: readyXoptions
    }
}
