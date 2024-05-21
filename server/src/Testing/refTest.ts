
import {allFiles, allHtml} from "../allFiles";
import {createRefsStr, getAccordingRow, getAccordingRefs, saveCheerioFile} from "../cheerioFn";
import {completion} from "../methods/textDocument/completion";
import {RequestMessage} from "../server";
import {Range} from "../types/ClientTypes";
import * as fs from "fs";
import {initializeTypescriptServer} from "../typescriptLsp/typescriptServer";
import Log from "../log";
import {Element} from "cheerio";
import {semantic} from "../methods/textDocument/semantic";
function testing()
{
    const uri = "file:///e%3A/fsd/index2.html"

    const fileName = '../../src/Testing/testFiles/counterTest.txt'
    let content = ''
    try {

        content = fs.readFileSync(fileName, {encoding: 'utf-8'})
    }catch (e)
    {
        return
    }

    Log.writeLspServer(content,1)
    allFiles.set(uri, content)
    saveCheerioFile(content, uri)
    const node = getAccordingRow(0,allHtml.get(uri)!)
    const res = getAccordingRefs(node!)
    Log.writeLspServer(res,1)
    const str = createRefsStr(res)
    Log.writeLspServer(str,1)
}


//testing()


export function testRef()
{

}

