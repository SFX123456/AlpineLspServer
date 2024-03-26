import {CompletionItem} from "./types/completionTypes";

export const doublePointJustString = ['placeholder','class']

export const doublePointCompletions : CompletionItem[] = doublePointJustString.map((item) => {
    return {
        label : `:${item}=" \${1:bar} "`,
        kind : 15,
        insertTextFormat : 2
    }
})


