import {CompletionItem} from "./types/completionTypes";

export const atOptionsJustString = ['click']

export const atoptionsForAt : CompletionItem[] = atOptionsJustString.map((item) => {
    return {
        label : `@${item}\${1:}=" \${2:bar} "`,
        kind : 15,
        insertTextFormat : 2
    }
})
export const atoptionsForXon : CompletionItem[] = atOptionsJustString.map((item) => {
    return {
        label : `:${item}\${1:}=" \${2:bar} "`,
        kind : 15,
        insertTextFormat : 2
    }
})

