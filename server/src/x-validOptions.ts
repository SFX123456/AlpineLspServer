import {CompletionItem} from "./types/completionTypes";



export const xoptions : CompletionItem[] = [
    {
        label: 'x-data=\"{${1:foo} : ${2:bar}}\"',
        kind: 15,
        insertTextFormat : 2,

    },
    {
        label: 'x-init=\"${1:foo} \"',
        kind: 15,
        insertTextFormat : 2,

    },
]
