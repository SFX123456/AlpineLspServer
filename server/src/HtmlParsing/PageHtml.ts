import * as cheerio from "cheerio";
import * as cheerioType from "domhandler/lib/node"
import Log from "../log";
import log from "../log";

export class PageHtml
{
    public events : string[];
    public cheerioObj : cheerio.CheerioAPI

    public constructor(cheerioObj: cheerio.CheerioAPI) {
        this.events = []
        this.cheerioObj = cheerioObj
        cheerioObj('body').children().each((index : any, element : cheerio.Element) => {
            this.processElement(element);
        })
    }


    public processElement(element : cheerio.Element) {
        element.children.forEach((child : cheerioType.ChildNode) => {
            if (child.type === 'tag') {
                const z = child.attribs
                for (const key of Object.keys(child.attribs))
                {
                    if(key[0] === "@")
                    {
                        this.events.push(key.split(".")[0].substring(1))
                    }
                }
                this.processElement(child);
        }
    });
}
}
