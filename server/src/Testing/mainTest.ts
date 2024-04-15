/*
import * as fs from 'fs'
import {Range} from "../types/ClientTypes";
import {saveCheerioFile} from "../cheerioFn";
import {allFiles, allHtml} from "../allFiles";
const fileName = '../../src/Testing/testFiles/counterTest.txt'
const content = fs.readFileSync(fileName, {encoding: 'utf-8'})
const range :Range = {
    start: {
        character: 1,
        line: 1
    },
    end: {
        character: 2,
        line: 4,
    }
}

allFiles.set(fileName, content)
saveCheerioFile(content, fileName)

const events = allHtml.get(fileName)!.events;
const listenedToEvents = allHtml.get(fileName)!.listenedToEventsPosition;

console.log("all dispatched events")
events.forEach(item => {
    console.log(item.name)
    if (item.details)
    {
        console.log('with details ')
        console.log(item)
    }
})

console.log('listened to events')
listenedToEvents.forEach(item => {
    console.log(item)
})
 */
export function test(){

}
