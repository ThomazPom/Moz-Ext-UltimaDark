window.dark_object = {
  foreground: {
    inject: function() {
      ud.frontWatch = [
        ["background-color", "backgroundColor"]
      ];
      ud.revert_frontWatch = [
        ["color", "color"]
      ]
      ud.Inspector = class Inspector {
        constructor(leType, atName, watcher = x => {}, applyOnReturn = x => {}) {
          var leProto = leType instanceof Function ? leType.prototype : leType
          var originalMethod = leProto[atName]
          var inspectMethod = function() {
            var watcher_result = watcher.apply(null, arguments)
            var callresult = originalMethod.apply(this, arguments)
            var apply_result = applyOnReturn.apply(null, [callresult])
            return callresult;
          }
          if (leProto[atName].name != "inspectMethod") {
            leProto[atName] = inspectMethod
          }
          console.log("Now watching", leType.name, originalMethod, "in", document.location.href)
        }
      }
      ud.styleflag = "/*watched_ultimadark*/"
      ud.backPoperties = [
        ["background", "background-color"],
        ["background-color"]
      ];
      ud.colorProperties = [
        ["color"]
      ];
      ud.propertyEditor = function(aProperty, arule, howto) {
        var rulelist = ([arule, ...arule.cssRules || []]).filter(x => x.style);
        rulelist.forEach(function(arule) {
          var propSource = aProperty[0]
          var propDest = aProperty[1] || propSource;
          var value = arule.style[propSource]
          var valueDest = arule.style[propDest]
          if (value && !valueDest.includes(ud.styleflag)) {
            howto(propSource, propDest, value, valueDest, arule)
          }
        })
      }
      ud.styleInEdition = [];
      ud.styleEditor = function(astyle) {
        if (ud.styleInEdition.includes(astyle)) {
          return;
        }
        ud.styleInEdition.push(astyle);
        [...document.styleSheets].filter(x => x.ownerNode === astyle).forEach(aSheet => {
          [...(aSheet.rules || aSheet.cssRules)].forEach(arule => {
            ud.backPoperties.forEach(aProperty => {
              ud.propertyEditor(aProperty, arule, (propSource, propDest, value, valueDest, arule) => {
                var is_color_result = ud.is_color(value)
                if (is_color_result) {
                  arule.style[propDest] = ud.rgba(...is_color_result) + ud.styleflag
                }
              })
            })
            ud.colorProperties.forEach(aProperty => {
              ud.propertyEditor(aProperty, arule, (propSource, propDest, value, valueDest, arule) => {
                var is_color_result = ud.is_color(value)
                // console.log(propSource,propDest,value,valueDest,arule,is_color_result)
                if (is_color_result) {
                  arule.style[propDest] = ud.revert_rgba(...is_color_result) + ud.styleflag
                }
              })
            })
          })
        })
        ud.styleInEdition = ud.styleInEdition.filter(x => x != astyle)
      }
      ud.raw_styleEditor = function(astyle) {
        astyle.innerHTML = ud.edit_str(astyle.innerHTML)
      }
      ud.styleWatcher = function() {
          [...arguments].forEach(elem => {
            if (elem instanceof HTMLStyleElement && elem.getAttribute("data-ultima") != "ud_style_watched") {
              elem.setAttribute("data-ultima", "ud_style_watched");
              var observer2 = new MutationObserver(mutationreacord => {
                ud.styleEditor(elem)
              });
              var innerhtml_config = {
                characterData: true,
                attributes: false,
                childList: true,
                subtree: true
              };
              observer2.observe(elem, innerhtml_config);
            }
          })
        },
        ud.prototypeEditor = function(leType, atName, watcher = x => x, conditon = (elem, value) => 1) {
          var originalSet = Object.getOwnPropertyDescriptor(leType.prototype, atName).set;
          Object.defineProperty(leType.prototype, atName, {
            set: function(value) {
               if (ud.styleInEdition.includes(this)) {
                return;
              }
              var new_value = conditon(this, value) ? watcher(this, value) : value;
              
              ud.styleInEdition = ud.styleInEdition.filter(x => x != this)
              return originalSet.call(this, new_value||value);
            }
          });
        }
      //  new ud.Inspector(Document, "createElement",x=>{},ud.styleWatcher);;
      //  new ud.Inspector(CSSStyleSheet,"addRule",console.log,console.log);
      ud.frontEditor = function(elem, value) {
        if (!value.endsWith(ud.styleflag)) {
                
          return [ud.edit_str(value), ud.styleflag].join("");
        }
      }
      //  ud.prototypeEditor( Element,    "innerHTML",     ud.frontEditor,     (elem,value)=>elem instanceof HTMLStyleElement       );
      window.addEventListener('load', (event) => {
          var bodycolor = getComputedStyle(document.body)["backgroundColor"]
          if(bodycolor!="rgba(0, 0, 0, 0)")
          {
           document.head.parentNode.style.backgroundColor=getComputedStyle(document.body)["backgroundColor"] 
          }
      });
      console.log("UltimaDark is loaded",window);
    }
  },
  background: {
    defaultRegexes: {
      white_list: ["<all_urls>", "*://*/*", "https://*.w3schools.com/*"].join('\n'),
      black_list: ["*://example.com/*"].join('\n')
    },
    filterContentScript: function(x) {
      return x.match(/<all_urls>|^(https?|wss?|file|ftp|\*):\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^file:\/\/\/.*$|^resource:\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^about:$/)
    },
    setListener: function() {
      browser.storage.local.get(null, function(res) {
        ud.userSettings = res;
        ud.userSettings.properWhiteList = (res.white_list || dark_object.background.defaultRegexes.white_list).split("\n").filter(dark_object.background.filterContentScript)
        ud.userSettings.properBlackList = (res.black_list || dark_object.background.defaultRegexes.black_list).split("\n").filter(dark_object.background.filterContentScript)
        ud.userSettings.exclude_regex = (res.black_list || dark_object.background.defaultRegexes.black_list).split("\n").map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Sanitize regex
          .replace(/(^<all_urls>|\\\*)/g, "(.*?)") // Allow wildcards
          .replace(/^(.*)$/g, "^$1$")).join("|") // User multi match)
        ud.knownvariables = {};
        browser.webRequest.onBeforeRequest.removeListener(dark_object.misc.monitorBeforeRequest);
        if (ud.regiteredCS) {
          ud.regiteredCS.unregister();
          ud.regiteredCS = null
        }
        if (!res.disable_webext && ud.userSettings.properWhiteList.length) {
          browser.webRequest.onBeforeRequest.addListener(dark_object.misc.monitorBeforeRequest, {
              urls: ud.userSettings.properWhiteList,
              types: ["stylesheet", "main_frame", "sub_frame", "image"]
            },
            ["blocking"]);
          var contentScript = {
            matches: ud.userSettings.properWhiteList,
            excludeMatches: ud.userSettings.properBlackList,

            js : [
              {code: ud.injectscripts_str}
              ],
            css: [{code: ud.inject_css_override}], // Forced overrides
            runAt: "document_start",
            matchAboutBlank: true,
            allFrames: true
          }
          if (!ud.userSettings.properBlackList.length) {
            delete contentScript.excludeMatches;
          }
          browser.contentScripts.register(contentScript).then(x => {
            ud.regiteredCS = x
          });
        }




//////////////////////////////EXPERIMENTAL

browser.webRequest.onHeadersReceived.addListener(function(e){
                var headersdo = {
                  "content-security-policy":(x=>{
                    x.value = x.value.replace(/script-src/, "script-src *")
                    x.value = x.value.replace(/default-src/, "default-src-src *")
                    x.value = x.value.replace(/style-src/, "style-src *")
                      return true;
                    }),
                }
                e.responseHeaders= e.responseHeaders.filter(x=>{
                    var a_filter=headersdo[x.name.toLowerCase()];
                      return a_filter?a_filter(x):true;
                })
               // console.log(e.responseHeaders)
              return {responseHeaders: e.responseHeaders};
          },
          {
              urls: ud.userSettings.properWhiteList,
              types: ["main_frame", "sub_frame"]
            },
            ["blocking", "responseHeaders"]);

///////////////////////////////EXPERIMENTAL
















      });
    },
    install: function() {
      ud.injectscripts = [dark_object.both.install, dark_object.foreground.inject].map(code => {
        var script = document.createElement("script");
        script.innerHTML = "(" + code.toString() + ")()";
        return script;
      })
      ud.colorRegex = new RegExp(CSS_COLOR_NAMES_RGX, "gi");
      //ud.injectscripts_str = ud.injectscripts.map(x => x.outerHTML).join("")// Head detection method
      ud.injectscripts_str = ud.injectscripts.map(x => x.innerHTML).join(";") // JS injection method
      // Listen for onHeaderReceived for the target page.
      // Set "blocking" and "responseHeaders".
      var portFromCS;

      function connected(p) {
        portFromCS = p;
        portFromCS.onMessage.addListener(function(m) {
          browser.storage.local.set(m, dark_object.background.setListener);
        });
      }
      browser.runtime.onConnect.addListener(connected);
      //Promises before starting :
      fetch("inject_css_suggested.css").then(res=>res.text())
      .then(str=>{

          
          ud.inject_css_suggested=ud.edit_str(str);
          return fetch("inject_css_override.css")

      })
      .then(res=>res.text())
      .then(str=>{
          ud.inject_css_override=ud.edit_str(str);
      })
      .then(x=>dark_object.background.setListener())
      
      ud = {
        ...ud,
        ...{
          attfunc_map:{
              "fill":ud.revert_rgba,
              "color":ud.revert_rgba,
              "bgcolor":ud.rgba
            },
          edit_background_image_urls: function(str) {
            //  var valueblend=["overlay","multiply","color","exclusion"].join(","); 
            return str;
          },
          edit_an_image: function(details) {
            var theUrl = new URL(details.url);
            if (theUrl.pathname.endsWith(".gif") && !theUrl.pathname.match(/logo|icon/i)) {
              return {}; // avoid animated gifs
            }
            if (theUrl.search.includes("ud-bypass_image")
              ||(theUrl.search="" && theUrl.pathname=="/favicon.ico")) {
              return {}; // avoid simple favicons
            }
           
            return new Promise((resolve, reject) => {
              var canvas = document.createElement('canvas');
              var myImage = new Image;

              var dataImageId=details.url.match(/\?data-image=[0-9-]+/)
              if(dataImageId)
              {
                myImage.src=ud.knownvariables[dataImageId[0]];
                delete ud.knownvariables[dataImageId[0]];
              }
              else
              {
                  myImage.src=details.url+"#ud-letpass_image";
              }
              var normalresolve = x => {
            


                canvas.width = myImage.width;
                canvas.height = myImage.height;
                var context = canvas.getContext('2d');
                context.drawImage(myImage, 0, 0);

                var is_background = (/footer|background|(bg|box|panel|fond|bck)[._-]/i).test(theUrl.pathname+theUrl.search);
                is_background = is_background||details.url.includes("#ud-background")
                //is_background=is_background&&!((/(logo|icon)/i).test(theUrl.pathname+theUrl.search))
                
                var islogo = !is_background 
                /*&& !theUrl.pathname.endsWith(".jpg") //some websites renames png files in jpg */
                && ud.edit_a_logo(context, myImage.width, myImage.height, details);
               //   console.log(theUrl,is_background,islogo,theUrl.search.startsWith("?data-image="))
                
                //console.log(details.url,myImage.src,theUrl,islogo,is_background,canvas.toDataURL())
                
                if (islogo ) {
                  resolve({
                    redirectUrl: canvas.toDataURL()
                  });
                }
                else if (is_background) {
                  ud.edit_a_background(context, myImage.width, myImage.height, 0xff)
                  //console.log(details, theUrl, canvas);
                  resolve({
                    redirectUrl: canvas.toDataURL()
                  });
                } else if(theUrl.search.startsWith("?data-image=")){
                  resolve({redirectUrl: myImage.src});
                } else {
                  resolve({});
                }
              }
              myImage.onload = normalresolve;
              myImage.onerror = x => {
                resolve({})
              }
              setTimeout(x => resolve({}), 1000);
            })
          },
          edit_a_logo: function(canvasContext, width, height, details) {
            if (width * height < 400) { // small images can't be logos
              //    return {};
            }
            //console.log(width,height,details)
            let theImageData = canvasContext.getImageData(0, 0, width, height),
              theImageDataBufferTMP = new ArrayBuffer(theImageData.data.length),
              theImageDataClamped8TMP = new Uint8ClampedArray(theImageDataBufferTMP),
              theImageDataUint32TMP = new Uint32Array(theImageDataBufferTMP),
              n = theImageDataUint32TMP.length;
            theImageDataClamped8TMP.set(theImageData.data);
            //    console.log(details,"willresolve")
            var cornerpixs = [0, parseInt(width / 2), width * parseInt(height / 2) - width, width * parseInt(height / 2), n - width, n - parseInt(width / 2), n - 1]
            //console.log(cornerpixs.map(x=>theImageDataUint32TMP[x]));
            cornerpixs = cornerpixs.map(x => theImageDataUint32TMP[x] <= 0x00ffffff) //superior to 0x00ffffff is not fully alpha
            // console.log(cornerpixs)
            var pixelcount1 = cornerpixs.slice(0,4).reduce((a, b) => a + b)
            var pixelcount2 = cornerpixs.slice(4).reduce((a, b) => a + b)
            //console.log(pixelcount)


          //  console.log(details.url,pixelcount1,pixelcount1)
            if (!pixelcount1 || !pixelcount2) {

           // console.log(details.url,"is not a logo : not enough trasnparent pixels")
              return false;
            }

            var samplepixels = theImageDataUint32TMP;
            if (ud.sample_mode_active == false) {
              //          var sampler = 40
              //        var samplepixelscount = Math.round(n/sampler); 
              //      samplepixels = Array.from({length: samplepixelscount}, (x, i) => i*sampler).map(x=>theImageDataUint32TMP[x])
              //#was used for globalcol#.map(number=>[number & 0xff,(number >> 8) & 0xff,(number >> 16) & 0xff])
            }
            let unique = [...new Set(samplepixels)];
            //var maxcol = Math.max(...[].concat(...samplepixels));
            //var delta= 255-maxcol // 255 is the future logo brightness inversion; can be configurable
            //   console.log(unique);
            //console.log(details.url,maxcol,n,samplepixels,unique.length)
            //  console.log(details.url, unique,unique.length);
            //console.log(width, height, details.url, "alphapix:", pixelcount, "unique", unique, "fullset", theImageDataUint32TMP, "sampleset", samplepixels, theImageData, canvasContext)
            // console.log(details.url, unique.length);
            if (unique.length > 700 + details.url.match(/logo|icon/)*700 /*|| unique.length == 256 */
              /*|| unique.indexOf(0) == -1*/ // already tested before
              ) {
              return false;
            }
            var delta2 = unique.includes(0xffffffff) &&  unique.includes(0xff000000)? 135 : 0 // care with pow
            //one last time : 00 is the opacity level : 0xff means full opacity, 0x00 means full transparency
            imgDataLoop: while (n--) {
              var number = theImageDataUint32TMP[n];
              var r = number & 0xff
              var g = (number >> 8) & 0xff
              var b = (number >> 16) & 0xff
              var a = (number >> 24) & 0xff
              /*if((r+g+b)/3>500)
              {
                continue imgDataLoop;
              }*/
              var maxcol = ud.max(r, g, b) // Local max col
              var delta = 255 - maxcol // 255 is the future logo brightness; can be configurable
              if (delta2 && a && (r + g + b) < 1) {
                delta -= delta2; // Experimental : if pic has black and white do not set black entirely white
              
              }
                       
            r = ud.min(Math.pow(r + delta,1.05),255);
            g = ud.min(Math.pow(g + delta,1.05),255);
            b = ud.min(Math.pow(b + delta,1.05),255); // experimental power up whites in logos; but how much ?

           /*   r = r + delta;
              g = g + delta;
              b = b + delta;*/
              var newColor = ((a << 24)) | (b << 16) | (g << 8) | r;
              theImageDataUint32TMP[n] = newColor;
            }
            theImageData.data.set(theImageDataClamped8TMP);
            canvasContext.putImageData(theImageData, 0, 0);
            return true;
          },
          edit_a_background: function(canvasContext, width, height, max_a = 1) {
            // where all the magic happens
            let theImageData = canvasContext.getImageData(0, 0, width, height),
              theImageDataBufferTMP = new ArrayBuffer(theImageData.data.length),
              theImageDataClamped8TMP = new Uint8ClampedArray(theImageDataBufferTMP),
              theImageDataUint32TMP = new Uint32Array(theImageDataBufferTMP),
              n = theImageDataUint32TMP.length;
            theImageDataClamped8TMP.set(theImageData.data);
            imgDataLoop: while (n--) {
              var number = theImageDataUint32TMP[n];
              var r = number & 0xff
              var g = (number >> 8) & 0xff
              var b = (number >> 16) & 0xff
              //if ((r+b+g)/3<150)
              //continue imgDataLoop; //does not work with gradients
              var a = (number >> 24) & max_a
              var oa = a;
              // var rgbarr = [r,g,b].map(x => ud.maxbrightbg *(x/ud.max(r,g,b)));
              //r=ud.max( r-100,0)//rgbarr[0];
              //g=ud.max( g-100,0)//rgbarr[1];
              //b=ud.max( b-100,0)//rgbarr[2];
              // r=rgbarr[0];
              //g=rgbarr[1];
              //b=rgbarr[2];
              //  a=Math.abs(ud.max(r,g,b)-255);
              //a=ud.min(a,(r+g+b)/-3+255); // linear
              a = ud.min(a, Math.pow((r + g + b) / -3 + 255, 1.25)); // pow, solves gradients & keeps colors; 0 means full dark;
              //cant fully alpha : if text is on white(to alpha) div and div on an image, text will be hard to read
              if (a < 1) {
                r = g = b = ud.minbrightbg;
                a = oa;
                // r=g=b=0;
              }
              var newColor = ((a << 24)) | (b << 16) | (g << 8) | r;
              theImageDataUint32TMP[n] = newColor;
            }
            theImageData.data.set(theImageDataClamped8TMP);
            canvasContext.putImageData(theImageData, 0, 0);
          },
          send_data_image_to_parser: function(str, details) {
            if (str.includes('data:')) {

              [...str.matchAll(/(data:image\/(png|jpe?g|svg\+xml);base64,([^\"]*?))[)'"]/g)].forEach((match, lindex) => {
                
                //var id = `https://google.com/favicon.ico?${details.requestId}-${details.datacount}-${lindex}`
                //   var id = "https://google.com/favicon.ico?1=10985-1-1"
                var id = `?data-image=${details.requestId}-${details.datacount}-${lindex}`
                ud.knownvariables[id] = match[1];
                str = str.replace(match[1], '/favicon.ico' + id);
              })
            }
            return str;
          },
          parse_and_edit_html1:function(str,details){
            var newDoc=new Document
          var html_element = document.createElement("html")

          html_element.innerHTML=str;//.replace(/"stylesheet"|<script|<img/g,"<anoscript");

          //console.log(html_element,str)

          html_element.querySelectorAll("style,[style]").forEach(astyle=>{
            var o_substr;
            var substr;
            if(astyle instanceof HTMLStyleElement)
            {
                  substr=o_substr = astyle.innerHTML;
            }
            else{
                  substr=o_substr=astyle.getAttribute("style");
                  substr=" "+substr+" ";
            }
            substr=ud.edit_str(substr)
            //    if(substr.includes("data:image")){
            substr = ud.send_data_image_to_parser(substr, details);

            str = str.replace(o_substr, substr);
          });

          html_element.querySelectorAll("link[rel='icon']").forEach(link=>{
            str=str.replace(link.outerHTML,link.outerHTML.replace(/(href*=".*?)"/,"$1?ud-bypass_image\""))
          })

          html_element.querySelectorAll("[fill],[color],path,[bgcolor]").forEach(coloreditem=>{
            var thecolor
            var o_outer=coloreditem.outerHTML

          for (const [key, afunction] of Object.entries({
              "fill":ud.revert_rgba,
              "color":ud.revert_rgba,
              "bgcolor":ud.rgba
            })) {
                if(ud.is_color(thecolor=coloreditem.getAttribute(key)))

                coloreditem.setAttribute(
                  key,afunction(...ud.eget_color(thecolor)))
                }
                str=str.replace(o_outer.slice(0,o_outer.indexOf(">")+1),
                  coloreditem.outerHTML.slice(0,coloreditem.outerHTML.indexOf(">")+1),
                  )
          })
          html_element.remove();
          str = str.replace(/integrity=/g, "nointegrity=");
          
          if (details.datacount == 1) //inject foreground script
          {
            

                var head_tag = str.matchAll(/<head.*?>/g).next();
                if(head_tag.value)
                {
                  var position=head_tag.value.index+head_tag.value[0].length
                  //  str = str.substring(0, position) + "<link id='ud-link' rel='stylesheet' href='https://pom.pm/Tests/Ultimadark_misc/override.css'>" +str.substring(position)
                  /* Non overrride styles */
                  str = str.substring(0, position) + "<style id='ud-style'>"+ud.inject_css_suggested+"</style>"+str.substring(position);
                  //  str += "<style id='ud-style'>"+ud.inject_css_suggested+"</style>";
                  //  str = str.substring(0, position) + ud.injectscripts_str+str.substring(position)
                  headFound = true;
                }
                else{
                  /* Non overrride styles */
                  str = "<style id='ud-style'>"+ud.inject_css_suggested+"</style>"+str;
                }  

          }
          return str;
          },
          decodeHtml: function(html) {
              var txt = document.createElement("textarea");
              txt.innerHTML = html;
              return txt.value;
          },
          parse_and_edit_html2:function(str,details){
            details.requestScripts=details.requestScripts||[]

            
            str= str.replace(/(<script ?.*?>)((.|\n)*?)(<\/script>)/g,(match, g1, g2, g3,g4)=>{
              var securedScript = {
                "id":["--ud-SecuredScript-",details.requestScripts.length,"--"].join(""),
                "content":match
              }
              details.requestScripts.push(securedScript);
              return securedScript.id;
            });

            str=ud.send_data_image_to_parser(str,details);


            str= str.replace(/(<style ?.*?>)((.|[\r\n])*?)(<\/style>)/g,(match, g1, g2, g3,g4)=>[g1,ud.edit_str(g2),g4].join(''));

            str=str.replace(/[\s\t]style[\s\t]*?=[\s\t]*?(".*?"|'.*?')/g,(match,g1)=>" style="+ud.edit_str(g1))
            
            str=str.replace(/[\s\t](fill|color|bgcolor)[\s\t]*?=[\s\t]*?("(.*?)"|'(.*?)'|[a-zA-Z0-9#])/g,(match,g1,g2,g3,g4)=>
              {
                var usedcolor=g3||g4;
                var possiblecolor=ud.is_color(usedcolor)
           //     console.log(possiblecolor,g1,usedcolor,ud.attfunc_map[g1],ud.hex_val,(ud.attfunc_map[g1])(...(possiblecolor||[]),ud.hex_val));

             return  [" ",g1,"=",'"',possiblecolor?(ud.attfunc_map[g1])(...possiblecolor,ud.hex_val):usedcolor,'"'].join('')
            }
            )
            
          //  console.log(str);
            //str= str.replace(/(<style ?.*?>)(.*?)(<\/style>)/g,(match, g1, g2,g3)=>{console.log(match);return match});
           // console.log(str.match(/(<style.*?>)(.*?)(<\/)/g),str.match(/<style.{0,300}/g).map(x=>x.slice(0,300)))
            if(details.datacount==1)
            {
              str=ud.inject_inject_css_suggested_tag(str);
              str=str.replace(/(<body.*?url\()(.*?)(["']?\).*?>)/,(match,g1,g2,g3)=>[g1,g2,"#ud-background",g3].join(""))
            }
            str=str.replace(/[\s\t]integrity=/g," nointegrity=")
            details.requestScripts.forEach(securedScript=>{
              str=str.replace(securedScript.id,securedScript.content)
            })
            return str;
          }

          ,
          parse_and_edit_html3:function(str,details){
              
                  //var html_element = document.createElement("html")
                  //html_element.innerHTML=str.replace(/<\/?html.*?>/g,"")
                  var parser = new DOMParser();
                  var html_element = parser.parseFromString(
                    str.replace(/<script.*?>/g,"$&nonExistent();").replace(/&/g,"&UDisabled",/*XSS PROTECTION*/)
                    .replace(/\/\*[\s\S]*?\*\//g,'')
                  , "text/html").documentElement;
                  // The code

                    html_element.querySelectorAll("style").forEach(astyle=>{
                     // astyle.innerHTML=ud.edit_str(astyle.innerHTML);
                    });
                    html_element.querySelectorAll("[style]").forEach(astyle=>{
                    //  astyle.setAttribute("style",ud.edit_str(astyle.getAttribute("style")));
                    });
                    html_element.querySelectorAll("integrity").forEach(anintegrity=>{
                      anintegrity.removeAttribute("integrity")
                    });
                    
                  //
                  var outer_edited = "<!DOCTYPE html>"+html_element.outerHTML.replace(/UDisabled\(?\)?/gi,"")


                  outer_edited = outer_edited.replace(/integrity=/g,"notintegrity=")
                  outer_edited=ud.decodeHtml(outer_edited)
                  console.log(details,str)
                  console.log(details,outer_edited)
                  return outer_edited;
            }
        }
      }
    }
  },
  both: {
    install: function() {
      document.o_createElement = document.createElement;
      window.ud = {
        userSettings:{},
        min: Math.min,
        max: Math.max,
        round: Math.round,
        minbright: 150,
        minbrightbg: 30,
        nonBreakScriptIdent: "§§IDENTIFIER§§",
        maxbright: 255, // Max text brightness
        maxbrightbg: 145, // main bgcolor
        maxbrighttrigger: 135, // nice colors from 135
        logo_light_trigger: 100,
        knownvariables: {},
        rgba_val: function(r, g, b, a) {
          a = typeof a == "number" ? a : 1
          return "rgba(" + (r) + "," + (g) + "," + (b) + "," + (a) + ")"
        },
        hex_val: function(r, g, b, a) {
          a = typeof a == "number" ? a : 1
          return "#"
          +r.toString(16).padStart(2,"0")
          +g.toString(16).padStart(2,"0")
          +b.toString(16).padStart(2,"0")
          +(a==1?"":(a*255).toString(16).padStart(2,"0"))
        },

        set_oricolor: (ori, sri) => "/*ori*" + ori + "*eri*/" + sri + "/*sri*/",
        res_oricolor: x => x.match(/\/\*ori\*(.*?)\*eri\*\//)[1],
        revert_mode2: (x, multiplier) => ud.min(ud.round(x * multiplier), 255),
        rgba_mode1: (x, delta) => ud.max(x - delta, ud.minbrightbg),
        rgba_mode2: (x, multiplier) => ud.max(x * multiplier, ud.minbrightbg),
        rgba_mode3: (x, multiplier) => ud.round(x * multiplier + ud.minbrightbg),
        rgba: function(r, g, b, a,render=false) {
          a = typeof a == "number" ? a : 1
          //  var trigger = ud.max(r,g,b);
          var trigger = (r + g + b) / 3;
          var mincol = ud.min(r, g, b);
          //    if(maxcol<=200){return "rgba("+max(r,200)+","+max(g,200)+","+max(b,200)+","+(a)+")";}
          if (trigger < ud.maxbrighttrigger) {
            //   return ud.rgba_val(...[r,g,b].map(x => x),a); // Keep same dark
            return (render||ud.rgba_val)(...[r, g, b].map(x => x + ud.minbrightbg), a); // Pre Light(better contrast) 
            //  return ud.rgba_val(...[r,g,b].map(x => ud.max(ud.minbrightbg,x)),a); // Set at minimum brightness of background colors
          }
          //         return ud.rgba_val(...[r,g,b].map(x => ud.rgba_mode1(x,maxcol-ud.maxbrightbg)),a);
          // return ud.rgba_val(...[r,g,b].map(x => ud.rgba_mode2(x,ud.maxbrightbg/maxcol)),a);
          //return ud.rgba_val(...[r,g,b].map(x => ud.rgba_mode3(x,(ud.maxbrightbg-ud.minbrightbg)/maxcol)),a);
          //a=ud.min(a,Math.pow((r+g+b)/-3+255,1.25))
          ;
          var delta = mincol;
          var delta2 = ud.min(255 - mincol /*keep original contrast*/ , mincol /*do not revert already dark backgrounds*/ );
          var rgbarr=[r, g, b].map(x => (ud.maxbrightbg - ud.minbrightbg) / 255 * (x - delta) + ud.minbrightbg + delta2);
          rgbarr=rgbarr.map(x=>ud.round(Math.pow(x,1.02))); /*little secret, better contrast*/
          
          return (render||ud.rgba_val)(...rgbarr,a);
          
        },
        revert_rgba: function(r, g, b, a,render) {

          a = typeof a == "number" ? a : 1

          var mincol = ud.min(r, g, b);
         
          if (mincol >= ud.minbright) {
            return (render||ud.rgba_val)(r, g, b, a)
          }
/*
          var rgbarr=[r,g,b].map(x=>(ud.maxbright-ud.minbright)/255*x);
          var maxcol=ud.max(...rgbarr);
          var delta =  ud.maxbright-maxcol;
          return ud.rgba_val(...rgbarr.map(x => Math.round(x+delta)), a)
  */
          //var avg = (r+ g+ b)/3;
          
          var delta = ud.minbright - mincol;
          r = r + delta;
          g = g + delta;
          b = b + delta;
          var multiplier = ud.maxbright / ud.max(r, g, b)
          return (render||ud.rgba_val)(...[r, g, b].map(x => ud.revert_mode2(x, multiplier)), a)
          
        },
        onlyUnique: function(value, index, self) {
          return self.indexOf(value) === index;
        },
        escapeRegExp: function(string) {
          return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
        },
        eget_color: function(anycolor, force1 = "color", force2 = "color") {
          return ud.get_color(force1 + ":" + anycolor, force2)
        },
        get_color: function(colorprop, whatget = "background-color", thespanp = false) {
          if (!ud.userSettings.disable_cache && !thespanp && ud.knownvariables[colorprop + whatget]) {
            return ud.knownvariables[colorprop + whatget];
          }
          var thespan = thespanp || document.o_createElement("meta")
          thespan.style = colorprop
          document.head.appendChild(thespan)
          var style = getComputedStyle(thespan)
          var returnvalue = [...[...(style[whatget].matchAll(/[0-9\.]+/g))].map(x => parseFloat(x)), 1].splice(0, 4)
          thespan.remove();
          if (!ud.userSettings.disable_cache) {
            ud.knownvariables[colorprop + whatget] = returnvalue;
          }
          return returnvalue
        },
        get_inject_css_suggested_tag:x=>"<style id='ud-style'>"+ud.inject_css_suggested+"</style>",
        inject_inject_css_suggested_tag:function(str)
        {
            var head_tag = str.match(/<head ?.*?>/);
            str=head_tag?
              str.replace(head_tag[0],head_tag[0]+ud.get_inject_css_suggested_tag())
              :ud.get_inject_css_suggested_tag()+str
            return str
        },
        is_color: function(possiblecolor) {
          //if(possiblecolor.match(/^(rgba?\([0,.\s\t]+?\))/))
          //{
          //     return possiblecolor.match(/((rgb)|,)/g).map(x=>0)
          // }
          var testresult = ud.eget_color(possiblecolor, "background", "background-color")
          return testresult.filter(x => x).length ? testresult : false
        },
        restore_color: function(str,regex) {
          [...str.matchAll(regex||ud.restoreColorRegex)].forEach(match => {
            str = str.replace(match[0], match[1] + match[2] + ud.set_oricolor(match[4], ud.revert_rgba(...ud.eget_color(match[4]))))
          })
          return str;
        },
        prefix_fg_vars: function(str) { // Must replace important with direct styles
          return str.replace(ud.variableRegex2,"$&!important;--ud-fg$2:/*evi*/$6/*svi*/!important");
        },
        restore_var_color: function(str) { 

          [1,2,3,4,5,6].forEach(x=>{ // C MOCHE
            (str.match(ud.restoreVarRegex)||[])
            .forEach(match=>
              str=str.replace(match,match.replace(/--/g,"--ud-fg--").replace("var(","ud-funcvar(")))
          });
          [...str.matchAll(/\/\*evi\*\/(.*?)\/\*svi\*\//g)].forEach(match=>{
            str=str.replace(match[0],ud.revert_rgba(...ud.eget_color(match[1])))
          })
          return str.replace(/ud-funcvar/g,"var");
        },
        restore_comments: function(str) {
          return str.replace(/\/\*ori.+?eri\*\/|\/\*sri\*\//g, "")
        },
        set_the_round_border: function(str) {
          return str.replace(ud.radiusRegex, "$1;filter:brightness(0.95);box-shadow: 0 0 5px 1px rgba(0,0,0,0)!important;border:1px solid rgba(255,255,255,0.2)!important;$2$7");
        },
        no_repeat_backgrounds: function(str) {
          //    return str.replace(/\/\*(.|\n)*?[^oes][^r][^i]\*\//g,"");
          return str.replace(/(^|[^a-z0-9-])(repeat(-[xy])?)($|["}\n;,)! ])/g, "$1no-repeat;background-color:rgba(0,0,0,0.5);noprop:$4")
        },
        edit_str_named_colors: function(str) {
          [...str.matchAll(ud.colorRegex)].forEach(match => {
            str = str.replace(match[0], match[1] + ud.set_oricolor(match[2], ud.rgba(...ud.eget_color(match[2]))) + match[3])
          })
          return str;
        },
        edit_dynamic_colors: function(str) {
          [1,2,3,4,5,6].forEach(x => { // C MOCHE
            [...str.matchAll(ud.dynamicColorRegex)].forEach(match => {
              newcolor = ud.rgba(...ud.eget_color(match[2])).replace("rgba", "colorfunc");
              str = str.replace(match[0], match[1] + ud.set_oricolor(match[2], newcolor) + match[4])
            })
          })
          return str.replace(/colorfunc/g, "rgba");
        },
        edit_str:function(str)
        {
          str = ud.edit_str_named_colors(str)
          str = ud.edit_dynamic_colors(str)
          str = ud.prefix_fg_vars(str);
          str = ud.restore_var_color(str);
          str = ud.restore_color(str);
          str = ud.restore_comments(str);
          return str; 
        }

      }
      ud.radiusRegex = /(^|[^a-z0-9-])(border-((top|bottom)-(left|right)-)?radius?[\s\t]*?:[\s\t]*?([5-9]|[1-9][0-9]|[1-9][0-9][0-9])[a-zA-Z\s\t%]+)($|["}\n;])/gi,
        ud.variableRegex = /(^|[^a-z0-9-])(--[a-z0-9-]+)[\s\t]*?:[\s\t]*?((#|rgba?)[^"}\n;]*?)[\s\t]*?($|["}\n;])/gi,
        ud.variableRegex2 = /(^|[^a-z0-9-])(--[a-z0-9-]+)([\s\t]*?:)[\s\t]*?((\/\*ori\*(.*?)\*eri\*\/rgb.*?\/\*sri\*\/))/gi,"$&;$2-ud-fg:/*evi*/$6/*svi*/"
        ud.variableBasedRegex = /(^|[^a-z0-9-])var[\s\t]*?\([\s\t]*?(--[a-z0-9-]+)[\s\t]*?\)/gi,
        ud.interventRegex = /(^|[^a-z0-9-])(color|background(-color|-image)?)[\s\t]*?:[\s\t]*?[\n]*?([^;}]*?)([^;}]*?['"].*['"][^;}]*?)*?[\s\t]*?(![\s\t]*?important)?[\s\t]*?($|[;}\n\\])/gi
      // ud.matchStylePart=/{[^{]+}/gi //breaks amazon
      //    ud.dynamicColorRegex=/(#[0-9a-f]{3,8}|(rgb?|hsl)a?\([%0-9, .]+?\))/gi
      //
      ud.dynamicColorRegex = /([:, \n(])(#[0-9a-f]{3,8}|(rgb?|hsl)a?\([%0-9, .]+?\))($|["}\n;,)! ])/gi
      ud.urlBGRegex = /(^|[^a-z0-9-])(background(-image)?)[\s\t]*?:[\s\t]*?(url\(["']?(.+?)["']?\))/g
      ud.restoreColorRegex = /(^|[^a-z0-9-])(color.{1,5}|fill.{1,5})(\/\*ori\*(.*?)\*eri\*\/rgb.*?\/\*sri\*\/)/g
      ud.restoreAnyRegex = /()()(\/\*ori\*(.*?)\*eri\*\/rgb.*?\/\*sri\*\/)/g
      
      ud.restoreVarRegex = /([^a-z0-9-])(color|fill)[\s\t]*?:[\s\t]*?var[\s\t]*?\(.*?($|["}\n;! ])/g
      //ud.matchStylePart=new RegExp(["{[^}]+?((",[ud.radiusRegex,ud.variableRegex,ud.interventRegex ].map(x=>x.source).join(")|("),"))[^}]+?}"].join(""),"gi");
      ud.matchStylePart = /(^|<style.*?>)(.|\n)*?(<\/style>|$)|[^a-z0-9-]style=("(.|\n)+?("|$)|'(.|\n)+?('|$))/g
    }
  },
  misc: {
    monitorBeforeRequest: function(details) {
      //console.log(details.url,details);
      if(details.originUrl && details.originUrl.startsWith("moz-extension://"))
      {
        return{cancel:!details.url.endsWith("#ud-letpass_image")};
      }
      if ((details.documentUrl || details.url).match(ud.userSettings.exclude_regex)) {
        return {}
      }
      if (details.type == "image") {
        return ud.edit_an_image(details);
      }
      let filter = browser.webRequest.filterResponseData(details.requestId);
      let decoder = new TextDecoder("utf-8");
      let encoder = new TextEncoder();
      var headFound,bodyFound = false;
      details.datacount = 0;
      details.writeEnd = "";
      
      filter.ondata = event => {
        details.datacount++
        var str = decoder.decode(event.data, {
          stream: true
        });
        if (details.type == "stylesheet") {
          str = ud.edit_str(str);

          str = ud.send_data_image_to_parser(str, details);
        }
        else if (details.type == "main_frame" || details.type == "sub_frame") {
          // Cant do both
          // Next step would be to truly parse str ;
          details.writeEnd+=str;
          str="";
      }
        filter.write(encoder.encode(str));
        //must not return this closes filter//
      }
      filter.onstop = event => {
        if(details.writeEnd)
        {
          details.datacount=1;
            details.writeEnd=ud.parse_and_edit_html2(details.writeEnd,details)
          
            filter.write(encoder.encode(details.writeEnd));
        }
        filter.disconnect();
      }
      return {}
    }
  }
}
const CSS_COLOR_NAMES = ["AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "DarkOrange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray", "Grey", "Green", "GreenYellow", "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "RebeccaPurple", "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen", ];
const CSS_COLOR_NAMES_RGX = "([:,\\s\\n])(" + (CSS_COLOR_NAMES.join("|")) + ")([,;\\s\\n!\"}]|$)"
dark_object.both.install()
dark_object.background.install()