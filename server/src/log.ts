import * as fs from 'fs';

const log = fs.createWriteStream("E:\\fsd\\lsp.log")
const logLspClient = fs.createWriteStream("E:\\fsd\\lspClient.log")

export default {
    write: (message : object | unknown) => {
        if (message == undefined)
        {

            return
        }
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
        if (message == undefined)
        {

            return
        }
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
