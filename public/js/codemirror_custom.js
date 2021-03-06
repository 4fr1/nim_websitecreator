/* Formatting */
!function(e){"object"==typeof exports&&"object"==typeof module?e(require("codemirror/lib/codemirror")):"function"==typeof define&&define.amd?define(["codemirror/lib/codemirror"],e):e(CodeMirror)}(function(e){e.extendMode("css",{commentStart:"/*",commentEnd:"*/",newlineAfterToken:function(e,t){return/^[;{}]$/.test(t)}}),e.extendMode("javascript",{commentStart:"/*",commentEnd:"*/",newlineAfterToken:function(e,t,n,o){return this.jsonMode?/^[\[,{]$/.test(t)||/^}/.test(n):(";"!=t||!o.lexical||")"!=o.lexical.type)&&(/^[;{}]$/.test(t)&&!/^;/.test(n))}});var t=/^(a|abbr|acronym|area|base|bdo|big|br|button|caption|cite|code|col|colgroup|dd|del|dfn|em|frame|hr|iframe|img|input|ins|kbd|label|legend|link|map|object|optgroup|option|param|q|samp|script|select|small|span|strong|sub|sup|textarea|tt|var)$/;e.extendMode("xml",{commentStart:"\x3c!--",commentEnd:"--\x3e",newlineAfterToken:function(e,n,o,r){var i=!1;return"html"==this.configuration&&(i=!!r.context&&t.test(r.context.tagName)),!i&&("tag"==e&&/>$/.test(n)&&r.context||/^</.test(o))}}),e.defineExtension("commentRange",function(t,n,o){var r=this,i=e.innerMode(r.getMode(),r.getTokenAt(n).state).mode;r.operation(function(){if(t)r.replaceRange(i.commentEnd,o),r.replaceRange(i.commentStart,n),n.line==o.line&&n.ch==o.ch&&r.setCursor(n.line,n.ch+i.commentStart.length);else{var e=r.getRange(n,o),a=e.indexOf(i.commentStart),c=e.lastIndexOf(i.commentEnd);a>-1&&c>-1&&c>a&&(e=e.substr(0,a)+e.substring(a+i.commentStart.length,c)+e.substr(c+i.commentEnd.length)),r.replaceRange(e,n,o)}})}),e.defineExtension("autoIndentRange",function(e,t){var n=this;this.operation(function(){for(var o=e.line;o<=t.line;o++)n.indentLine(o,"smart")})}),e.defineExtension("autoFormatRange",function(t,n){var o=this,r=o.getMode(),i=o.getRange(t,n).split("\n"),a=e.copyState(r,o.getTokenAt(t).state),c=o.getOption("tabSize"),s="",m=0,l=0===t.ch;function d(){s+="\n",l=!0,++m}for(var f=0;f<i.length;++f){for(var g=new e.StringStream(i[f],c);!g.eol();){var u=e.innerMode(r,a),p=r.token(g,a),b=g.current();g.start=g.pos,l&&!/\S/.test(b)||(s+=b,l=!1),!l&&u.mode.newlineAfterToken&&u.mode.newlineAfterToken(p,b,g.string.slice(g.pos)||i[f+1]||"",u.state)&&d()}!g.pos&&r.blankLine&&r.blankLine(a),!l&&f<i.length-1&&d()}o.operation(function(){o.replaceRange(s,t,n);for(var e=t.line+1,r=t.line+m;e<=r;++e)o.indentLine(e,"smart");o.setSelection(t,o.getCursor(!1))})})});

/* Auto close tags */
!function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror"),require("../fold/xml-fold")):"function"==typeof define&&define.amd?define(["../../lib/codemirror","../fold/xml-fold"],e):e(CodeMirror)}(function(b){b.defineOption("autoCloseTags",!1,function(e,t,n){if(n!=b.Init&&n&&e.removeKeyMap("autoCloseTags"),t){var o={name:"autoCloseTags"};("object"!=typeof t||t.whenClosing)&&(o["'/'"]=function(e){return(t=e).getOption("disableInput")?b.Pass:a(t,!0);var t}),("object"!=typeof t||t.whenOpening)&&(o["'>'"]=function(e){return function(e){if(e.getOption("disableInput"))return b.Pass;for(var t=e.listSelections(),n=[],o=e.getOption("autoCloseTags"),a=0;a<t.length;a++){if(!t[a].empty())return b.Pass;var r=t[a].head,i=e.getTokenAt(r),s=b.innerMode(e.getMode(),i.state),l=s.state;if("xml"!=s.mode.name||!l.tagName)return b.Pass;var d="html"==s.mode.configuration,c="object"==typeof o&&o.dontCloseTags||d&&y,f="object"==typeof o&&o.indentTags||d&&x,g=l.tagName;i.end>r.ch&&(g=g.slice(0,g.length-i.end+r.ch));var u=g.toLowerCase();if(!g||"string"==i.type&&(i.end!=r.ch||!/[\"\']/.test(i.string.charAt(i.string.length-1))||1==i.string.length)||"tag"==i.type&&"closeTag"==l.type||i.string.indexOf("/")==i.string.length-1||c&&-1<P(c,u)||T(e,g,r,l,!0))return b.Pass;var m=f&&-1<P(f,u);n[a]={indent:m,text:">"+(m?"\n\n":"")+"</"+g+">",newPos:m?b.Pos(r.line+1,0):b.Pos(r.line,r.ch+1)}}for(var h="object"==typeof o&&o.dontIndentOnAutoClose,a=t.length-1;0<=a;a--){var p=n[a];e.replaceRange(p.text,t[a].head,t[a].anchor,"+insert");var v=e.listSelections().slice(0);v[a]={head:p.newPos,anchor:p.newPos},e.setSelections(v),!h&&p.indent&&(e.indentLine(p.newPos.line,null,!0),e.indentLine(p.newPos.line+1,null,!0))}}(e)}),e.addKeyMap(o)}});var y=["area","base","br","col","command","embed","hr","img","input","keygen","link","meta","param","source","track","wbr"],x=["applet","blockquote","body","button","div","dl","fieldset","form","frameset","h1","h2","h3","h4","h5","h6","head","html","iframe","layer","legend","object","ol","p","select","table","ul"];function a(e,t){for(var n=e.listSelections(),o=[],a=t?"/":"</",r=e.getOption("autoCloseTags"),i="object"==typeof r&&r.dontIndentOnSlash,s=0;s<n.length;s++){if(!n[s].empty())return b.Pass;var l,d=n[s].head,c=e.getTokenAt(d),f=b.innerMode(e.getMode(),c.state),g=f.state;if(t&&("string"==c.type||"<"!=c.string.charAt(0)||c.start!=d.ch-1))return b.Pass;if("xml"!=f.mode.name)if("htmlmixed"==e.getMode().name&&"javascript"==f.mode.name)l=a+"script";else{if("htmlmixed"!=e.getMode().name||"css"!=f.mode.name)return b.Pass;l=a+"style"}else{if(!g.context||!g.context.tagName||T(e,g.context.tagName,d,g))return b.Pass;l=a+g.context.tagName}">"!=e.getLine(d.line).charAt(c.end)&&(l+=">"),o[s]=l}if(e.replaceSelections(o),n=e.listSelections(),!i)for(s=0;s<n.length;s++)(s==n.length-1||n[s].head.line<n[s+1].head.line)&&e.indentLine(n[s].head.line)}function P(e,t){if(e.indexOf)return e.indexOf(t);for(var n=0,o=e.length;n<o;++n)if(e[n]==t)return n;return-1}function T(e,t,n,o,a){if(!b.scanForClosingTag)return!1;var r=Math.min(e.lastLine()+1,n.line+500),i=b.scanForClosingTag(e,n,null,r);if(!i||i.tag!=t)return!1;for(var s=o.context,l=a?1:0;s&&s.tagName==t;s=s.prev)++l;n=i.to;for(var d=1;d<l;d++){var c=b.scanForClosingTag(e,n,null,r);if(!c||c.tag!=t)return!1;n=c.to}return!0}b.commands.closeTag=function(e){return a(e)}});

/* Auto close brackets */
!function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],e):e(CodeMirror)}(function(k){var t={pairs:"()[]{}''\"\"",triples:"",explode:"[]{}"},x=k.Pos;function y(e,r){return"pairs"==r&&"string"==typeof e?e:"object"==typeof e&&null!=e[r]?e[r]:t[r]}k.defineOption("autoCloseBrackets",!1,function(e,r,t){t&&t!=k.Init&&(e.removeKeyMap(i),e.state.closeBrackets=null),r&&(n(y(r,"pairs")),e.state.closeBrackets=r,e.addKeyMap(i))});var i={Backspace:function(e){var r=S(e);if(!r||e.getOption("disableInput"))return k.Pass;for(var t=y(r,"pairs"),n=e.listSelections(),i=0;i<n.length;i++){if(!n[i].empty())return k.Pass;var a=s(e,n[i].head);if(!a||t.indexOf(a)%2!=0)return k.Pass}for(var i=n.length-1;0<=i;i--){var o=n[i].head;e.replaceRange("",x(o.line,o.ch-1),x(o.line,o.ch+1),"+delete")}},Enter:function(n){var e=S(n),r=e&&y(e,"explode");if(!r||n.getOption("disableInput"))return k.Pass;for(var i=n.listSelections(),t=0;t<i.length;t++){if(!i[t].empty())return k.Pass;var a=s(n,i[t].head);if(!a||r.indexOf(a)%2!=0)return k.Pass}n.operation(function(){var e=n.lineSeparator()||"\n";n.replaceSelection(e+e,null),n.execCommand("goCharLeft"),i=n.listSelections();for(var r=0;r<i.length;r++){var t=i[r].head.line;n.indentLine(t,null,!0),n.indentLine(t+1,null,!0)}})}};function n(e){for(var r=0;r<e.length;r++){var t=e.charAt(r),n="'"+t+"'";i[n]||(i[n]=a(t))}}function a(r){return function(e){return function(i,e){var r=S(i);if(!r||i.getOption("disableInput"))return k.Pass;var t=y(r,"pairs"),n=t.indexOf(e);if(-1==n)return k.Pass;for(var a,o=y(r,"triples"),s=t.charAt(n+1)==e,l=i.listSelections(),c=n%2==0,f=0;f<l.length;f++){var h,u=l[f],d=u.head,p=i.getRange(d,x(d.line,d.ch+1));if(c&&!u.empty())h="surround";else if(!s&&c||p!=e)if(s&&1<d.ch&&0<=o.indexOf(e)&&i.getRange(x(d.line,d.ch-2),d)==e+e){if(2<d.ch&&/\bstring/.test(i.getTokenTypeAt(x(d.line,d.ch-2))))return k.Pass;h="addFour"}else if(s){var g=0==d.ch?" ":i.getRange(x(d.line,d.ch-1),d);if(k.isWordChar(p)||g==e||k.isWordChar(g))return k.Pass;h="both"}else{if(!c)return k.Pass;h="both"}else h=!s||(m=d,void 0,b=(v=i).getTokenAt(x(m.line,m.ch+1)),!/\bstring/.test(b.type)||b.start!=m.ch||0!=m.ch&&/\bstring/.test(v.getTokenTypeAt(m)))?0<=o.indexOf(e)&&i.getRange(d,x(d.line,d.ch+3))==e+e+e?"skipThree":"skip":"both";if(a){if(a!=h)return k.Pass}else a=h}var v,m,b;var C=n%2?t.charAt(n-1):e,P=n%2?e:t.charAt(n+1);i.operation(function(){if("skip"==a)i.execCommand("goCharRight");else if("skipThree"==a)for(var e=0;e<3;e++)i.execCommand("goCharRight");else if("surround"==a){for(var r=i.getSelections(),e=0;e<r.length;e++)r[e]=C+r[e]+P;i.replaceSelections(r,"around"),r=i.listSelections().slice();for(var e=0;e<r.length;e++)r[e]=(t=r[e],void 0,n=0<k.cmpPos(t.anchor,t.head),{anchor:new x(t.anchor.line,t.anchor.ch+(n?-1:1)),head:new x(t.head.line,t.head.ch+(n?1:-1))});i.setSelections(r)}else"both"==a?(i.replaceSelection(C+P,null),i.triggerElectric(C+P),i.execCommand("goCharLeft")):"addFour"==a&&(i.replaceSelection(C+C+C+C,"before"),i.execCommand("goCharRight"));var t,n})}(e,r)}}function S(e){var r=e.state.closeBrackets;return!r||r.override?r:e.getModeAt(e.getCursor()).closeBrackets||r}function s(e,r){var t=e.getRange(x(r.line,r.ch-1),x(r.line,r.ch+1));return 2==t.length?t:null}n(t.pairs+"`")});

