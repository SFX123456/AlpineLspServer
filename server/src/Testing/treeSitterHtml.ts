
import {allFiles} from "../allFiles";
import {saveCheerioFile} from "../cheerioFn";
import * as fs from "fs";
import {initializeTypescriptServer} from "../typescriptLsp/typescriptServer";
import Log from "../log";
import {semantic} from "../methods/textDocument/semantic";
import {setUpEnvironmentForTesting} from "./codeCompletionTest";
import {
    getAllJavascriptText,
    getLastWord,
    isInsideTag,
    positionTreeSitter,
    setUpForTestingTreesitter
} from "../treeSitterHmtl";
function testing()
{
    setUpEnvironmentForTesting()
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
    const point : positionTreeSitter = {
        row : 5,
        column: 40
    }
    setUpForTestingTreesitter(content)
    Log.writeLspServer('testibng if inside tag ',1)
    const isInside = isInsideTag(point)
    Log.writeLspServer(isInside,1)
    const lastWord = getLastWord(content, point)
    if (!lastWord)
    {
        Log.writeLspServer('no lastword found',1)
    }
    else {
        Log.writeLspServer('lastword is ' + lastWord,1)
    }
}



testing()


export function treeSitterHtmlTest2()
{

}

