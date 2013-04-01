
(function(win){
  "use strict";
  var evalCode = eval;
  var config = Object.preventExtensions({
    /** console.log 系の制御 */
    debug: true,
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
      if (this.currentIndex === 0)
        return "";

      return this.list[--this.currentIndex];
    },
    getNext: function History_getNext () {
      if (this.currentIndex >= this.list.length)
        return "";

      return this.list[++this.currentIndex];
    },
    cleer: function History_clear () {
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
    echo: {
      value: function (msg) {
        output.insertAdjacentHTML("BeforeEnd", '<div class="echo">' + msg + '</div>');
      }
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
        var keys = onlyEnumerable ? Object.keys(obj) : Object.getOwnPropertyNames(obj);
        var i = 0, length = keys.length;
        var attr, desc, value, type;
        var msg = '<table border="0"><tr>';
        for (; i < length; ++i) {
          attr = "";
          msg += '<td class="propName">' + keys[i] + '</td>';
          desc = Object.getOwnPropertyDescriptor(obj, keys[i]);
          if (desc.enumerable)
            attr += "E";

          try {
            if ('value' in desc) {
              if (desc.writable)
                attr += "W";

              type = typeof(desc.value);
              switch (type) {
                case "string":
                  value = escapeHTML(desc.value.quote()); break;
                case "function":
                  value = escapeHTML(desc.value.toString()); break;
                default:
                  value = desc.value; break;
              }
              value = '<span class="' + type + '">' + value + '</span>';
            } else {
              type = "";
              value = desc.get ? '<span class="getter">' + escapeHTML(desc.get.toString()) + '</span>' : "";
              if (value) value += "\n";
              value += desc.set ? '<span class="setter">' + escapeHTML(desc.set.toString()) + '</span>' : ""
            }
            msg += '<td class="propAttr">' + attr + '</td>';
            msg += '<td class="propValue">' + value + '</td>';
          } catch(e) {
            msg += '<td></td><td class="error">' + e.toString() + '</td>';
          }
          msg += '</tr>';
        }
        msg += '</table>';
        output.insertAdjacentHTML("BeforeEnd", msg);
      }
    }
  });
  // 1}}}


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
    actions: [
      {
        id: "execOrFeed",
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
        id: "exec",
        description: "eval the code",
        handler: function execCmd () {
          this.exec();
          return true;
        },
      }, {
        id: "clear",
        description: "clear output",
        handler: function clearCmd () {
          output.innerHTML = "";
          return true;
        },
      }
    ],
    keyBindings: [
      { id: "execOrFeed", key: 13, override: true },
      { id: "exec",       key: "r", accel: true  },
      { id: "clear",      key: "l", accel: true, override: true },
    ],
    onModelChanged: function onModelChanged (e) {
      if (e.addedLineCount > 0 || e.removedLineCount > 0) {
        this.editor._domNode.style.height = (2 + 16 * this.model.getLineCount()) + "px";
      }
    },
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
    },
    exec: function (aCode) {
      if (!aCode)
        aCode = this.model.getText().trim();

      this.history.add(aCode);
      this.setCodeLine("js");
      var res,
          success = true;
      try {
        res = evalCode(aCode);
        log("result:", res);
      } catch(e) {
        res = e;
        log.error("result:", e);
        success = false;
      }
      this.printResult(res, success);
      this.editor._domNode.scrollIntoView();
      this.clear();
    },
    printResult: function (aResult, aSuccess) {
      if (!aSuccess && aResult instanceof Error) {
        output.insertAdjacentHTML("BeforeEnd",
          '<div class="error">' + aResult.toString() + '</div>');
      } else {
        output.insertAdjacentHTML("BeforeEnd", '<div class="normal">' + objectToString(aResult) + '</div>');
      }
    },
    clear: function () {
      this.view.setSelection(0, Infinity, false);
      this.view._doDelete();
    },
    setCodeLine: function (aPromptName) {
      var content = this.editor._domNode.querySelector(".textviewContent");
      if (!content)
        return;

      content = content.cloneNode(true);
      content.contentEditable = false;
      content.removeAttribute("style");
      Array.prototype.forEach.call(content.querySelectorAll(".currentLine,.currentBracket,.matchingBracket"),
        function (node) {
          node.classList.remove("currentLine");
          node.classList.remove("currentBracket");
          node.classList.remove("matchingBracket");
        });
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
    },
  };
  function objectToString (obj) {
    return String(obj);
  }

  require(["orion/editor/edit"], function (edit) {
    var editor = edit({ parent: "input", lang: "js", showLinesRuler: false, });
    gEditor = new Editor(editor);
  });
  


  // ====================================================
  // Menu API
  // ================================================{{{1
  (function() {
    var clearCmd = $id("clearCmd"),
        parseCmd = $id("parseCmd");
    input.addEventListener("contextmenu", function onContext(aEvent) {
      clearCmd.disabled = (!output.innerHTML && !input.innerHTML);
      parseCmd.disabled = !input.innerHTML;
    }, false);
    clearCmd.addEventListener("click", function onClick(aEvent) {
      output.innerHTML = ""
      input.innerHTML = "";
      input.focus();
    }, false);
    parseCmd.addEventListener("click", function onClick(aEvent) {
      var text = input.innerHTML.replace(codeReplacer.reg, codeReplacer);
      var $res = $id("parseResult");
      $res.parentNode.classList.remove("hidden");
      try {
        var res = esprima.parse(text);
        $res.textContent = JSON.stringify(res, null, "  ");
      } catch(e) {
        $res.textContent = e.toString();
      }
    }, false);
  })();
  // 1}}}


}(this));

// vim: set sw=2 ts=2 et fdm=marker foldlevel=0:
