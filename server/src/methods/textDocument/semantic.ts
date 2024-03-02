import {RequestMessage} from "../../server";
import {allFiles} from "../../allFiles";
import log from "../../log";
import Log from "../../log";

import {requestingMethods} from "../../typescriptLsp/typescriptServer";
import {textDocumentType} from "../../types/ClientTypes";
import {getAllJavaScriptText} from "./javascriptText";
import {regexAlpineCharactersSemantic} from "../../allRegex.js";

interface semanticResponse  {
    data: number[]
}
export const semantic = async (message : RequestMessage ) : Promise<semanticResponse> => {
    log.writeLspServer('should give semantic', 3)
    const textDocument = message.params as textDocumentType
    const javaScrText = getAllJavaScriptText(textDocument.textDocument.uri)
    const resJavaScr = await requestingMethods('semantic', javaScrText, 0, 0)
    let javascSem : semanticToken[] = []
    if (resJavaScr)
    {
        try {
            //@ts-ignore
            const temp = resJavaScr.result.data
            const z = decryptSemanticsFromJavascriptServer(temp)
            javascSem = z
        }
        catch (e)
        {
            Log.writeLspServer('erroo in smeantic')
        }

    }
    const res = detectAlpineCharacters(textDocument.textDocument.uri)
    const allTokens = [...res]
    allTokens.push(...javascSem)
    const sortedSemTokens = sortSemanticTokens(allTokens)
    const decrpytedTokens = decryptSemanticTokens(sortedSemTokens)

    return {
        data:
        decrpytedTokens
    }
}

interface semanticToken {
    line: number,
    startChar: number,
    length : number,
    tokenType : number,
    tokenModifier: number
}

function decryptSemanticTokens(tokens : semanticToken[]): number[]
{
    const output : number[] = []
    let lastHitChar = 0
    let lastHitLine = 0
    tokens.forEach((token) => {
        if (token.line != lastHitLine){
            lastHitChar = 0
        }
        output.push(token.line - lastHitLine)
        lastHitLine = token.line
        output.push(token.startChar - lastHitChar)
        lastHitChar = token.startChar
        output.push(token.length)
        output.push(token.tokenType)
        output.push(token.tokenModifier)
    })
    return output
}

function sortSemanticTokens(tokens: semanticToken[])
{
    const sortedTokens = tokens.sort((a,b)=> a.line - b.line)
    let patchTokens : semanticToken[] = []
    let curLine = -1
    let allSortedTokens : semanticToken[] = []
    sortedTokens.forEach(x => {
        if (curLine == -1)
        {
            curLine = x.line
        }
        if (curLine == x.line)
        {
            patchTokens.push(x)
        }
        else
        {
            curLine = x.line
            patchTokens = patchTokens.sort((a,b) => a.startChar - b.startChar)
            patchTokens.forEach(y => {
                allSortedTokens.push(y)
            })
            patchTokens = []
            patchTokens.push(x)
        }
    })
    patchTokens = patchTokens.sort((a,b) => a.startChar - b.startChar)
    patchTokens.forEach(y => {
        allSortedTokens.push(y)
    })
    return allSortedTokens

}

function decryptSemanticsFromJavascriptServer(numbers : number[]): semanticToken[]
{
    const output : semanticToken[] = []
    let lastLine = 0
    let lastX = 0
    if (!numbers){
        Log.writeLspServer('numbers was undefined')
        return output
    }
    for (let i = 0; i < numbers.length; i+= 5)
    {
        if (numbers[i] > 500)
        {
            i = numbers.length
            continue
        }
        let row = numbers[i] + lastLine
        lastLine = row
        if (numbers[i] != 0) lastX = 0
        let column = numbers[i + 1] + lastX
        lastX = column
        output.push({
            line : row,
            startChar: column,
            length: numbers[i + 2],
            tokenType: numbers[i + 3],
            tokenModifier: numbers[i + 4]
        })
    }
    return output
}

function detectAlpineCharacters(uri: string) : semanticToken[]
{
    const lines = allFiles.get(uri)!.split('\n')
    const regExpx = regexAlpineCharactersSemantic
    let match : any;
    const output : semanticToken[] = []
    lines.forEach((line, currentLine) => {
        while ((match = regExpx.exec(line)) !== null) {
            let tokenType = 0
            if (match[0] === 'let' || match[0] === 'var'|| match[0] === 'const')
                tokenType = 10
            output.push({
                line: currentLine,
                startChar: match.index,
                length: match[0].length,
                tokenType,
                tokenModifier: 3
            })
        }
    })
    return output
}



