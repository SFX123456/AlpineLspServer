export let regexContentLength = /Content-Length: (\d+)\r\n/;
export let regexAtEvent = /@([a-z-]*)/

export let regexAlpineCharactersSemantic = /x-[a-zA-Z]+="|(?<![\\=])"|@[a-z-]+(\.[a-z]+)*="|let|var|const/g;


export let regexXAttrAndATMethods =  /(?:x-([a-z]+)|@([a-z-]+)[\.a-z-]*)="/g

export let regexEndingQuotationMarks = /(?<![\\=])"/

export let regexStartQuotationMarks = /="/g

export let regexStartHtmlElement = /<[a-z]+\s/;

export let regexEndHtmlElement = />[\r\s\n]*$/

export let regexDispatchInside = /\$dispatch\(['{}:a-zA-Z\s,\n\$]*\)/

export let regexXline = /x-line=\"([0-9]+)\"/

export let regexDispatchInsideEventName = /\$dispatch\([\s]*'$/

export let regexXFor =  /([a-z-]+)(\s+)in(\s+)([a-z-]+)/g

export let regexDispatchGetEventName =  /\$dispatch\(\s*'([a-z]+)'/
