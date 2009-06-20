
if (!GITHUB) {
  var GITHUB = {};
}
GITHUB.CommitHistory = (function(){
function showHistory(className){
  var elms = document.getElementsByClassName(className);
  Array.slice(elms).forEach(function(elm){
    var name = elm.getAttribute("name");
    var branch = elm.getAttribute("branch") || "master";
    var maxCount = elm.hasAttribute("maxcount") ? elm.getAttribute("maxcount") : 20;
    var ul = document.createElement("ul");
    ul.setAttribute("class","git-history");
    var image = document.createElement("img");
    image.setAttribute("src", "http://github.com/images/modules/ajax/indicator.gif");
    elm.appendChild(image);
    getHistoryFromJSON(name, branch, function(obj){
      obj.commits.slice(0,maxCount).forEach(function(commit){
        var li = document.createElement("li");
        var date = stringToDate(commit.committed_date);
        var message = commit.message.split("\n")[0];
        li.innerHTML =
        <dl>
          <dt>
            <a href={commit.url}>{message}</a>
          </dt>
          <dd class="git-date">{date.toString()}</dd>
        </dl>.toXMLString();
        ul.appendChild(li);
      });
      elm.removeChild(image);
    });
    elm.appendChild(ul);
  });
}
function  stringToDate(str){
  var m = str.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([-+])(\d{2}):(\d{2})/);
  var d = new Date();
  d.setUTCFullYear(m[1]);
  d.setUTCMonth(m[2]-1);
  d.setUTCDate(m[3]);
  d.setUTCHours(m[4]);
  d.setUTCMinutes(m[5]);
  d.setUTCSeconds(m[6]);
  return new Date(d - (m[7] == "+" ? 1 : -1) * parseInt(m[8],10) * 60 * 60 * 1000);
}
function getHistoryFromJSON(name, branch, cbFunc){
  callbacker[name] = cbFunc;
  var url = "http://github.com/api/v1/json/teramako/" + name + "/commits/" + branch;
  var script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", url + "?callback=GITHUB.CommitHistory.callback('" + name + "')");
  document.body.appendChild(script);
}

var callbacker = {};
var self = {
  init: function(className){
    showHistory(className);
  },
  callback: function(name){
    return callbacker[name];
  }
}
return self;
})();
// vim: sw=2 ts=2 et:
