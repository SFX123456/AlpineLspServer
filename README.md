# Alpine Lsp Server

## Table of Contents
- [Disclaimer](#disclaimer)
- [Demo](#demo)
- [Currently supported features](#current-supported-features)

## Disclaimer

<h2 style="color:red;">⚠️ IMPORTANT: Not Ready for Use</h2>

<p>Please be aware that this plugin is currently under development. The build steps are not finalized, and the plugin will not perform as expected. We strongly advise against using it in production environments at this stage.</p>

### We Welcome Your Contributions!
- **Feedback**: Don't hesitate to share your thoughts on features and improvements.
- **Acknowledgments**: A heartfelt thank you to:
    - The authors of the packages we rely on.
    - especially the treesitter team.
      
## Demo

[![Demo1](https://img.youtube.com/vi/wDNe-oYaTcw/0.jpg)](https://www.youtube.com/watch?v=wDNe-oYaTcw)

[![Demo2](https://img.youtube.com/vi/Q4JhTMb-q2A/0.jpg)](https://www.youtube.com/watch?v=Q4JhTMb-q2A)

## Current supported features

### Events
* [x] goTo working with events between different files
* [x] $event object gets provided with proper context

### Directives

* [x] javascript lsp support with matching context within quotation marks

#### x-data
* [x] works with globals data
* [x] just works within context
* [x] gives javascript lsp access to the object not just keys

#### x-show
* [x] important gets suggested

#### x-bind
* [x] shortform works
* [x] works with alpine.bind

#### x-html
* [ ] html suggestions missing

#### x-on
* [x] works with custom events
* [ ] not all usual browser events added

#### x-for
* [ ] custom suggestion 
* [x] javascript Lsp gets access to value

#### x-transition
* [x] add some suggestions 
* [ ] add all possibilities to suggestions

#### x-id
* [ ] disable javascript lsp

#### $el
* [x] javascript lsp thinks its an html element with the right tag

#### $refs
* [x] javascript lsp gets an object with keys that match x-ref

#### $store 
* [x] works with globals ALpine.store. objects and single values

#### $watch
* [x] matching data objects get suggested

#### $dispatch
* [x] listened to events get suggested abroad all files

#### $root
* [x]  javascript lsp thinks its an html element with the right tag

#### $data
* [x] fully working

##### $id
* [x]  id namespaces defined with x-id get suggested


### Globals
* [x] Alpine.data
* [x] Alpine.bind
* [x] Alpine.store
* [ ] abroad files
