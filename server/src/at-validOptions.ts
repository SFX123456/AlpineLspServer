import {Range} from "./methods/textDocument/completion";

export type CompletionItemKind = 1 | 2 | 15


export interface CompletionItem {

    label: string
    kind: CompletionItemKind,
    insertTextFormat?: InsertTextFormat,
    textEdit?: textEdit
}

export type InsertTextFormat = 1 | 2
export interface textEdit {
    range: Range,
    newText: string
}

export const magicObjects = ['$el', '$refs', '$store', '$watch', '$dispatch', '$nextTick', '$root', '$data', '$id', '$justTestomg']

export const atoptions : CompletionItem[] = [
    {
        label: '@click=" ${1:foo} "',
        kind: 15,
        insertTextFormat : 2,

    },
]
