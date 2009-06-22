/**
 * @author teramako teramako@gmail.com
 * @see http://develop.github.com/
 */

if (!GITHUB){
  var GITHUB = {};
}
GITHUB.setImage = function (elm, imageSrc){
  var image = document.createElement("img");
  var src = imageSrc || "http://github.com/images/modules/ajax/indicator.gif";
  image.setAttribute("src", src);
  return elm.appendChild(image);
}
GITHUB.callbackFuncs= [];
GITHUB.setScript = function(url, elm, cbFunc, self){
  var imageElm = GITHUB.setImage(elm);
  // インジケータ削除コードを仕込む
  var func = function(obj){
    elm.removeChild(imageElm);
    cbFunc.call(self, obj);
  }
  var id = GITHUB.callbackFuncs.push(func) - 1;
  var URI = url + "?callback=GITHUB.callbackFuncs[" + id + "]";
  var script = document.createElement("script");
  script.setAttribute("type","text/javascript");
  script.setAttribute("src", URI);
  document.body.appendChild(script); 
}
/**
 * @see http://develop.github.com/p/commits.html
 */
// http://github.com/api/v2/json/commits/list/teramako/JetpackScripts/master/README
GITHUB.Commits = function(){ this.init.apply(this, arguments); }
GITHUB.Commits.prototype = {
  init: function(rootElm, userName, repoName, branch, path, callbackFunc){
    this.elm = rootElm;
    this.userName = userName;
    this.repoName = repoName;
    this.branch = branch;
    this.path = path;
    this.commits = null;
    this.callback = callbackFunc;
    if (typeof this.callback == "function"){
      this.get();
    }
  },
  baseURL: "http://github.com/api/v2/json/commits/list",
  get: function(callbackFunc){
    var func;
    if (typeof callbackFunc == "function"){
      this.callback = func = callbackFunc;
    }
    GITHUB.setScript(this.getURL(), this.elm, this.setData, this);
  },
  getURL: function(){
    return [this.baseURL, this.userName, this.repoName, this.branch, this.path].join("/");
  },
  setData: function(obj){
    this.commits = obj.commits;
    if (typeof this.callback == "function"){
      this.callback(obj.commits, this.elm);
    }
  }
};

/**
 * @see http://develop.github.com/p/object.html
 */
// http://github.com/api/v2/json/blob/show/teramako/JetpackScripts/4e0c282def58b26d4776eda74334c8753e40c4fa/README
GITHUB.Blob = function() { this.init.apply(this, arguments); }
GITHUB.Blob.prototype = {
  init: function(rootElm, userName, repoName, commitID, path, callbackFunc){
    this.elm = rootElm;
    this.userName = userName;
    this.repoName = repoName;
    this.id = commitID;
    this.path = path;
    this.blob = null;
    this.callback = callbackFunc;
    if (typeof this.callback == "function"){
      this.get();
    }
  },
  baseURL: "http://github.com/api/v2/json/blob/show",
  get: function(callbackFunc){
    var func;
    if (typeof callbackFunc == "function"){
      this.callback = func = callbackFunc;
    }
    GITHUB.setScript(this.getURL(), this.elm, this.setData, this);
  },
  getURL: function(){
    return [this.baseURL, this.userName, this.repoName, this.id, this.path].join("/");
  },
  setData: function(obj){
    this.blob = obj.blob;
    if (typeof this.callback == "function"){
      this.callback(obj.blob, this.elm);
    }
  }
}
// vim: sw=2 ts=2 et:
