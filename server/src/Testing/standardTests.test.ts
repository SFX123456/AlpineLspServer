import {allFiles, allHtml} from "../allFiles";
import {saveCheerioFile} from "../cheerioFn";
import * as fs from "fs";
import {infos, initializeTypescriptServer} from "../typescriptLsp/typescriptServer";
import Log from "../log";
import {scanAllDocuments} from "../methods/initialize";
import exp = require("constants");
import {getJavascriptBetweenQuotationMarksPosition, getKeyWord, positionTreeSitter} from "../treeSitterHmtl";
import {isAlpineComponent} from "../analyzeFile";
/*
describe('standardTests',() => {

    test(' check if it parsed right dispatched event with number', () => {
        const uri = "file:///e%3A/fsd/index.html";
        setUpFiles();
        console.log('heyhehx')
        console.log(allHtml.get(uri)!.events.length)
        //@ts-ignore
        allHtml.get(uri).events.forEach((event) => {
            if (event.name === 'event-number')
            {
                expect(event.details).toBe(404);
                expect(JSON.stringify(event.position)).toBe('{"line":6,"character":29}');
            }
            else if (event.name === 'event-string')
            {
                expect(event.details === 'test');
                expect(JSON.stringify(event.position)).toBe('{"line":6,"character":72}');
            }
            else if (event.name === 'event-object')
            {
                //@ts-ignore
                expect(Object.keys(event.details).length).toBe(1)
                expect(JSON.stringify(event.position)).toBe('{"line":7,"character":65}');
            }
            else if (event.name === 'event-empty')
            {
                expect(event.details).toBeNull()
                expect(JSON.stringify(event.position)).toBe('{"line":7,"character":25}');
            }
            else {
                console.log('aaaaaaaaaaaaaa')
                console.log(event.name)
                fail('unrecognized event')
            }


        })
    })


})


 */
describe('standardTests',() => {

    test(' check if inside quotation marks and alpine component', () => {
        const uri = "file:///e%3A/fsd/index.html";
        setUpFiles();
        console.log(allHtml.get(uri)!.events.length)
        const position : positionTreeSitter = {
            row: 5,
            column: 22
        }
        const positionNotAlpine : positionTreeSitter = {
            row: 5,
            column: 50
        }
        const g = getKeyWord(uri,  position)
        expect(isAlpineComponent(g!)).toBeTruthy()
        const a = getKeyWord(uri,  positionNotAlpine)
        console.log(a)
        expect(isAlpineComponent(a!)).toBeFalsy()
    })


})

