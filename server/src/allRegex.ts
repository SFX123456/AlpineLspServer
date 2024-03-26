export const regexEndingOpeningTag =  />(?:[\r\n\s]*$|\s*<\/)/;
export const regexOpeningTagHtml =   /<[a-z]+\s/;

export const regexEndQuotationMarks = /(?<![\\=])"/

export const regexStartingAlpineExpression =  /(x-[a-zA-Z]*="|@[a-zA-Z]*=")/

export const regexHighlightingSemantics =  /(?:x-([a-z:\.]+)|@([a-z-]+)[\.a-z-]*)="/g
