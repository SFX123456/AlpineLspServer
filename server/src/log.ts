import * as fs from 'fs';
let shouldConsoleLog = false
const log = fs.createWriteStream("E:\\fsd\\lsp.log")
const logLspClient = fs.createWriteStream("E:\\fsd\\lspClient.log")

export default {
    write: (message : object | unknown, logLev : number = 0) => {
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
    writeLspServer: (message : object | unknown, logLev : number = 0) => {
        if (typeof message == typeof 1) return;
        if (logLev === 1 && shouldConsoleLog)
        {
        console.log(message)
            return;
        }

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
    activateConsoleLog : () => {
        shouldConsoleLog = true
    }
}
