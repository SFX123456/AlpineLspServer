import {allFiles} from "./allFiles";
import {rangeIndexTreesitter} from "./treeSitterHmtl";
import {extractKeysAndGenerateStr} from "./cheerioFn";
import {customEvent} from "./types/ClientTypes";

const Parser = require('tree-sitter');
const javascript = require("tree-sitter-javascript");

interface typeParameterWithCoord extends rangeIndexTreesitter
{
    type: "number" | "string" | "object"
}

enum nodeTypes  {
    isFunctionExpression    = 'call_expression',
    functionName = 'identifier',
}

function getTree(content : string)
{
    const parser = new Parser();
    parser.setLanguage(javascript);
    return parser.parse(content)
}

export function getDispatchKeywords(uri : string,content : string)
{
    const tree = getTree(content)
    const dispatchedEvents : customEvent[] = []
    traverse(uri, tree.rootNode, dispatchedEvents  );
    return dispatchedEvents;
}

function traverse(uri : string, node: any, dispatchedEvents : customEvent[] ) {
    if (node.type !== nodeTypes.isFunctionExpression)
    {
        node.children.forEach((child : any) => traverse(uri,child, dispatchedEvents));
        return;
    }

    if (node.children[0].type !== nodeTypes.functionName
        || allFiles.get(uri)!.substring(node.children[0].startIndex, node.children[0].endIndex) !== '$dispatch'
    ) return



    let eveentNameCoord = getEventNameIndex(node.children[1])

    if (!eveentNameCoord) return

    const eventName = allFiles.get(uri)!.substring(eveentNameCoord.startIndex, eveentNameCoord.endIndex)
    const dispatchedEvent: customEvent = {
        name: eventName,
        position: {
            line: eveentNameCoord.positionStart.row,
            character: eveentNameCoord.positionStart.column
        },
        details: null
    }

    const eventParaIndex = getEventParaIndex(node.children[1])
    if (eventParaIndex) {
        let eventPara = allFiles.get(uri)!.substring(eventParaIndex.startIndex, eventParaIndex.endIndex)
        if (eventParaIndex.type === 'string')
        {
            dispatchedEvent.details = eventPara
        }
        else if (eventParaIndex.type === 'number')
        {
            dispatchedEvent.details = parseInt(eventPara)
        }
        else {
            let keys: string[] = []
            const res = extractKeysAndGenerateStr(eventPara, keys)
            dispatchedEvent.details = res
        }
    }

    dispatchedEvents.push(dispatchedEvent)
}


function getEventNameIndex(node:any ) : rangeIndexTreesitter
{
    return {
        startIndex: node.children[1].startIndex + 1,
        endIndex: node.children[1].endIndex - 1,
        positionStart: node.children[1].startPosition
    }
}

function getEventParaIndex(node:any,  ) : typeParameterWithCoord | null
{
    for (let i = 2; i < node.children.length; i++) {
        let node2 = node.children[i]
        if (node2.type === 'number')
        {
            return {
                startIndex : node2.startIndex,
                endIndex : node2.endIndex,
                positionStart: node2.startPosition,
                type : "number"
            }
        }
        else if (node2.type === 'object')
        {
            return {
                startIndex : node2.startIndex ,
                    endIndex : node2.endIndex ,
                positionStart: node2.startPosition,
                type: "object"
            }
        }
        else if (node2.type === 'string')
        {
            return {
                startIndex : node2.startIndex +1 ,
                endIndex : node2.endIndex - 1,
                positionStart: node2.startPosition,
                type: "string"
            }
        }

    }
    return null;
}
