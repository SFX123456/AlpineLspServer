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
    Log.writeLspServer('search here 2')
    Log.writeLspServer(message)
    Log.writeLspServer('end of search')
    const initializeParams = message.params as unknown as InitializeParams
    Log.writeLspServer('uuuuuuuuuuuuuuu')
    Log.writeLspServer(initializeParams)
    Log.writeLspServer('uuuuuuuuuuuuuuuuuuuu')
    infos.rootUri = initializeParams.rootUri
    infos.rootPath = initializeParams.rootPath!
    scanAllDocuments(infos.rootPath)
    await initializeTypescriptServer(message)
    return {
        capabilities : {
            completionProvider: {
                triggerCharacters: ['@', 'x', '\"', 'c', '$', '.', '\'', ':']
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


export function scanAllDocuments(rootPath : string)
{
    goThrewDirectorie(rootPath)
}

function goThrewDirectorie(path : string)
{
    const res = fs.opendirSync(path)
    let allDirAndFiles
    Log.writeLspServer(process.version.toString(),1)
    while ((allDirAndFiles = res.readSync()) != null)
    {
        Log.writeLspServer(allDirAndFiles,1)
        if (!allDirAndFiles) return
            if (allDirAndFiles.isDirectory())
            {
                if (!isDirectorieToScan(allDirAndFiles.name)) continue
                Log.writeLspServer('is a directorie',1)
                goThrewDirectorie(allDirAndFiles.path)
            }
            else
            {
                const fileExtension = getFileExtension(allDirAndFiles.name)
                Log.writeLspServer('found a file with extensui ' + fileExtension)
                if (isFileSomeThingToScan(fileExtension))
                {
                   const content = fs.readFileSync(allDirAndFiles.path, {encoding: 'utf-8'})
                    let encodedUri = 'file:///' + encodeURIComponent(allDirAndFiles.path.replace(/\\/g, '/'))
                    encodedUri = encodedUri.replace(/%2F/g, '/')
                    allFiles.set(encodedUri, content)
                    saveCheerioFile(content,encodedUri)
                    let includedFiles = ''
                    for (let key of allFiles.keys()) {
                        includedFiles += key
                    }
                }
            }
    }
}

function getFileExtension(filePath : string)
{
    const arr = filePath.split('.')
    return arr[arr.length - 1]
}


function isFileSomeThingToScan(fileEnding : string) : boolean
{
    if (fileEnding === 'blade' || fileEnding === 'html') return true
    return false
}

function isDirectorieToScan(directorieName : string) : boolean
{
    if (directorieName === 'node_modules') return false
    return true
}
