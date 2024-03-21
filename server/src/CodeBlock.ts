import { Range, textDocumentType} from "./types/ClientTypes";
import Log from "./log";
import {allFiles, allHtml} from "./allFiles";
import {magicObjects} from "./magicobjects";
import {end} from "cheerio/lib/api/traversing";
import {regexEndingOpeningTag} from "./allRegex";

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
        let goUp = 0;
        let startTag : any
        let lastMatchIndex = 0
        let foundAMatch = false
        let characterTemp = character
        Log.writeLspServer('checking if inside quotation marks',1)
        while (!foundAMatch && goUp < 200 && line - goUp >= 0 && line - goUp >= this.htmlTagRange.start.line)
        {
            while ((startTag = startPattern.exec(allHtml.get(uri)!.linesArr[line - goUp])) !== null) {
                if (startTag.index < characterTemp)
                {
                    foundAMatch = true
                    lastMatchIndex = startTag.index;
                }
            }
            characterTemp = 1000
            goUp++;
        }
        goUp--
        if (!foundAMatch) return null
        Log.writeLspServer('step 2',1)
        let endTag : any

        foundAMatch = false
        let lastMatchEndingIndex = 0
        let i = 0;
        const endPatternHtml = regexEndingOpeningTag
        while (!foundAMatch && i < 200 && line - goUp + i < allHtml.get(uri)!.linesArr.length - 1 && line - goUp + i <= this.htmlTagRange.end.line)
        {

            while ((endTag = endPattern.exec(allHtml.get(uri)!.linesArr[line - goUp + i])) !== null) {
                Log.writeLspServer(endTag)
                Log.writeLspServer(allHtml.get(uri!)!.linesArr[line - goUp + i])
                Log.writeLspServer(endTag.index.toString())
                Log.writeLspServer(character.toString())
                if (endTag.index > lastMatchIndex && endTag.index < character ) return null
                if (endTag.index + 1 >= character || goUp - i != 0)
                {

                    foundAMatch = true
                    lastMatchEndingIndex = endTag.index + 1;
                }
            }
            if (!foundAMatch)
            {
                if (allHtml.get(uri)!.linesArr[line - goUp + i].match(endPatternHtml))
                {
                    Log.writeLspServer('not found a match but found end tag')
                    return null
                }
            }
            i++
        }
        i--;
        if (!foundAMatch) return null
        Log.writeLspServer('step 3',1)
        if ( line - goUp + i >= line
            && (lastMatchIndex + 2 < character || goUp != 0 )
            && ( lastMatchEndingIndex  >= character || goUp - i != 0 )
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
    public generateTextJavascript()
    {
        const openingParenthesisPosition = this.parenthesisRange?.start!
        const endingParenthesisPosition = this.parenthesisRange?.end!

        let output = ''
        for (let i = openingParenthesisPosition.line; i <= endingParenthesisPosition.line; i++)
        {
            let c = openingParenthesisPosition.line == i ? openingParenthesisPosition.character : 0
            let cEnd = endingParenthesisPosition.line == i ? endingParenthesisPosition.character : allHtml.get(this.textDocument.textDocument.uri)!.linesArr[i].length
            for (let column = 0; column < cEnd; column++)
            {
                if (openingParenthesisPosition.line == i && column < openingParenthesisPosition.character)
                {
                    output += ' '
                }
                else
                {
                    output +=  allHtml.get(this.textDocument.textDocument.uri)!.linesArr[i][column]
                }
            }
            if (i != endingParenthesisPosition.line)
                output += '\n'
        }
        return output
    }

    public isInsideParenthesis(): Boolean
    {
        return this.parenthesisRange != null
    }

    public getKeyWord(): string
    {
        const wholeLine = allHtml.get(this.textDocument.textDocument.uri)!.linesArr[this.parenthesisRange!.start.line]
        const subStr = wholeLine.substring(0, this.parenthesisRange!.start.character)
        const beginningIndex = subStr.lastIndexOf(' ')

        return subStr.substring(beginningIndex + 1, this.parenthesisRange!.start.character - 2)
    }

}
