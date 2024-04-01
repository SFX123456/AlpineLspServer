import {allFiles} from "../allFiles";
import * as fs from "fs";
import Log from "../log";
import {setUpEnvironmentForTesting} from "./codeCompletionTest";
import {
    getJavascriptBetweenQuotationMarksPosition,
    getLastWord,
    isInsideTag, loadParser,
    positionTreeSitter,
    setUpForTestingTreesitter
} from "../treeSitterHmtl";
function testing()
{

    loadParser()
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
        row : 0,
        column: 15
    }

    const pos = getJavascriptBetweenQuotationMarksPosition(uri,point)
    Log.writeLspServer(pos,1)
    Log.writeLspServer('testibng if inside tag ',1)
    /*
    const isInside = isInsideTag( point, uri)
    Log.writeLspServer(isInside,1)
    const lastWord = getLastWord(content, point)
    if (!lastWord)
    {
        Log.writeLspServer('no lastword found',1)
    }
    else {
        Log.writeLspServer('lastword is ' + lastWord,1)
    }

     */
}



//testing()


export function treeSitterHtmlTest2()
{

}

