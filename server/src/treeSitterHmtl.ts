import {allFiles} from "./allFiles";
import Log from "./log";
import {Element} from "cheerio";

const Parser = require('tree-sitter');
const Html = require("../tree-sitter-hmtl2");

const validTypes = {
    'property_identifier' : 4,
    'identifier' : 4,
    '{' : 12,
    '}' : 12,
    '[' : 12,
    ']' : 12,
    ':' : 5,
    'false' : 18,
    'true' : 18,
    '\'' : 12,
    'formal_parameters' : 3,
    'this' : 5,
    '.' : 17,
    '=' : 17,
    '!' : 17,
    'let' : 11,
    'var' : 11,
    'const' : 11,
    'string_fragment' : 14,
}
enum nodeTypes  {
    //stores javascript text
    storesJavaScriptText= 'attribute_value',
    //stores whole x- expression
    storesXExpression = 'attribute',
    //stores x- name
    storesxname = 'attribute_name',
    documentNode = 'document',
    element = 'element',
    tag = 'start_tag'
}
export type positionTreeSitter = {
    row: number,
    column : number
}

type rangeIndex = {
    startIndex : number,
    endIndex : number
}
let tree : any
let parser : any
try {
     parser = new Parser();
    Log.writeLspServer('worked ', 1)
}
catch (e) {
    Log.writeLspServer('error ', 1)
}

parser.setLanguage(Html);

export function getAllJavascriptText(uri : string)
{
    const content = allFiles.get(uri)!
    const allJSArray = new Array(content.length)
    for (let i = 0; i < content.length; i++) {
        if (content[i] === '\n')
        {
            Log.writeLspServer('new line',1)
            allJSArray[i] = '\n'
        }
        else
        {
            allJSArray[i] = ' '
        }
    }
     tree = parser.parse(content);
    Log.writeLspServer('content : ' + content,1)
    // Start traversing from the root node
    traverse(content, tree.rootNode, allJSArray);
    return allJSArray.join('')
}
export function setUpForTestingTreesitter(content : string)
{

    tree = parser.parse(content);
}
export function getLastWord(content : string, point : positionTreeSitter)
{

    const node = tree.rootNode.descendantForPosition(point)
    Log.writeLspServer(node,1)
    if (node.type !== nodeTypes.storesxname)
    {
        return null
    }

    return content.substring(node.startIndex,node.endIndex)
}
function traverse(content : string, node: any, allJSArray : string[]) {
    if (node.type === nodeTypes.storesJavaScriptText)
    {
        const keyWord = getKeyWord(content, node.startPosition)
        const regex = /(?:x-([a-z:\.]+)|@([a-z-]+)[\.a-z-]*|\:[a-z]+)/g
        const match = regex.exec(keyWord!)
        Log.writeLspServer(match,1)
        if (match)
        {
            Log.writeLspServer('keyword : ' + keyWord,1)
            const javascriptPos = getJavascriptBetweenQuotationMarksPosition(content,node.startPosition)
            if (!javascriptPos) return
            for (let i = javascriptPos.startIndex; i < javascriptPos.endIndex; i++) {
                allJSArray[i] = content[i]
            }
        }
    }
    // Traverse the child nodes
    node.children.forEach((child : any) => traverse(content,child, allJSArray));
}
export function isInsideTag(pos : positionTreeSitter)
{
    const z = tree.rootNode.descendantForPosition(pos)
    Log.writeLspServer(z, 1)
    if (z.type === nodeTypes.documentNode)
    {
        return false
    }
    Log.writeLspServer('here',1)
    let foundNodeStartPos = z.startIndex
    let foundNodeEndPos = z.endIndex
    let j = z
    while (j.type !== nodeTypes.tag  && j.type !== nodeTypes.documentNode)
    {
        j = j.parent
    }
    Log.writeLspServer('here2',1)
    Log.writeLspServer(j,1)
    if (j.type === nodeTypes.documentNode)
    {
        return false
    }
    Log.writeLspServer(foundNodeStartPos,1)
    if (j.startIndex <= foundNodeStartPos  && j.endIndex >= foundNodeEndPos)
    {
        return true
    }
    return false;
}



function getJavascriptBetweenQuotationMarksPosition(content : string, pos : positionTreeSitter) : null | rangeIndex
{

    let m = tree.rootNode.descendantForPosition(pos)
    const indexQuotStart = m.startIndex
    const indexQuotEnd = m.endIndex
    while ((m = m.parent).type !== nodeTypes.storesXExpression && m.type !== nodeTypes.documentNode );
    Log.writeLspServer(m,1)
    if (JSON.stringify(m.startPosition) === JSON.stringify(pos) || JSON.stringify(m.endPosition) === JSON.stringify(pos)) return null
    Log.writeLspServer('go fuither ', 1)
    if (m.type === nodeTypes.documentNode) return null
    const posStrStart = m.startIndex
    const posStrEnd = m.endIndex
    Log.writeLspServer('dihfg',1)
    while ((m = m.parent).type !== nodeTypes.element && m.type !== nodeTypes.documentNode );
    Log.writeLspServer(m, 1)
    if (m.type === nodeTypes.documentNode) return null
    if (m.startIndex <= posStrStart && m.endIndex >= posStrEnd)
        return {
            startIndex : indexQuotStart,
            endIndex : indexQuotEnd
        }
    return null
}

function getKeyWord(content : string, position : positionTreeSitter)
{
    let m = tree.rootNode.descendantForPosition(position)
    while ((m = m.parent).type !== nodeTypes.storesXExpression && m.type !== nodeTypes.documentNode );
    if (m.type === nodeTypes.documentNode) return null
    let startExp = m.firstChild

    return content.substring(startExp.startIndex,startExp.endIndex).substring(0,startExp.endIndex - startExp.startIndex)
}
