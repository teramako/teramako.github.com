
if (!GITHUB) {
  var GITHUB = {};
}
GITHUB.CommitHistory = (function(){
function showHistory(className, userName){
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
    getHistoryFromJSON(userName, name, branch, function(obj){
      obj.commits.slice(0,maxCount).forEach(function(commit){
        var li = document.createElement("li");
        var date = stringToDate(commit.committed_date);
        var message = commit.message.split("\n")[0];
        li.innerHTML = <>
          <span class="git-date">{formatDate(date, "%Y-%m-%d %H:%M")}</span>
          <br/>
          <a href={commit.url}>{message}</a>
        </>.toXMLString();
        ul.appendChild(li);
      });
      elm.removeChild(image);
    });
    elm.appendChild(ul);
  });
}
function formatDate(date, format){
  function formatter(all, id){
    var buf;
    switch (id){
      case "Y":
        buf = date.getFullYear(); break;
      case "m":
        buf = date.getMonth() + 1; break;
      case "d":
        buf = date.getDate(); break;
      case "H":
        buf = date.getHours(); break;
      case "M":
        buf = date.getMinutes(); break;
      case "S":
        buf = date.getSeconds(); break;
    }
    return buf >= 10 ? buf : "0" + buf;
  }
  return format.replace(/%(.)/g, formatter);
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
function getHistoryFromJSON(userName, name, branch, cbFunc){
  if (!userName || !name || !branch){
    throw new Error("getHistoryFromJSON: invalid arguments");
  }
  callbacker[name] = cbFunc;
  var url = "http://github.com/api/v1/json/" + userName + "/" + name + "/commits/" + branch;
  var script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", url + "?callback=GITHUB.CommitHistory.callback('" + name + "')");
  document.body.appendChild(script);
}

var callbacker = {};
var self = {
  init: function(className, userName){
    showHistory(className, userName);
  },
  callback: function(name){
    return callbacker[name];
  }
}
return self;
})();
// vim: sw=2 ts=2 et:
