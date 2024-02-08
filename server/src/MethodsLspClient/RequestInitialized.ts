import Log from "../log";
import {request} from "../StartTypescriptServer";
import {InitializeParams} from "../ClientTypes";

export const initializeMethodReaction = (params: object) => {

    Log.writeLspServer("sent initialized Method")
    request(null, 'initialized', {})
}
