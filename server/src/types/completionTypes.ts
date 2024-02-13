import {Range} from "./ClientTypes";

export type CompletionItemKind = 1 | 2 | 3 | 6 |  15

export type InsertTextFormat = 1 | 2
export interface textEdit {
    range: Range,
    newText: string
}

export interface CompletionItem {

    label: string
    kind: CompletionItemKind,
    insertTextFormat?: InsertTextFormat,
    textEdit?: textEdit
}
