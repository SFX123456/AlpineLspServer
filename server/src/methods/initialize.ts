import {RequestMessage} from "../server";
import {initializeTypescriptServer, infos} from "../typescriptLsp/typescriptServer";
import {InitializeParams} from "../types/ClientTypes";
import Log from "../log";
import * as fs from "fs";
import {allFiles, allHtml} from "../allFiles";
import {saveCheerioFile} from "../cheerioFn";

type ServerCapabilities = Record<string, unknown>

interface InitializeResult
{
    capabilities : ServerCapabilities;
    serverInfo?: {
        name: string;
        version? : string;
    }
}

export const initialize = async (message : RequestMessage) : Promise<InitializeResult> => {
    const initializeParams = message.params as unknown as InitializeParams
    Log.writeLspServer('search here 2')
    Log.writeLspServer(initializeParams)
    infos.rootUri = initializeParams.rootUri
    infos.rootPath = initializeParams.rootPath!
    scanAllDocuments(infos.rootPath)
    await initializeTypescriptServer(message)
    return {
        capabilities : {
            completionProvider: {
                triggerCharacters: ['@', 'x', '\"', 'c', '$', '.', '\'']
            },
            resolveProvider: true,
            textDocumentSync: 1,
            hoverProvider: {

            },
            definitionProvider: true,
            semanticTokensProvider: {
                legend: {
                    tokenTypes:["class","enum","interface","namespace","typeParameter","type","parameter","variable","enumMember","property","function","member"],
                    tokenModifiers:["declaration","static","async","readonly","defaultLibrary","local"]
                },
                full: true,
                documentSelector: null
            }


        },
        serverInfo: {
            name: "alpinelspServer",
            version: "0.0.1"
        }
    }
}


function scanAllDocuments(rootPath : string)
{
    goThrewDirectorie(rootPath)
}

function goThrewDirectorie(path : string)
{
    const res = fs.opendirSync(path)
    let allDirAndFiles
    while ((allDirAndFiles = res.readSync()) != null)
    {
        if (!allDirAndFiles) return
        if (allDirAndFiles.isDirectory())
        {
            if (isOneOfTheDirectoriesToIgnore(allDirAndFiles.name )) continue
            Log.writeLspServer('is a directorie')
            goThrewDirectorie(allDirAndFiles.path)
        }
        else
        {
            const fileExtension = getFileExtension(allDirAndFiles.name)
            Log.writeLspServer('found a file with extensui ' + fileExtension)
            if (fileExtension === 'txt')
            {
                const content = fs.readFileSync(allDirAndFiles.path, {encoding: 'utf-8'})
                let encodedUri = createUri(allDirAndFiles.path)
                allFiles.set(encodedUri, content)
                saveCheerioFile(content,encodedUri)
            }
        }
    }
}

function createUri(path : string) : string
{
    let encodedUri = 'file:///' + encodeURIComponent(path.replace(/\\/g, '/'))
    return encodedUri.replace(/%2F/g, '/')
}

function isOneOfTheDirectoriesToIgnore(directorieName : string)
{
    let set = new Set<string>
    set.add("node_modules")

    return set.has(directorieName)
}

function getFileExtension(filePath : string)
{
    const arr = filePath.split('.')

    return arr[arr.length - 1]
}