function setUpFiles()
{
    const uri = "file:///e%3A/fsd/index.html"
    const fileName = 'E:\\Coding\\LSP\\Final\\AlpineLsp\\server\\src\\Testing\\testFiles\\startFile.txt'
    let content = ''
    try {
        content = fs.readFileSync(fileName, {encoding: 'utf-8'})
    }catch (e)
    {
        return
    }
    const instMes = '{"processId":37856,"clientInfo":{"name":"Visual Studio Code","version":"1.86.1"},"locale":"en","rootPath":"e:\\\\fsd","rootUri":"file:///e%3A/fsd","capabilities":{"workspace":{"applyEdit":true,"workspaceEdit":{"documentChanges":true,"resourceOperations":["create","rename","delete"],"failureHandling":"textOnlyTransactional","normalizesLineEndings":true,"changeAnnotationSupport":{"groupsOnLabel":true}},"configuration":true,"didChangeWatchedFiles":{"dynamicRegistration":true,"relativePatternSupport":true},"symbol":{"dynamicRegistration":true,"symbolKind":{"valueSet":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26]},"tagSupport":{"valueSet":[1]},"resolveSupport":{"properties":["location.range"]}},"codeLens":{"refreshSupport":true},"executeCommand":{"dynamicRegistration":true},"didChangeConfiguration":{"dynamicRegistration":true},"workspaceFolders":true,"semanticTokens":{"refreshSupport":true},"fileOperations":{"dynamicRegistration":true,"didCreate":true,"didRename":true,"didDelete":true,"willCreate":true,"willRename":true,"willDelete":true},"inlineValue":{"refreshSupport":true},"inlayHint":{"refreshSupport":true},"diagnostics":{"refreshSupport":true}},"textDocument":{"publishDiagnostics":{"relatedInformation":true,"versionSupport":false,"tagSupport":{"valueSet":[1,2]},"codeDescriptionSupport":true,"dataSupport":true},"synchronization":{"dynamicRegistration":true,"willSave":true,"willSaveWaitUntil":true,"didSave":true},"completion":{"dynamicRegistration":true,"contextSupport":true,"completionItem":{"snippetSupport":true,"commitCharactersSupport":true,"documentationFormat":["markdown","plaintext"],"deprecatedSupport":true,"preselectSupport":true,"tagSupport":{"valueSet":[1]},"insertReplaceSupport":true,"resolveSupport":{"properties":["documentation","detail","additionalTextEdits"]},"insertTextModeSupport":{"valueSet":[1,2]},"labelDetailsSupport":true},"insertTextMode":2,"completionItemKind":{"valueSet":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25]},"completionList":{"itemDefaults":["commitCharacters","editRange","insertTextFormat","insertTextMode"]}},"hover":{"dynamicRegistration":true,"contentFormat":["markdown","plaintext"]},"signatureHelp":{"dynamicRegistration":true,"signatureInformation":{"documentationFormat":["markdown","plaintext"],"parameterInformation":{"labelOffsetSupport":true},"activeParameterSupport":true},"contextSupport":true},"definition":{"dynamicRegistration":true,"linkSupport":true},"references":{"dynamicRegistration":true},"documentHighlight":{"dynamicRegistration":true},"documentSymbol":{"dynamicRegistration":true,"symbolKind":{"valueSet":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26]},"hierarchicalDocumentSymbolSupport":true,"tagSupport":{"valueSet":[1]},"labelSupport":true},"codeAction":{"dynamicRegistration":true,"isPreferredSupport":true,"disabledSupport":true,"dataSupport":true,"resolveSupport":{"properties":["edit"]},"codeActionLiteralSupport":{"codeActionKind":{"valueSet":["","quickfix","refactor","refactor.extract","refactor.inline","refactor.rewrite","source","source.organizeImports"]}},"honorsChangeAnnotations":false},"codeLens":{"dynamicRegistration":true},"formatting":{"dynamicRegistration":true},"rangeFormatting":{"dynamicRegistration":true},"onTypeFormatting":{"dynamicRegistration":true},"rename":{"dynamicRegistration":true,"prepareSupport":true,"prepareSupportDefaultBehavior":1,"honorsChangeAnnotations":true},"documentLink":{"dynamicRegistration":true,"tooltipSupport":true},"typeDefinition":{"dynamicRegistration":true,"linkSupport":true},"implementation":{"dynamicRegistration":true,"linkSupport":true},"colorProvider":{"dynamicRegistration":true},"foldingRange":{"dynamicRegistration":true,"rangeLimit":5000,"lineFoldingOnly":true,"foldingRangeKind":{"valueSet":["comment","imports","region"]},"foldingRange":{"collapsedText":false}},"declaration":{"dynamicRegistration":true,"linkSupport":true},"selectionRange":{"dynamicRegistration":true},"callHierarchy":{"dynamicRegistration":true},"semanticTokens":{"dynamicRegistration":true,"tokenTypes":["namespace","type","class","enum","interface","struct","typeParameter","parameter","variable","property","enumMember","event","function","method","macro","keyword","modifier","comment","string","number","regexp","operator","decorator"],"tokenModifiers":["declaration","definition","readonly","static","deprecated","abstract","async","modification","documentation","defaultLibrary"],"formats":["relative"],"requests":{"range":true,"full":{"delta":true}},"multilineTokenSupport":false,"overlappingTokenSupport":false,"serverCancelSupport":true,"augmentsSyntaxTokens":true},"linkedEditingRange":{"dynamicRegistration":true},"typeHierarchy":{"dynamicRegistration":true},"inlineValue":{"dynamicRegistration":true},"inlayHint":{"dynamicRegistration":true,"resolveSupport":{"properties":["tooltip","textEdits","label.tooltip","label.location","label.command"]}},"diagnostic":{"dynamicRegistration":true,"relatedDocumentSupport":false}},"window":{"showMessage":{"messageActionItem":{"additionalPropertiesSupport":true}},"showDocument":{"support":true},"workDoneProgress":true},"general":{"staleRequestSupport":{"cancel":true,"retryOnContentModified":["textDocument/semanticTokens/full","textDocument/semanticTokens/range","textDocument/semanticTokens/full/delta"]},"regularExpressions":{"engine":"ECMAScript","version":"ES2020"},"markdown":{"parser":"marked","version":"1.1.0"},"positionEncodings":["utf-16"]},"notebookDocument":{"synchronization":{"dynamicRegistration":true,"executionSummarySupport":true}}},"initializationOptions":{"semanticHighlighting":true},"trace":"off","workspaceFolders":[{"uri":"file:///e%3A/fsd","name":"fsd"}]}\n'
    const parsedInitMessage = JSON.parse(instMes)
    infos.rootUri = parsedInitMessage.rootUri
    infos.rootPath = parsedInitMessage.rootPath
    //@ts-ignore
    scanAllDocuments(infos.rootPath)
    allFiles.set(uri, content)
    saveCheerioFile(content, uri)
}

