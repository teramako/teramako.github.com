
// --------------------------------------------------------
// Date
// --------------------------------------------------------
function  toDateFromw3cDateString(str){
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
function formatDate(date, format){
  function formatter(all, id){
    var buf;
    switch (id){
      case "%":
        return id;
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
      case "T":
        buf = [formatter(null,"H"), formatter(null,"M"), formatter(null,"S")].join(":");
        return buf;
      case "F":
        buf = [formatter(null,"Y"), formatter(null,"m"), formatter(null,"d")].join(":");
        return buf;
      default:
        return all;
    }
    return buf >= 10 ? buf : "0" + buf;
  }
  return format.replace(/%(.)/g, formatter);
}

// --------------------------------------------------------
// Element
// --------------------------------------------------------
function createElement(tagName, attrs, text){
  var elm = document.createElement(tagName);
  for (var nodeName in attrs){
    elm.setAttribute(nodeName, attrs[nodeName]);
  }
  if (text) elm.textContent = text;
  return elm;
}

// vim: sw=2 ts=2 et:
