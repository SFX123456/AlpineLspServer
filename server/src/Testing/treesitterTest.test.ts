import {setUpFiles} from "./standardTests.test";
import {getAllJavascriptText} from "../treeSitterHmtl";
import {getDispatchKeywords} from "../treeSitterJavascript";

const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');

describe('treesittertest',() => {
    test('dispatchFetcher', () => {
        const uri = "file:///e%3A/fsd/index.html";
        setUpFiles();
        const text = getAllJavascriptText(uri)

        const res = getDispatchKeywords(uri, text)

        expect(res.length).toBeGreaterThan(0)
    })
})

