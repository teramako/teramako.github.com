
(function(win){
  "use strict";
  var evalCode = eval;
  var config = Object.preventExtensions({
    /** console.log 系の制御 */
    debug: true,
    timer: false,
  });

  // ====================================================
  // Utilities
  // ================================================{{{1
  function $id (id) {
    return document.getElementById(id);
  }

  function mixin (aTarget, aSource) {
    var keys = Object.getOwnPropertyNames(aSource),
        i = 0,
        len = keys.length,
        key, desc;
    for (; i < len; ++i) {
      key = keys[i];
      desc = Object.getOwnPropertyDescriptor(aSource, key);
      desc.enumerable = false;
      Object.defineProperty(aTarget, key, desc);
    }
    return aTarget;
  }

  function execJS (code) {
    try {
      return evalCode(code);
    } catch (e) {
      return e;
    }
  }

  function escapeHTML (html) {
    return html.replace(/[<>"&]/g, function(char) {
      switch (char) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "\"": return "&quot;";
        case "&": return "&amp;";
      }
    });
  }

  function log (msg) {
    if (msg instanceof Error)
      console.error(msg.toString());
    else if (config.debug)
      console.log.apply(console, arguments);
  }
  mixin(log, {
    error: function () {
      console.error.apply(console, arguments);
    },
    group: function (groupName) {
      if (!config.debug) return;
      if (groupName)
        console.group(groupName);
      else
        console.groupEnd();
    },
  });

  var now = (function() {
    if (win.performance && typeof win.performance.now === "function") {
      return function(){ return performance.now(); };
    } else {
      return function(){ return Date.now(); };
    }
  }());
  // 1}}}

  // ====================================================
  // History
  // ================================================{{{1
  function History (aMaxSize) {
    this.max = aMaxSize;
    this.currentIndex = 0;
    this.list = [];
  }
  mixin(History.prototype, {
    add: function History_add (item) {
      this.list.push(item);
      if (this.list.length > this.max)
        this.list.shift();

      this.currentIndex = this.list.length;
    },
    getPrev: function History_getPrev () {
      if (this.currentIndex < 0)
        return "";

      return this.list[--this.currentIndex];
    },
    getNext: function History_getNext () {
      if (this.currentIndex >= this.list.length)
        return "";

      return this.list[++this.currentIndex];
    },
    clear: function History_clear () {
      this.list = [];
      this.currentIndex = 0;
    },
  });
  // 1}}}

  var input = $id("input"),
      output = $id("output"),
      gEditor;

  //input.addEventListener("keydown", onKeyDown, false);
  //input.focus();
  //window.addEventListener("click", function(){ input.focus(); }, false);

  // ====================================================
  // Global Utiilities
  // ================================================{{{1
  Object.defineProperties(win, {
    config: {
      value: config,
    },
    clear: {
      value: function() {
        output.innerHTML = "";
      }
    },
    props: {
      value: function (obj) {
        return Object.keys(obj);
      }
    },
    propsAll: {
      value: function (obj) {
        return Object.getOwnPropertyNames(obj);
      }
    },
    inspect: {
      value: function (obj, onlyEnumerable) {
        output.insertAdjacentHTML("BeforeEnd", toStringResult.getKeyValueTable(obj, onlyEnumerable));
      }
    }
  });
  // 1}}}


  // ====================================================
  // Editor class
  // ================================================{{{1
  function Editor (editor) {
    this.editor = editor;
    this.view = editor.getTextView();
    this.model = editor.getModel();
    this.history = new History();
    this.init();
  }
  Editor.prototype = {
    init: function () {

      // エディタの高さ調整
      this.view.addEventListener("ModelChanged", this.onModelChanged.bind(this));

      // キーバインド設定
      var KeyBinding = require("orion/editor/keyBinding").KeyBinding;
      this.keyBindings.forEach(function (kb) {
        var keyBind = new KeyBinding(kb.key, kb.accel, kb.shift, kb.meta);
        if (kb.override) {
          this.view.setKeyBinding(keyBind, kb.id);
        } else {
          this.view._keyBindings.push({ actionId: kb.id, keyBinding: keyBind });
        }
      }, this);

      // アクション設定
      this.actions.forEach(function (act) {
        this.view.setAction(act.id, act.handler.bind(this), act.description);
      }, this);
    },
    /**
     * actions::[]  {{{2
     * エディタ上でのカスタム・アクション
     * @type {Object[]}
     * {
     *   id:          {String} keyBinding.id と対応
     *   description: {String} 概要
     *   handler:     {Function} アクション内容
     * }
     */
    actions: [
      {
        id: "execOrFeed", // Return
        description: "eval the code or line feed",
        handler: function execOrFeedCmd () {
          log.group("execOfFeed");
          var code = this.model.getText();
          if (this.validateCode(code)) {
            this.exec(code);
          } else {
            this.view._doEnter();
          }
          log.group();
          return true;
        },
      }, {
        id: "exec", // Ctrl + r
        description: "eval the code",
        handler: function execCmd () {
          log.group("exec code");
          this.exec();
          log.group();
          return true;
        },
      }, {
        id: "clear", // Ctrl + l
        description: "clear output",
        handler: function clearCmd () {
          output.innerHTML = "";
          return true;
        },
      }, {
        id: "historyPrevious", // Ctrl + p
        description: "Show previous history",
        handler: function historyPrevCmd () {
          log.group("historyPrevious");
          var code = this.history.getPrev();
          log("code:", code);
          this.clear();
          if (code) {
            this.view.setText(code);
            this.view.setCaretOffset(code.length);
          } else {
            this.view.setText("");
          }
          log.group();
          return true;
        },
      }, {
        id: "historyNext", // Ctrl + n
        description: "Show next history",
        handler: function historyNextCmd () {
          log.group("historyNext");
          var code = this.history.getNext();
          log("code:", code);
          this.clear();
          if (code) {
            this.view.setText(code);
            this.view.setCaretOffset(code.length);
          } else {
            this.view.setText("");
          }
          log.group();
          return true;
        },
      }
    ], // 2}}}
    /**
     * keyBindings::[] {{{2
     * エディタへ設定するカスタム・キーバインド
     * @type {Object[]}
     * {
     *   id:       {String}        アクションのidと対応
     *   key:      {String|Number} 入力キー文字 or AsciiCode
     *   override: {Boolean}       既存キーバインドを上書きするか
     *   accel:    {Boolean}       Ctrl (Macの場合はCommand) の有無
     *   shift:    {Boolean}       Shift の有無
     *   meta:     {Boolean}       Alt (Macの場合はOption) の有無
     * }
     */
    keyBindings: [
      { id: "execOrFeed", key: 13, override: true },
      { id: "exec",       key: "r", accel: true  },
      { id: "clear",      key: "l", accel: true, override: true },
      { id: "historyPrevious", key: "p", accel: true, override: true },
      { id: "historyNext",     key: "n", accel: true, override: true },
    ], // 2}}}
    /**
     * onModelChanged (Object::e) {{{2
     * エディタ内で発生するイベントのハンドラ
     * エディタの高さを行数に合わせる
     * @param {Object} e
     * @param {Number} e.addedLineCount
     * @param {Number} e.removedLineCount
     * @param {Number} e.addedCharCount
     * @param {Number} e.removedCharCount
     */
    onModelChanged: function onModelChanged (e) {
      // TODO: 16(行の高さ)のマジックナンバー良くない
      if (e.addedLineCount > 0 || e.removedLineCount > 0) {
        this.editor._domNode.style.height = (2 + 16 * this.model.getLineCount()) + "px";
      }
    }, // 2}}}
    /**
     * validateCode ([String::aCode]) {{{2
     * esprima.parse() が成功するか否か
     * @param {String} [aCode]
     * @return {Boolean}
     */
    validateCode: function (aCode) {
      if (!aCode)
        aCode = this.model.getText().trim();

      log("validate:", aCode);
      try {
        var res = esprima.parse(aCode);
        log("validate:", true);
      } catch (e) {
        log.error("validate:", e);
        return false;
      }
      return true;
    }, // 2}}}
    /**
     * exec ([String::aCode]) {{{2
     * 入力されたコードの実行(eval)
     * 1. 履歴へ追加 @see History.add
     * 2. 入力コードの出力 @see Editor.setCodeLine
     * 3. 実行
     * 4. 実行結果出力 @see Editor.printResult
     * 5. 入力欄へスクロール
     * 6. 入力欄のクリア @see Editorclear
     */
    exec: function (aCode) {
      if (!aCode)
        aCode = this.model.getText().trim();

      log.group("exec: " + aCode);
      this.history.add(aCode);
      this.setCodeLine("js");
      var res,
          success = true,
          startTime, endTime;
      try {
        startTime = now();
        res = evalCode(aCode);
        endTime = now();
        log("result:", res);
        log("elapse:", endTime - startTime);
      } catch(e) {
        res = e;
        log.error("result:", e);
        success = false;
      }
      this.printResult(res, success, endTime - startTime);
      this.editor._domNode.scrollIntoView();
      this.clear();
      log.group();
    }, // 2}}}
    /**
     * printResult (Any::aResult, Boolean::aSuccess) {{{2
     * 実行結果を出力
     */
    printResult: function (aResult, aSuccess, aElapse) {
      if (!aSuccess && aResult instanceof Error) {
        output.insertAdjacentHTML("BeforeEnd",
          '<div class="error">' + aResult.toString() + '</div>');
      } else {
        var str = toStringResult(aResult);
        if (str)
          output.insertAdjacentHTML("BeforeEnd", '<div class="normal">' + str + '</div>');
      }
      if (config.timer) {
        output.insertAdjacentHTML("BeforeEnd", '<p><time class="elapse">' + aElapse + '</time></p>');
      }
    }, // 2}}}
    /**
     * clear () {{{2
     * 入力ボックスの内容を削除
     */
    clear: function () {
      this.view.setSelection(0, Infinity, false);
      this.view._doDelete();
    }, // 2}}}
    /**
     * setCodeLine (String::aPromptName) {{{2
     * 入力コードの内容を出力
     * @param {String} aPromptName
     * @return {Element} appendした要素
     */
    setCodeLine: function (aPromptName) {

      var content = this.editor._domNode.querySelector(".textviewContent");
      content = content.cloneNode(true);
      content.contentEditable = false;
      content.removeAttribute("style");

      // remove unnecessary class
      Array.prototype.forEach.call(content.querySelectorAll(".currentLine,.currentBracket,.matchingBracket"),
        function (node) {
          node.classList.remove("currentLine");
          node.classList.remove("currentBracket");
          node.classList.remove("matchingBracket");
        });

      /*
       * <div class="codeline">
       *  <div class="prompt">${aPromptName}&gt;</div>
       *  <div class="code">${content}</div>
       * </div>
       */
      var container = document.createElement("div"),
          prompt = document.createElement("div"),
          code = document.createElement("div");
      container.className = "codeline";
      prompt.appendChild(document.createTextNode(aPromptName + ">"));
      prompt.className = "prompt";
      code.className = "code";
      code.appendChild(content);
      container.appendChild(prompt);
      container.appendChild(code);

      output.appendChild(container);
      return container;
    }, // 2}}}
  };
  // 1}}}

  function toStringResult (obj, dontExpand, showUndefined) {
    var type = typeof obj;
    switch (type) {
      case "undefined":
        if (!showUndefined)
          return;
      case "string":
      case "number":
      case "boolean":
      case "function":
        return '<span class="type-' + type + '">' + escapeHTML(String(obj)) + '</span>';
      case "object":
      default: {
        if (obj === null) {
          return '<span class="type-null">null</span>';
        } else if (dontExpand) {
          return '<span class="type-object">' + Object.prototype.toString.call(obj) + '</span>';
        }
        return toStringResult.objectToString(obj);
      }
    }
  }
  mixin(toStringResult, {
    objectToString: function objectToString (obj) {
      var str = Object.prototype.toString.call(obj),
          html = '<p class="type-object">' + str + '</p>';
      if (obj instanceof Element) {
        return html + '<p class="type-element">' + this.getElement(obj) + '</p>';
      }
      var className = str.substring(8, str.length - 1);
      switch (className) {
        case "Error":
        case "EvalError":
        case "RangeError":
        case "ReferenceError":
        case "TypeError":
        case "SyntaxError":
        case "URIError":
          return html + '<p class="error">' + escapeHTML(obj.toString()) + '</p>';
        case "Window":
        case "Document":
        case "HTMLDocument":
          return html;
        case "Object":
        default: {
          return html + toStringResult.getKeyValueTable(obj, true);
        }
      }
    },
    getElement: function getElement (node) {
      var ns = node.prefix,
          tagName = (ns ? ns + ":" : "") + node.localName,
          attrs = this.getAttributeList(node.attributes, ns);

      var html = "&lt;" + tagName;
      if (attrs.length > 0) {
        html += " " + attrs.join(" ");
      }
      html += node.childNodes.length > 0 ? "&gt;..." : "&gt;";
      html += "&lt;/" + tagName + "&gt;";
      return html;
    },
    getAttributeList: function getAttributeList (attrs, prefix) {
      var i = 0,
          len = attrs.length,
          result = [],
          attr,
          attrName;
      for (; i < len; ++i) {
        attr = attrs[i];
        if (attr.prefix === prefix) {
          attrName = attr.name;
        } else {
          attrName = attr.prefix + ":" + attr.name;
        }
        result.push(attrName + '="' + escapeHTML(attr.value) + '"');
      }
      return result;
    },
    getKeyValueTable: function getKeyValueTable (obj, onlyEnumerable) {
      var keys = onlyEnumerable ? Object.keys(obj) : Object.getOwnPropertyNames(obj);
      var i = 0, length = keys.length;
      var attr, desc, value;
      var msg = '<table class="keyValueTable"><tr>';
      for (; i < length; ++i) {
        attr = "";
        msg += '<td class="propName">' + keys[i] + '</td>';
        desc = Object.getOwnPropertyDescriptor(obj, keys[i]);
        if (desc.enumerable)
          attr += "E";

        if (desc.configurable)
          attr += "C";

        try {
          if ('value' in desc) {
            if (desc.writable)
              attr += "W";

            value = toStringResult(desc.value, true);
          } else {
            value = desc.get ?
                    '<span class="type-getter type-function">' + escapeHTML(desc.get.toString()) + '</span>' :
                    "";
            if (value) value += "\n";
            value += desc.set ?
                     '<span class="type-setter type-function">' + escapeHTML(desc.set.toString()) + '</span>' :
                     "";
          }
          msg += '<td class="propAttr">' + escapeHTML(attr) + '</td>';
          msg += '<td class="propValue">' + value + '</td>';
        } catch(e) {
          msg += '<td></td><td class="error">' + escapeHTML(e.toString()) + '</td>';
        }
        msg += '</tr>';
      }
      msg += '</table>';
      return msg;
    },
  });

  require(["orion/editor/edit"], function (edit) {
    var editor = edit({
      parent: "input",
      lang: "js",
      showLinesRuler: true,
      showAnnotationRuler: false,
      showOverviewRuler: false,
    });
    gEditor = new Editor(editor);
  });

  // ====================================================
  // Menu API
  // ================================================{{{1
  (function() {
    var clearCmd = $id("clearCmd"),
        parseCmd = $id("parseCmd"),
        esprimaCloseButton = $id("esprimaCloseButton");
    input.addEventListener("contextmenu", function onContext(aEvent) {
      var charCount = gEditor.model.getCharCount();
      clearCmd.disabled = (!output.innerHTML && charCount === 0);
      parseCmd.disabled = charCount === 0;
    }, false);
    clearCmd.addEventListener("click", function onClick(aEvent) {
      output.innerHTML = ""
      gEditor.clear();
      gEditor.view.focus();
    }, false);
    parseCmd.addEventListener("click", function onClick(aEvent) {
      var text = gEditor.model.getText();
      var $res = $id("parseResult");
      $res.parentNode.classList.remove("hidden");
      try {
        var res = esprima.parse(text);
        $res.textContent = JSON.stringify(res, null, "  ");
      } catch(e) {
        $res.textContent = e.toString();
      }
    }, false);
    esprimaCloseButton.addEventListener("click", function onClick (aEvent) {
      $id("esprima").classList.add("hidden");
    });
  })();
  // 1}}}


}(this));

// vim: set sw=2 ts=2 et fdm=marker foldlevel=0:
