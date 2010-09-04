
var doc = document;
var times = 5000;
var res, work;

XML.prettyPrinting = false;
default xml namespace = "http://www.w3.org/1999/xhtml";

function xmlToDOM(xml){
  var doc = document.importNode(
    (new DOMParser).parseFromString(
      <root>{xml}</root>,
      "application/xml"
    ).documentElement,
    true);
  var range = document.createRange();
  range.selectNodeContents(doc);
  var fragment = range.extractContents();
  range.detach();
  return fragment.childNodes.length > 1 ? fragment : fragment.firstChild;
}

function clear() {
  while(work.hasChildNodes()){
    work.removeChild(work.firstChild);
  }
}

function log(title, totalTime, msg){
  var xml = <section>
    <h3><span id={title} onclick="showCode(this.id)">{title}</span></h3>
    <p class="time">{totalTime}</p>
  </section>;
  if (typeof msg == "object"){
    var x = <dl/>
    for (let i in msg){
      x.appendChild(<><dt>{i}</dt><dd>{msg[i]}</dd></>);
    }
    xml.appendChild(x);
  } else if (typeof msg != "undefined"){
    xml.appendChild(<p>{msg}</p>);
  }
  res.appendChild(xmlToDOM(xml));
}
var currentFuncName = null;
function showCode(name){
  var elm = doc.getElementById("code");
  var target = doc.getElementById(name);
  var f = funcs.filter(function(func) func.name == name)[0];
  if (f && f.name != currentFuncName){
    if (currentFuncName)
      doc.getElementById(currentFuncName).style.color = "black";
    target.style.color = "green";
    currentFuncName = f.name;
    while (elm.hasChildNodes()){
      elm.removeChild(elm.firstChild);
    }
    elm.appendChild(xmlToDOM(<>
      <h4 onclick="showCode(this.textContent)">{currentFuncName}</h4>
      <pre>{f.toString()}</pre>
    </>));
    elm.style.display = "block";
  } else {
    target.style.color = "black";
    elm.style.display = "none";
    currentFuncName = null;
  }
}

// vim: sw=2 ts=2 et:
