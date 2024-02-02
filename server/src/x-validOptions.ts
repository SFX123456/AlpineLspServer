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

export const xoptions : CompletionItem[] = [
    {
        label: 'x-data={${1:foo} : ${2:bar}}',
        kind: 15,
        insertTextFormat : 2,

    },
]