/* Fold XML */
!function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],e):e(CodeMirror)}(function(e){"use strict";var l=e.Pos;function c(e,n){return e.line-n.line||e.ch-n.ch}var n="A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD",i=new RegExp("<(/?)(["+n+"][A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD-:.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*)","g");function a(e,n,t,i){this.line=n,this.ch=t,this.cm=e,this.text=e.getLine(n),this.min=i?Math.max(i.from,e.firstLine()):e.firstLine(),this.max=i?Math.min(i.to-1,e.lastLine()):e.lastLine()}function r(e,n){var t=e.cm.getTokenTypeAt(l(e.line,n));return t&&/\btag\b/.test(t)}function u(e){if(!(e.line>=e.max))return e.ch=0,e.text=e.cm.getLine(++e.line),!0}function f(e){if(!(e.line<=e.min))return e.text=e.cm.getLine(--e.line),e.ch=e.text.length,!0}function s(e){for(;;){var n=e.text.indexOf(">",e.ch);if(-1==n){if(u(e))continue;return}if(r(e,n+1)){var t=e.text.lastIndexOf("/",n),i=-1<t&&!/\S/.test(e.text.slice(t+1,n));return e.ch=n+1,i?"selfClose":"regular"}e.ch=n+1}}function h(e){for(;;){var n=e.ch?e.text.lastIndexOf("<",e.ch-1):-1;if(-1==n){if(f(e))continue;return}if(r(e,n+1)){i.lastIndex=n,e.ch=n;var t=i.exec(e.text);if(t&&t.index==n)return t}else e.ch=n}}function F(e){for(;;){i.lastIndex=e.ch;var n=i.exec(e.text);if(!n){if(u(e))continue;return}if(r(e,n.index+1))return e.ch=n.index+n[0].length,n;e.ch=n.index+1}}function x(e){for(;;){var n=e.ch?e.text.lastIndexOf(">",e.ch-1):-1;if(-1==n){if(f(e))continue;return}if(r(e,n+1)){var t=e.text.lastIndexOf("/",n),i=-1<t&&!/\S/.test(e.text.slice(t+1,n));return e.ch=n+1,i?"selfClose":"regular"}e.ch=n}}function g(e,n){for(var t=[];;){var i,r=F(e),u=e.line,f=e.ch-(r?r[0].length:0);if(!r||!(i=s(e)))return;if("selfClose"!=i)if(r[1]){for(var o=t.length-1;0<=o;--o)if(t[o]==r[2]){t.length=o;break}if(o<0&&(!n||n==r[2]))return{tag:r[2],from:l(u,f),to:l(e.line,e.ch)}}else t.push(r[2])}}function v(e,n){for(var t=[];;){var i=x(e);if(!i)return;if("selfClose"!=i){var r=e.line,u=e.ch,f=h(e);if(!f)return;if(f[1])t.push(f[2]);else{for(var o=t.length-1;0<=o;--o)if(t[o]==f[2]){t.length=o;break}if(o<0&&(!n||n==f[2]))return{tag:f[2],from:l(e.line,e.ch),to:l(r,u)}}}else h(e)}}e.registerHelper("fold","xml",function(e,n){for(var t=new a(e,n.line,0);;){var i=F(t);if(!i||t.line!=n.line)return;var r=s(t);if(!r)return;if(!i[1]&&"selfClose"!=r){var u=l(t.line,t.ch),f=g(t,i[2]);return f&&0<c(f.from,u)?{from:u,to:f.from}:null}}}),e.findMatchingTag=function(e,n,t){var i=new a(e,n.line,n.ch,t);if(-1!=i.text.indexOf(">")||-1!=i.text.indexOf("<")){var r=s(i),u=r&&l(i.line,i.ch),f=r&&h(i);if(r&&f&&!(0<c(i,n))){var o={from:l(i.line,i.ch),to:u,tag:f[2]};return"selfClose"==r?{open:o,close:null,at:"open"}:f[1]?{open:v(i,f[2]),close:o,at:"close"}:{open:o,close:g(i=new a(e,u.line,u.ch,t),f[2]),at:"open"}}}},e.findEnclosingTag=function(e,n,t,i){for(var r=new a(e,n.line,n.ch,t);;){var u=v(r,i);if(!u)break;var f=g(new a(e,n.line,n.ch,t),u.tag);if(f)return{open:u,close:f}}},e.scanForClosingTag=function(e,n,t,i){return g(new a(e,n.line,n.ch,i?{from:0,to:i}:null),t)}});

