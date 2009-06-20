
if (!GITHUB) {
  var GITHUB = {};
}
GITHUB.CommitHistory = (function(){
function showHistory(className){
  var elms = document.getElementsByClassName(className);
  Array.slice(elms).forEach(function(elm){
    var name = elm.getAttribute("name");
    var branch = elm.getAttribute("branch") || "master";
    var rssURL = "http://github.com/feeds/teramako/commits/" + name + "/" + branch;
    //var rssURL = "master.rss";
    var ul = document.createElement("ul");
    var image = document.createElement("img");
    image.setAttribute("src", "http://github.com/images/modules/ajax/indicator.gif");
    elm.appendChild(image);
    getHistoryFromRSS(rssURL, function(xml){
      var entries = xml.getElementsByTagName("entry");
      Array.slice(entries).forEach(function(entryElm){
        var entry = new rssEntry(entryElm);
        ul.appendChild(entry.toHTML());
      });
    });
    elm.removeChild(image);
    elm.appendChild(ul);
  });
}
function rssEntry() { this.init.apply(this, arguments); }
rssEntry.prototype = {
  init: function(entry){
    for (var i=0, length=entry.childNodes.length; i<length; i++){
      var elm = entry.childNodes[i];
      if (elm.nodeType == elm.ELEMENT_NODE){
        var obj = {};
        for (var k=0, attrlength=elm.attributes.length; k < attrlength; k++){
          var attr = elm.attributes[k];
          obj[attr.nodeName] = attr.nodeValue;
        }
        obj.textContent = elm.textContent.replace(/^\s+|\s+$/g,"");
        this[elm.localName] = obj;
      }
    }
  },
  toHTML: function(){
    var li = document.createElement("li");
    var content = this.getFormatedContent();
    var date = this.getUpdatedDate();
    var xml = <dl>
      <dt>
        <a href={this.link.href} title={this.author.textContent + "\n" + this.content.textContent}>{this.title.textContent}</a>
      </dt>
      <dd class="git-date">{date.toString()}</dd>
      <dd>{content}</dd>
    </dl>;
    li.innerHTML = xml.toXMLString();
    return li;
  },
  getUpdatedDate: function(){
    var m = this.updated.textContent.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([-+])(\d{2}):(\d{2})/);
    var d = new Date();
    d.setUTCFullYear(m[1]);
    d.setUTCMonth(m[2]-1);
    d.setUTCDate(m[3]);
    d.setUTCHours(m[4]);
    d.setUTCMinutes(m[5]);
    d.setUTCSeconds(m[6]);
    return new Date(d - (m[7] == "+" ? 1 : -1) * parseInt(m[8],10) * 60 * 60 * 1000);
  },
  getFormatedContent: function(){
    var str = this.content.textContent.replace(/<\??pre>/g,"").replace(/\n\n[\s\S]*$/,"");
    var files = str.split("\n");
    var xml = <ul class="git-list"></ul>;
    var m = [], a = [], d = [];
    files.forEach(function(e){
      xml.* += <li>{e}</li>;
    });
    return xml;
  }
};
function getHistoryFromRSS(url, cbFunc){
  var req = new XMLHttpRequest();
  req.open("GET", url, null, null, true);
  /*
  req.onload = function(){
    cbFunc(req.responseXML);
  }
  */
  req.onreadystatechange = function(){
    if (req.readyState == 4){
      if (req.status == 200){
        cbFunc(req.responseXML);
      }
    }
  }
  req.send(null);
}
var self = {
  init: function(className){
    showHistory(className);
  }
}
return self;
})();
// vim: sw=2 ts=2 et:
