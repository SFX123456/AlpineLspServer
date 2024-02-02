import * as fs from 'fs';

const log = fs.createWriteStream("E:\\Coding\\LSP\\Final\\AlpineLsp\\server\\out\\temp\\lsp.log")

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
    }
}
