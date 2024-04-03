export function getJsCodeInQuotationMarksWithProperFormating(javascriptText: string, line: number, character : number) : string
{
    let output = ''
    for (let i = 0; i < line; i++)
    {
        output+= '\n'
    }
    for (let i = 0; i < character; i++) {
        output+= ' '
    }
    output += javascriptText
    for (let i = 0; i < 500; i++)
    {
        output += '\n'
    }
    return output
}

