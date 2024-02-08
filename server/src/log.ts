import * as fs from 'fs';

const log = fs.createWriteStream("E:\\Coding\\LSP\\Final\\AlpineLsp\\server\\out\\temp\\lsp.log")
const logLspClient = fs.createWriteStream("E:\\Coding\\LSP\\Final\\AlpineLsp\\server\\out\\temp\\lspClient.log")

export default {
    write: (message : object | unknown) => {
        if (typeof message === 'object')
        {
            log.write(JSON.stringify(message))
        }
        else
        {
            log.write(message);
        }
        log.write('\n')
    },
    writeLspServer: (message : object | unknown) => {
        if (typeof message === 'object')
        {
            logLspClient.write(JSON.stringify(message))
        }
        else
        {
            logLspClient.write(message);
        }
        logLspClient.write('\n')
    },
}
