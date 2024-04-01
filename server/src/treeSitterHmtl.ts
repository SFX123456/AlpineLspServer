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

export type rangeIndexTreesitter = {
    positionStart : positionTreeSitter
    startIndex : number,
    endIndex : number
}


export function loadParser()
{

}
function getTree(uri : string)
{
    const parser = new Parser();
    Log.writeLspServer('worked ', 1)
    parser.setLanguage(Html);
    return parser.parse(allFiles.get(uri))
}

export function getAllJavascriptText(uri : string)
{
    const content = allFiles.get(uri)!
    const tree = getTree(uri)
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
    if (!tree)
    {
        Log.writeLspServer('tree is undefined',1)
    }
    Log.writeLspServer(tree, 1)
    Log.writeLspServer('content : ' + content,1)

    // Start traversing from the root node
    traverse(uri, tree.rootNode, allJSArray);
    return allJSArray.join('')
}
export function setUpForTestingTreesitter(content : string)
{

}
export function getLastWord(uri : string, point : positionTreeSitter)
{
    const tree = getTree(uri)
    const node = tree.rootNode.descendantForPosition(point)
    Log.writeLspServer(node,1)
    if (node.type !== nodeTypes.storesxname)
    {
        return null
    }
    return allFiles.get(uri)!.substring(node.startIndex,node.endIndex)
}
function traverse(uri : string, node: any, allJSArray : string[]) {
    const content = allFiles.get(uri)!
    if (node.type === nodeTypes.storesJavaScriptText)
    {
        const keyWord = getKeyWord(uri, node.startPosition)
        const regex = /(?:x-([a-z:\.]+)|@([a-z-]+)[\.a-z-]*|\:[a-z]+)/g
        const match = regex.exec(keyWord!)
        Log.writeLspServer(match,1)
        if (match)
        {
            Log.writeLspServer('keyword : ' + keyWord,1)

            const javascriptPos = getJavascriptBetweenQuotationMarksPosition(uri,node.startPosition)
            if (!javascriptPos) return
            //+1 and -1 because of quotation marks
            for (let i = javascriptPos.startIndex ; i < javascriptPos.endIndex; i++) {
                allJSArray[i] = content[i]
            }
        }
    }
    // Traverse the child nodes
    node.children.forEach((child : any) => traverse(uri,child, allJSArray));
}
export function isInsideTag(pos : positionTreeSitter,uri : string)
{
    const tree = getTree(uri)
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



export function getJavascriptBetweenQuotationMarksPosition(uri : string, pos : positionTreeSitter) : null | rangeIndexTreesitter
{
   const tree = getTree(uri)
    let m = tree.rootNode.descendantForPosition(pos)
    while (m.type != 'quoted_attribute_value' && m.type !== nodeTypes.documentNode )
    {
        Log.writeLspServer(m.type,1)
        m = m.parent
    }
    Log.writeLspServer('javaq',1)
    Log.writeLspServer(m.type,1)
    Log.writeLspServer(m.startPosition,1)
    Log.writeLspServer(m.endPosition,1)
    if (m.type === nodeTypes.documentNode) return null
    const mStartPos = m.startPosition
    const mEndpos = m.endPosition
    const indexQuotStart = m.startIndex
    const indexQuotEnd = m.endIndex
    while (m.type !== nodeTypes.storesXExpression && m.type !== nodeTypes.documentNode )
    {
        m = m.parent
    }
    Log.writeLspServer(m.startPosition,1)
    Log.writeLspServer('go fuither ', 1)
    if (m.type === nodeTypes.documentNode) return null
    const posStrStart = m.startIndex
    const posStrEnd = m.endIndex
    Log.writeLspServer('dihfg',1)
    while ((m = m.parent).type !== nodeTypes.element && m.type !== nodeTypes.documentNode );
    Log.writeLspServer(m, 1)
    if (m.type === nodeTypes.documentNode) return null
    if (m.startIndex <= posStrStart && m.endIndex >= posStrEnd)
        Log.writeLspServer('returning ',1)
    Log.writeLspServer(mEndpos,1)
        return {
            positionStart : {
                column : mStartPos.column + 1,
                row: mStartPos.row
            },
            startIndex : indexQuotStart + 1,
            endIndex : indexQuotEnd - 1
        }
    return null
}

export function getKeyWord(uri : string, position : positionTreeSitter)
{
    const tree = getTree(uri)
    let m = tree.rootNode.descendantForPosition(position)
    while ((m = m.parent).type !== nodeTypes.storesXExpression && m.type !== nodeTypes.documentNode );
    if (m.type === nodeTypes.documentNode) return null
    let startExp = m.firstChild

    return allFiles.get(uri)!.substring(startExp.startIndex,startExp.endIndex).substring(0,startExp.endIndex - startExp.startIndex)
}
