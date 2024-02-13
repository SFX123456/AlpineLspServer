import {CompletionList} from "../../../types/ClientTypes";
import {xoptions} from "../../../x-validOptions";
import {addNecessaryCompletionItemProperties, completionResponse} from "../completion";

export const completionX : completionResponse = async (line: number, char : number) : Promise<CompletionList | null> =>
{
    const readyXoptions = addNecessaryCompletionItemProperties(xoptions, line, char)

    return {
        isIncomplete: false,
        items: readyXoptions
    }
}
