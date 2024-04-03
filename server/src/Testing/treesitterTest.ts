const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-bash');

function testing() {
    const parser = new Parser();
    parser.setLanguage(JavaScript);

    const code = 'let idea = "123"';
    const tree = parser.parse(code);

}
//testing()

export function treesitterTest()
{

}
