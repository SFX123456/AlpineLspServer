import { Range, textDocumentType} from "./types/ClientTypes";
import Log from "./log";
import {allFiles} from "./allFiles";
import {magicObjects} from "./magicobjects";

export class CodeBlock
{
    public htmlTagRange : Range
    public parenthesisRange : Range | null
    public line : number
    public character : number
    public textDocument : textDocumentType
    public constructor(htmlTagRange : Range, textDocument : textDocumentType)
    {
        this.htmlTagRange = htmlTagRange
        this.line = textDocument.position.line
        this.character = textDocument.position.character
        this.textDocument = textDocument
        this.parenthesisRange = this.getPosParenthesis(textDocument)
    }

    private getPosParenthesis(textDocument : textDocumentType): null | Range {
        const uri = textDocument.textDocument.uri
        let line = textDocument.position.line
        let character = textDocument.position.character
        const startPattern =  /="/g
        const endPattern = /(?<![\\=])"/g
        const arr = allFiles.get(uri)!.split('\n')
        let goUp = 0;
        let startTag : any
        let lastMatchIndex = 0
        let foundAMatch = false
        let characterTemp = character
        while (!foundAMatch && goUp < 200 && line - goUp >= 0 && line - goUp >= this.htmlTagRange.start.line)
        {
            while ((startTag = startPattern.exec(arr[line - goUp])) !== null) {
                if (startTag.index < characterTemp)
                {
                    foundAMatch = true
                    lastMatchIndex = startTag.index;
                }
            }
            characterTemp = 500
            goUp++;
        }
        goUp--
        if (!foundAMatch) return null

        let endTag : any

        foundAMatch = false
        let lastMatchEndingIndex = 0
        let i = 0;
        const endPatternHtml = />[\r\n\s]*$/;
        characterTemp = character
        while (!foundAMatch && i < 200 && line - goUp + i < arr.length - 1 && line - goUp + i <= this.htmlTagRange.end.line)
        {

            while ((endTag = endPattern.exec(arr[line - goUp + i])) !== null) {
                if (endTag.index > characterTemp || goUp - i != 0)
                {
                    foundAMatch = true
                    lastMatchEndingIndex = endTag.index;
                }
            }
            if (!foundAMatch)
            {
                if (arr[line - goUp + i].match(endPatternHtml))
                {
                    Log.writeLspServer('apparently found enta tag befoer')
                    Log.writeLspServer(goUp.toString())
                    Log.writeLspServer(arr[line -goUp + i])

                    return null
                }
            }

            i++
        }
        i--;
        if (!foundAMatch) return null
        Log.writeLspServer('here to search')
        Log.writeLspServer(this.htmlTagRange)
        Log.writeLspServer(lastMatchIndex.toString())
        Log.writeLspServer(lastMatchEndingIndex.toString())
        Log.writeLspServer(goUp.toString())
        Log.writeLspServer((goUp - i).toString())
        if ( line - goUp + i >= line
            && (lastMatchIndex + 2 < character || goUp != 0 )
            && ( lastMatchEndingIndex  > character || goUp - i != 0 )
        )
        {
            return {
                start : {
                    line : line - goUp ,
                    character : lastMatchIndex + 2
                },
                end: {
                    line : line - goUp + i,
                    character: lastMatchEndingIndex
                }
            }
        }
        return null
    }

    public generateFullTextJavascriptLsp(variables : string[]) : string
    {
        const openingParenthesisPosition = this.parenthesisRange?.start!
        const endingParenthesisPosition = this.parenthesisRange?.end!

        let output = ''
        const content = allFiles.get(this.textDocument.textDocument.uri)!.split('\n')
        for (let i = openingParenthesisPosition.line; i <= endingParenthesisPosition.line; i++)
        {
            //  console.log(allFiles.get(uri)!.split('\n')[i])
            let c = openingParenthesisPosition.line == i ? openingParenthesisPosition.character : 0
            let cEnd = endingParenthesisPosition.line == i ? endingParenthesisPosition.character : content[i].length
            for (let column = 0; column < cEnd; column++)
            {
                if (openingParenthesisPosition.line == i && column < openingParenthesisPosition.character)
                {
                    output += ' '
                }
                else
                {
                    output += content[i][column]
                }
            }
            if (i != endingParenthesisPosition.line)
                output += '\n'
        }

        const fullText = output
        let fullTextWithVariables = fullText
        for (let i = 0; i < 500; i++)
        {
            fullTextWithVariables+= '\n'
        }
        let varAsTextStr = variables.map(x => 'var ' + x + ';' ).join('')
        varAsTextStr += (magicObjects.map(x => ' var ' + x +'; ').join(''))
        const openingTagIndex = this.htmlTagRange.start
        if (!openingTagIndex || fullText == '') return ''
        let beforeText = ''
        for (let i = 0; i < openingTagIndex.line; i++)
        {
            beforeText += '\n'
        }
        return beforeText + fullTextWithVariables + varAsTextStr
    }

    public isInsideParenthesis(): Boolean
    {
        return this.parenthesisRange != null
    }

    public getKeyWord(): string
    {
        const wholeLine = allFiles.get(this.textDocument.textDocument.uri)!.split('\n')[this.parenthesisRange!.start.line]
        const subStr = wholeLine.substring(0, this.parenthesisRange!.start.character)
        const beginningIndex = subStr.indexOf(' ')

        return subStr.substring(beginningIndex + 1, this.parenthesisRange!.start.character - 2)
    }

}