/* Matching tags highlight */
!function(t){"object"==typeof exports&&"object"==typeof module?t(require("../../lib/codemirror"),require("../fold/xml-fold")):"function"==typeof define&&define.amd?define(["../../lib/codemirror","../fold/xml-fold"],t):t(CodeMirror)}(function(n){"use strict";function c(t){t.state.tagHit&&t.state.tagHit.clear(),t.state.tagOther&&t.state.tagOther.clear(),t.state.tagHit=t.state.tagOther=null}function o(r){r.state.failedTagMatch=!1,r.operation(function(){if(c(r),!r.somethingSelected()){var t=r.getCursor(),e=r.getViewport();e.from=Math.min(e.from,t.line),e.to=Math.max(t.line+1,e.to);var a=n.findMatchingTag(r,t,e);if(a){if(r.state.matchBothTags){var o="open"==a.at?a.open:a.close;o&&(r.state.tagHit=r.markText(o.from,o.to,{className:"CodeMirror-matchingtag"}))}var i="close"==a.at?a.open:a.close;i?r.state.tagOther=r.markText(i.from,i.to,{className:"CodeMirror-matchingtag"}):r.state.failedTagMatch=!0}}})}function i(t){t.state.failedTagMatch&&o(t)}n.defineOption("matchTags",!1,function(t,e,a){a&&a!=n.Init&&(t.off("cursorActivity",o),t.off("viewportChange",i),c(t)),e&&(t.state.matchBothTags="object"==typeof e&&e.bothTags,t.on("cursorActivity",o),t.on("viewportChange",i),o(t))}),n.commands.toMatchingTag=function(t){var e=n.findMatchingTag(t,t.getCursor());if(e){var a="close"==e.at?e.open:e.close;a&&t.extendSelection(a.to,a.from)}}});
