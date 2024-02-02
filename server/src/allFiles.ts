import {DocumentUri} from "./methods/textDocument/didChange";
import Cheerio, {CheerioAPI} from "cheerio"
import {PageHtml} from "./HtmlParsing/PageHtml";
export const allHtml = new Map<DocumentUri, PageHtml>
export const allFiles = new Map<DocumentUri, string>
