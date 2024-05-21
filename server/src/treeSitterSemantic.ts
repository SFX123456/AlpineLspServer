import log from "./log";
import {semanticToken} from "./methods/textDocument/semantic";

const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');

enum validTypesEnum {
    class,
    enum,
    interface,
    namespace,
    typeParameter,
    type,
    parameter,
    variable,
    enumMember,
    property,
    function,
    member,
    struct,
    event,
    method,
    macro,
    keyword,
    modifier,
    comment,
    string,
    number,
    regexp,
    operator,
    decorator
}
const validTypes : Record<string, number> = {
    'property_identifier' : validTypesEnum.property,
    'identifier' : validTypesEnum.keyword,
    '=>' : validTypesEnum.keyword,
    '{' : validTypesEnum.operator,
    '}' : validTypesEnum.operator,
    '(' : validTypesEnum.operator,
    ')' : validTypesEnum.operator,
    '[' : validTypesEnum.operator,
    ']' : validTypesEnum.operator,
    ':' : validTypesEnum.operator,
    'false' : validTypesEnum.keyword,
    'true' : validTypesEnum.keyword,
    '\'' : validTypesEnum.type,
    'this' : validTypesEnum.keyword,
    '.' : validTypesEnum.keyword,
    '=' : validTypesEnum.operator,
    '!' : validTypesEnum.operator,
    'let' : validTypesEnum.enum,
    'var' : validTypesEnum.enum,
    'const' : validTypesEnum.enum,
    'get' : validTypesEnum.function,
    'return' : validTypesEnum.keyword,
    'while' : validTypesEnum.keyword,
    'for' : validTypesEnum.keyword,
    'break' : validTypesEnum.keyword,
    'string_fragment' : validTypesEnum.string,
    ';' : validTypesEnum.operator,
    'word' : validTypesEnum.parameter
}


let parser : any
try
{
    parser = new Parser();
    parser.setLanguage(JavaScript);
    log.writeLspServer('able to')
}
catch(e)
{
    log.writeLspServer('unable to parse')
}



export function getSemanticTokens(javascriptCode : string) : semanticToken[] {
    const tree = parser.parse(javascriptCode);
    const semanticTokens: semanticToken[] = []
    function traverse(node : any) {
        // Print information about the current node
        log.writeLspServer(node.type)
            log.writeLspServer(node.startPosition)
        //@ts-ignore
        if (validTypes[node.type]) {
            const pos = {
                line: node.startPosition.row,
                character: node.startPosition.column
            }

            const semanticObj = getAllInfosForSemantic(pos, node.type, node.endPosition.column - node.startPosition.column)
            semanticTokens.push(semanticObj)
        }

        // Traverse the child nodes
        node.children.forEach((child : any)  => traverse(child));
    }

    // Start traversing from the root node
    traverse(tree.rootNode);
    return semanticTokens

}


function getAllInfosForSemantic(position : any , name : string, length : number) :semanticToken
{

   const tokenType = validTypes[name]

    return {
       line: position.line,
        startChar: position.character,
        length : length,
       tokenType,
       tokenModifier: 5
    }

}
