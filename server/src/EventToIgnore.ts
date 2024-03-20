const eventsToIgnore = new Set();
eventsToIgnore.add('click')
eventsToIgnore.add('submit')
export function IsEventToIgnore(eventName : string) : boolean
{
    for (let z of eventsToIgnore)
    {
        if (z === eventName) return true;
    }
    return false;
}
