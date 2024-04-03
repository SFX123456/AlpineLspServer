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
    textEdit?: textEdit,
    labelDetails? : CompletionItemLabelDetails
}

interface CompletionItemLabelDetails
{
    detail?: string;

    /**
     * An optional string which is rendered less prominently after
     * {@link CompletionItemLabelDetails.detail}. Should be used for fully qualified
     * names or file path.
     */
    description?: string;
}
