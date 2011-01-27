/**
 * @description GitHub JavaScript API
 * @author teramako teramako@gmail.com
 * @license MIT
 * @see http://develop.github.com/
 */

var GITHUB;

(function(){

/* option keywords
{
  user    : user id
  project : repository name
  branch  : branch name
  path    : file path
  sha     : commit revision
  target  : target element will be set indicator image
  q       : search term
} */
GITHUB = function(type, option){
  switch(type){
    case "user":
      return new $USER(option);
    case "commits":
      return new $COMMITS(option);
    case "blob":
      return new $BLOB(option);
    case "repositories":
      return new $REPOSITORIES(option);
    default:
      return new $CORE(option);
  }
}
GITHUB.types = [];
// function array called from JSOP
GITHUB.callbackFuncs = [];
// GITHUB.setScript {{{
/**
 * @param {String} url of GitHub JSON
 * @param {Element} targetElm will be appended indicator image
 * @param {Object} self which is called from
 * @param {Function} cbFunc callback function called when the script element is loaded
 */
GITHUB.setScript = function(url, targetElm, self, cbFunc){
  var func, index, scriptURL;
  // 対象要素がある場合は、その対象の要素にインジケータの表示と
  // ロード後の削除処理を入れる
  if (targetElm instanceof Element){
    var image = GITHUB.setImage(targetElm);
    func = function(obj){
      targetElm.removeChild(image);
      cbFunc.call(self, obj);
    };
  } else {
    func = function(obj){
      cbFunc.call(self, obj);
    }
  }
  index = GITHUB.callbackFuncs.push(func) - 1;
  scriptURL = url + "?callback=GITHUB.callbackFuncs[" + index + "]";
  var script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", scriptURL);
  document.body.appendChild(script);
} // }}}
// GITHUB.setImage {{{
/**
 * @param {Element} elm append target element
 * @param {String} imageSrc (optional)
 * @return {Element}
 */
GITHUB.setImage = function(elm, imageSrc){
  var image = new Image();
  var src = imageSrc || "http://github.com/images/modules/ajax/indicator.gif";
  image.setAttribute("src", src);
  return elm.appendChild(image);
} // }}}

// ------------------------------------------------------------------
// Core
// ---------------------------------------------------------------{{{
function $CORE(opt){ this.option = opt || {}; }
$CORE.prototype = {
  set: function(opt){
    for (var key in opt){
      this.option[key] = opt[key];
    }
    return this;
  },
  to: function(type){
    return GITHUB(type, this.option);
  },
  /**
   * @param {String[]} pathArray
   * @param {Object} opt
   * @exception ReferenceError
   * @return {String} URL of GitHub JSON
   * pathArrayの各値の最初の文字が":"であった場合には、
   *   ":"を取り除いた値をkeyとしてopt値または自身のoptionの値を取り
   *   URLのパスとする。
   * そうでない場合は、
   *   その値をURLのパスとする
   */
  getURL: function(pathArray, opt){
    var path = ["http://github.com/api/v2/json"];
    if (!opt) opt = {};
    for (var i=0, length=pathArray.length; i < length; i++){
      var key = pathArray[i];
      if (key.charAt(0) == ":"){
        key = key.substring(1);
        var value = opt[key] || this.option[key];
        if (!value){
          throw new ReferenceError(key + " is not defined");
        }
        path.push(value);
      } else {
        path.push(key);
      }
    }
    return path.join("/");
  }
}; // }}}

// ------------------------------------------------------------------
// User
// ---------------------------------------------------------------{{{
GITHUB.types.push("user");
function $USER(opt) { this.option = opt || {}; }
$USER.prototype = new $CORE();
extend($USER, {
  /**
   * @see http://develop.github.com/p/users.html#searching_for_users
   */
  search: createFunc(["user", "search",":q"], "users"),
  /**
   * @see http://develop.github.com/p/users.html#getting_user_information
   */
  getUserInfo: createFunc(["user", "show",":user"], "user"),
  /**
   * @see http://develop.github.com/p/users.html#following_network
   */
  getUserFollowers: createFunc(["user", "show",":user","followers"], "users"),
  getUserFollowing: createFunc(["user", "show",":user","following"], "users"),
}); // }}}

// ------------------------------------------------------------------
// Commits
// ---------------------------------------------------------------{{{
GITHUB.types.push("commits");
function $COMMITS(opt) { this.option = opt || {}; }
$COMMITS.prototype = new $CORE();
extend($COMMITS, {
  /**
   * @see http://develop.github.com/p/commits.html#listing_commits_on_a_branch
   */
  getCommitsListForBranch: createFunc(["commits", "list",":user",":project",":branch"], "commits"),
  /**
   * @see http://develop.github.com/p/commits.html#listing_commits_for_a_file
   */
  getCommitsListForFile: createFunc(["commits","list",":user",":project",":branch",":path"], "commits"),
  /**
   * @see http://develop.github.com/p/commits.html#showing_a_specific_commit
   */
  getCommitLog: createFunc(["commits","show",":user",":project",":sha"], "commit")
}); // }}}

// ------------------------------------------------------------------
// Blob
// ---------------------------------------------------------------{{{
GITHUB.types.push("blob");
function $BLOB(opt) { this.option = opt || {}; } 
$BLOB.prototype = new $CORE();
extend($BLOB, {
  /**
   * @see http://develop.github.com/p/object.html#trees
   */
  getTrees: createFunc(["tree","show",":user",":project",":sha"], "tree"),
  /**
   * @see http://develop.github.com/p/object.html#blobs
   */
  getBlobs: createFunc(["blob","show",":user",":project",":sha",":path"], "blob"),
  /**
   * @see http://develop.github.com/p/object.html#raw_git_data
   */
  getRawData: createFunc(["blob","show",":user",":project",":sha"])
}); // }}}

// ------------------------------------------------------------------
// Repositories
// ---------------------------------------------------------------{{{
GITHUB.types.push("repositories");
function $REPOSITORIES(opt) { this.option = opt || {}; }
$REPOSITORIES.prototype = new $CORE();
extend($REPOSITORIES, {
  /**
   * @see http://develop.github.com/p/repo.html#searching_repositories
   */
  search: createFunc(["repos","search",":q"], "repositories"),
  /**
   * @see http://develop.github.com/p/repo.html#show_repo_info
   */
  getRepoInfo: createFunc(["repos","show",":user",":project"], "repositories"),
  /**
   * @see http://develop.github.com/p/repo.html#network
   */
  getForks: createFunc(["repos","show",":user",":project","network"], "network"),
  /**
   * @see http://develop.github.com/p/repo.html#repository_refs
   */
  getTags: createFunc(["repos","show",":user",":project","tags"], "tags"),
  getBranches: createFunc(["repos","show",":user",":project","branches"], "branches"),
}); // }}}

// createFunc {{{
/**
 * @param {String[]} basePathArray
 * @param {String[]} optPathArray
 * @param {String} returnKey
 * @return {Function}
 */
function createFunc(pathArray, returnKey){
  return function(callback, opt){
    var target = (opt && opt.target) ? opt.target : this.option.target;
    var url = this.getURL(pathArray, opt);
    GITHUB.setScript(url, target, this, function(obj){
      callback(returnKey ? obj[returnKey] : obj, this);
    });
  }
} // }}}
// extend {{{
/**
 * @param {Function|Object} class
 * @param {Object} obj
 */
function extend(_class, obj){
  var flag;
  for (var key in obj){
    flag = true;
    if (obj.__lookupGetter__(key)){
      _class.prototype.__defineGetter__(key, obj[key]);
      flag = false;
    }
    if (obj.__lookupSetter__(key)){
      _class.prototype.__defineSetter__(key, obj[key]);
      flag = false;
    }
    if (flag){
      _class.prototype[key] = obj[key];
    }
  }
} // }}}
})();
// vim: sw=2 ts=2 et fdm=marker:
