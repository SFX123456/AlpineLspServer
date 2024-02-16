import {CompletionItem} from "./types/completionTypes";

export const atOptionsJustString = ['click']

export const atoptions : CompletionItem[] = atOptionsJustString.map((item) => {
    return {
        label : `@${item}\${1:}=" \${2:bar} "`,
        kind : 15,
        insertTextFormat : 2
    }
})

