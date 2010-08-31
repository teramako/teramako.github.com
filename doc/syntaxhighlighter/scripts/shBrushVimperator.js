;(function(){
  // CommonJS
  typeof(require) != 'undefined' ? SyntaxHighlighter = require('shCore').SyntaxHighlighter : null;
  
  function Brush(){
    var keywords = "echo js";
    var constructor = SyntaxHighlighter.Match;
		var r = SyntaxHighlighter.regexLib;
    function process(match, regexInfo) {
			var constructor = SyntaxHighlighter.Match,
				keyword = match[1],
        args = match[2],
				result = []
				;
      result.push(new constructor(keyword, match.index+1, "keyword"));
      result.push(new constructor(args, keyword.length + match.index + 2, "color2"));
      return result;
    }
    this.regexList = [
      { regex: new RegExp(":(\\w+)\\s+(.*)$","gm"), func: process },
    ];
  
    this.forHtmlScript(r.scriptScriptTags);
  }

  Brush.prototype = new SyntaxHighlighter.Highlighter();
  Brush.aliases = ['vimp', 'vimperator'];

  SyntaxHighlighter.brushes.Vimperator = Brush;

  // CommonJS
  typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
// vim: sw=2 ts=2 et:
