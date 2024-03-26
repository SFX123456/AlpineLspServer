import {CompletionItem} from "./types/completionTypes";

export const xoptions : CompletionItem[] = [
    {
        label: 'x-data=\"{${1:foo} : ${2:bar}}\"',
        kind: 15,
        insertTextFormat: 2,
        labelDetails: {
            detail : '',
            description: 'define variables'
        }
    },
    {
        label: 'x-data',
        kind: 15,
        insertTextFormat : 2,
        labelDetails: {
            detail : '',
            description: 'define variables'
        }

    },
    {
        label: 'x-init=\"${1:foo} \"',
        kind: 15,
        insertTextFormat : 2,
        labelDetails: {
            detail : '',
            description: 'gets called after initialization'
        }
    },
    {
        label: 'x-bind',
        kind: 15,
        insertTextFormat : 2,
    },
    {
        label: 'x-text=\"${1:foo} \"',
        kind: 15,
        insertTextFormat : 2,
        labelDetails: {
            detail : '',
            description: 'renders javascript output'
        }
    },
    {
        label: 'x-show${1:.important}=\"${2:foo}\"',
        kind: 15,
        insertTextFormat : 2,
        labelDetails: {
            detail : '',
            description: 'defines visibility'
        }
    },
    {
        label: 'x-html=\"${1:foo} \"',
        kind: 15,
        insertTextFormat : 2,
    },
    {
        label: 'x-transition',
        kind: 15,
        insertTextFormat : 2,
        labelDetails: {
            detail : '',
            description: 'adds simple transition'
        }
    },
    {
        label: "x-transition:enter=\"${1:transition}\"",
        kind: 15,
        insertTextFormat : 2,
    },
    {
        label: "x-transition:enter-start=\"${1:opacity}\"",
        kind: 15,
        insertTextFormat : 2,
    },
    {
        label: "x-transition:enter-end=\"${1:opacity}\"",
        kind: 15,
        insertTextFormat : 2,
    },
    {
        label: "x-transition:leave=\"${1:transition}\"",
        kind: 15,
        insertTextFormat : 2,
    },
    {
        label: "x-transition:leave-start=\"${1:transition}\"",
        kind: 15,
        insertTextFormat : 2,
    },
    {
        label: "x-transition:leave-end=\"${1:transition}\"",
        kind: 15,
        insertTextFormat : 2,
    },
    {
        label: 'x-for=\"${1:foo} \"',
        kind: 15,
        insertTextFormat : 2,
        labelDetails: {
            detail : '',
            description: 'iterate over array or object keys'
        }
    },
    {
        label: `x-for=" $\{1:foo} in \${2:bar} "`,
        kind: 15,
        insertTextFormat : 2,
        labelDetails: {
            detail : '',
            description: 'iterate over array'
        }
    },
    {
        label: `x-for=" ($\{1:value}, \${2:index}) in \${3:object} "`,
        kind: 15,
        insertTextFormat : 2,
        labelDetails: {
            detail : '',
            description: 'iterate over array'
        }
    },
    {
        label: 'x-if=\"${1:foo} \"',
        kind: 15,
        insertTextFormat : 2,
    },
    {
        label: 'x-effect=\"${1:foo} \"',
        kind: 15,
        insertTextFormat : 2,
        labelDetails: {
            detail : '',
            description: 'called when a variable changes'
        }
    },
    {
        label: 'x-ref=\"${1:foo} \"',
        kind: 15,
        insertTextFormat : 2,
        labelDetails: {
            detail : '',
            description: 'element gets added to $refs'
        }
    },
    {
        label: 'x-cloak',
        kind: 15,
        insertTextFormat : 2,
        labelDetails: {
            detail : '',
            description: 'element gets loaded once alpine is ready'
        }
    },
    {
        label: 'x-ignore',
        kind: 15,
        insertTextFormat : 2,
        labelDetails: {
            detail : '',
            description: 'alpine ignores element'
        }
    },
    {
        label: 'x-on',
        kind: 15,
        insertTextFormat : 2,
        labelDetails: {
            detail : '',
            description: 'longhand for @{eventName}'
        }
    },

]





export const chainableOnXShow :string[] = ['important']
