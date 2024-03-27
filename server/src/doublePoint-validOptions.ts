import {CompletionItem} from "./types/completionTypes";

export const doublePointJustString = ['about','accesskey', 'aria-atomic', 'aria-busy', 'aria-checked', 'aria-controls', 'aria-current', 'aria-describedby', 'aria-description', 'aria-details','aria-disabled', 'aria-dropeffect','aria-errormessage','aria-expanded','aria-flowto','aria-grabbed','aria-haspopup','aria-hidden','aria-invalid','aria-keyshortcut','aria-label','aria-labelledby','aria-level','aria-live','aria-orientation','aria-owns','aria-posinset','aria-relevant','aria-roledescription','aria-selected','aria-setzize','autocapitalize','autofocus','base','class','content','contenteditable','datatype','dir','draggable','enterkeyhint','hidden','id','inert','inlist','inputmode','is','itemid','itemprop','itemref','itemscope','itemtype','lang','nonce','prefix','property','rel','resource','rev','role','slot','space','spellcheck','style','tabindex','title','translate','type','typeof','value','vocab']

export const doublePointCompletions : CompletionItem[] = doublePointJustString.map((item) => {
    return {
        label : `:${item}=" \${1:bar} "`,
        kind : 15,
        insertTextFormat : 2
    }
})


