import {CompletionItem} from "./types/completionTypes";

export const xoptions : CompletionItem[] = [
    {
        label: 'x-data=\"{${1:foo} : ${2:bar}}\"',
        kind: 15,
        insertTextFormat: 2,
    },
    {
        label: 'x-data',
        kind: 15,
        insertTextFormat : 2,

    },
    {
        label: 'x-init=\"${1:foo} \"',
        kind: 15,
        insertTextFormat : 2,

    },
    {
        label: 'x-bind:${1:class}=\"${2:foo} \"',
        kind: 15,
        insertTextFormat : 2,

    },
    {
        label: 'x-text=\"${1:foo} \"',
        kind: 15,
        insertTextFormat : 2,

    },
    {
        label: 'x-show=\"${1:foo} \"',
        kind: 15,
        insertTextFormat : 2,

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
    },
    {
        label: 'x-ref=\"${1:foo} \"',
        kind: 15,
        insertTextFormat : 2,
    },
    {
        label: 'x-cloak',
        kind: 15,
        insertTextFormat : 2,
    },
    {
        label: 'x-ignore',
        kind: 15,
        insertTextFormat : 2,
    },

]
