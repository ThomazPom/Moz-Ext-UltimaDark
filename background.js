window.dark_object = {
  foreground: {
    inject: function() {
      //Object.defineProperty(window,"ud",{value:ud,writable:false})//No script can override ultimadark
      console.log("UltimaDark is loading",window);
      uDark.frontWatch = [
        ["background-color", "backgroundColor"]
      ];
      uDark.revert_frontWatch = [
        ["color", "color"]
      ]
      uDark.Inspector = class Inspector {
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
      uDark.styleflag = "/*watched_ultimadark*/"
      uDark.backPoperties = [
        ["background", "background-color"],
        ["background-color"]
      ];
      uDark.colorProperties = [
        ["color"]
      ];
      uDark.propertyEditor = function(aProperty, arule, howto) {
        var rulelist = ([arule, ...arule.cssRules || []]).filter(x => x.style);
        rulelist.forEach(function(arule) {
          var propSource = aProperty[0]
          var propDest = aProperty[1] || propSource;
          var value = arule.style[propSource]
          var valueDest = arule.style[propDest]
          if (value && !valueDest.includes(uDark.styleflag)) {
            howto(propSource, propDest, value, valueDest, arule)
          }
        })
      }
      uDark.styleInEdition = [];
      uDark.styleEditor = function(astyle) {
        if (uDark.styleInEdition.includes(astyle)) {
          return;
        }
        uDark.styleInEdition.push(astyle);
        [...document.styleSheets].filter(x => x.ownerNode === astyle).forEach(aSheet => {
          [...(aSheet.rules || aSheet.cssRules)].forEach(arule => {
            uDark.backPoperties.forEach(aProperty => {
              uDark.propertyEditor(aProperty, arule, (propSource, propDest, value, valueDest, arule) => {
                var is_color_result = uDark.is_color(value)
                if (is_color_result) {
                  arule.style[propDest] = uDark.rgba(...is_color_result) + uDark.styleflag
                }
              })
            })
            uDark.colorProperties.forEach(aProperty => {
              uDark.propertyEditor(aProperty, arule, (propSource, propDest, value, valueDest, arule) => {
                var is_color_result = uDark.is_color(value)
                // console.log(propSource,propDest,value,valueDest,arule,is_color_result)
                if (is_color_result) {
                  arule.style[propDest] = uDark.revert_rgba(...is_color_result) + uDark.styleflag
                }
              })
            })
          })
        })
        uDark.styleInEdition = uDark.styleInEdition.filter(x => x != astyle)
      }
      uDark.raw_styleEditor = function(astyle) {
        astyle.innerHTML = uDark.edit_str(astyle.innerHTML)
      }
      uDark.styleWatcher = function() {
          [...arguments].forEach(elem => {
            if (elem instanceof HTMLStyleElement && elem.getAttribute("data-ultima") != "ud_style_watched") {
              elem.setAttribute("data-ultima", "ud_style_watched");
              var observer2 = new MutationObserver(mutationreacord => {
                uDark.raw_styleEditor(elem)
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
        uDark.valuePrototypeEditor = function(leType, atName, watcher = x => x, conditon = (elem, value) => 1) {
          var originalSet = Object.getOwnPropertyDescriptor(leType.prototype, atName).set;
          Object.defineProperty(leType.prototype, "o_ud_set_"+atName, {set:originalSet});
          //uDark.knownvariables["o_ud_set_"+atName]=originalSet
          Object.defineProperty(leType.prototype, atName, {
            set: function(value) {
              var new_value = conditon(this, value) ? watcher(this, value) : value;
              return originalSet.call(this, new_value||value);
            }
          });
        }
        uDark.functionPrototypeEditor = function(leType, laFonction, watcher = x => x, conditon = (elem, value) => 1) {
          var originalFunction = Object.getOwnPropertyDescriptor(leType.prototype, laFonction.name).value;
          Object.defineProperty(leType.prototype, "o_ud_"+laFonction.name, {value:originalFunction});
          Object.defineProperty(leType.prototype, laFonction.name, 
            {value:function() {
              //console.log(arguments,conditon(this, arguments),watcher(this.arguments));
              var new_args = conditon(this, arguments) ? watcher(this, arguments) : arguments;
              //console.log(new_args, typeof new_args,typeof watcher(this, arguments),watcher);
              return originalFunction.apply(this, new_args);
          }});
        }
      //  new uDark.Inspector(Document, "createElement",x=>{},uDark.styleWatcher);;
      //  new uDark.Inspector(CSSStyleSheet,"addRule",console.log,console.log);
      uDark.frontEditor = function(elem, value) {
        //if (!value.endsWith(uDark.styleflag)) {
                
          return uDark.edit_str(value)
        //}
      }
      //  uDark.prototypeEditor( Element,    "innerHTML",     uDark.frontEditor,     (elem,value)=>elem instanceof HTMLStyleElement       );
      window.addEventListener('load', (event) => {
          var bodycolor = getComputedStyle(document.body)["backgroundColor"]
          if(bodycolor!="rgba(0, 0, 0, 0)")
          {
            document.head.parentNode.style.backgroundColor=getComputedStyle(document.body)["backgroundColor"] 
          }
          //setInterval(function()
          //{
            var docscrollW = document.body.scrollWidth;
          window.disabled && uDark.getallBgimages(
            document,(elem,url)=>!url.includes("#ud-background")
            && elem.scrollWidth/docscrollW>.4
            && !uDark.background_match.test(url)).forEach(x=>{
              var styleelem = getComputedStyle(x[0]);
              if(styleelem["background-size"].includes(styleelem["width"])){
                x[0].style.backgroundImage="url('"+x[1]+"#ud-background-magic')";
              }
              x[0].setAttribute("ud-backgrounded",1)
            })


          uDark.getallBgimages(
            document,(elem,url)=>
            elem.scrollWidth/docscrollW>.5 // Is a big object
            && !uDark.background_match.test(url) // IS not bacgkgrounded-darken
            ).forEach(x=>{
              
              var styleelem = getComputedStyle(x[0]);

              if(styleelem["background-size"].includes(styleelem["width"])){
                  var stylebefore = getComputedStyle(x[0],":before");
                  var className="ud-background-overlay-"
                  +(stylebefore.backgroundColor=="rgba(0, 0, 0, 0)"?"before":"after")
                  x[0].classList.add(className)
                  x[0].setAttribute("ud-backgrounded",2)
              }
            })

            //uDark.prototypeEditor( Element,    "innerHTML", (elem,value)=>uDark.edit_str(value),     (elem,value)=>elem instanceof HTMLStyleElement       );
          //  new uDark.Inspector(Document, "createElement",console.log,x=>{console.log("this",x,"has been created")});
            //new uDark.Inspector(Document, "createElement",x=>{},uDark.styleWatcher);
            //   new uDark.Inspector(Document, "createElement",console.log,x=>{console.log("this",x,"has been created")});
            //new uDark.Inspector(Node, "appendChild",console.log,x=>{console.log("this",x,"has been append")});
           
            //new uDark.Inspector(Node, "appendChild",console.log,x=>{console.log("this",x,"has been append")});
            //new uDark.Inspector(Element, "append",console.log,x=>{console.log("this",x,"has been append")});
            //new uDark.Inspector(Element, "prepend",console.log,x=>{console.log("this",x,"has been prepend")});
            //new uDark.Inspector(Node, "insertBefore",console.log,x=>{console.log("this",x,"has been prepend")});




//          },2000)
         
        
        });





if(breakpages=false)
{

        uDark.valuePrototypeEditor(CSS2Properties,"backgroundColor",(elem,value)=>{console.log(elem,value);return "black"})
uDark.valuePrototypeEditor(CSS2Properties,"background-color",(elem,value)=>{console.log(elem,value);return "black"})
uDark.valuePrototypeEditor(CSS2Properties,"background",(elem,value)=>{console.log(elem,value);return "black"})

uDark.valuePrototypeEditor(Element,"className",(elem,value)=>{console.log(elem,value);return "black"})
uDark.valuePrototypeEditor(Element,"classList",(elem,value)=>{console.log(elem,value);return ["black"]})
uDark.valuePrototypeEditor(CSS2Properties,"color",(elem,value)=>{console.log(elem,value);return "lightgreen"})
uDark.functionPrototypeEditor(DOMTokenList,DOMTokenList.prototype.add,(elem,args)=>{console.log(elem,args);return ["yellow"]});
uDark.functionPrototypeEditor(Document,Document.prototype.createElement,function(elem,args){return ["span"]},(elem,args)=>args[0]=="style")

uDark.functionPrototypeEditor(CSSStyleSheet,CSSStyleSheet.prototype.addRule,(elem,args)=>{console.log(elem,args); return [".have-border","border: 1px solid black;"]})
uDark.functionPrototypeEditor(CSSStyleSheet,CSSStyleSheet.prototype.insertRule,(elem,args)=>{console.log(elem,args); return [".have-border { border: 1px solid black;}",0]})

uDark.functionPrototypeEditor(DocumentFragment,DocumentFragment.prototype.append,(elem,args)=>{console.log(elem,args); return ["NOAPPEND"]})
uDark.functionPrototypeEditor(Element,Element.prototype.append,(elem,args)=>{console.log(elem,args); return ["NOAPPEND"]})
uDark.functionPrototypeEditor(Document,Document.prototype.append,(elem,args)=>{console.log(elem,args); return ["NOAPPEND"]})
uDark.functionPrototypeEditor(DocumentFragment,DocumentFragment.prototype.prepend,(elem,args)=>{console.log(elem,args); return ["NOAPPEND"]})
uDark.functionPrototypeEditor(Element,Element.prototype.prepend,(elem,args)=>{console.log(elem,args); return ["NOAPPEND"]})
uDark.functionPrototypeEditor(Document,Document.prototype.prepend,(elem,args)=>{console.log(elem,args); return ["NOAPPEND"]})
}
/*
        */
//This is the one youtube uses
uDark.valuePrototypeEditor( Element,    "innerHTML", (elem,value)=>{
  if(elem instanceof HTMLStyleElement)
  {
    return uDark.edit_str(value)
  }
 // console.log(value)
value= value.replace(/(<style ?.*?>)((.|[\r\n])*?)(<\/style>)/g,(match, g1, g2, g3,g4)=>
  [g1,uDark.edit_str(value),g4].join(''))
  .replace(/[\s\t\r\n]style[\s\t]*?=[\s\t]*?(".*?"|'.*?')/g,(match,g1)=>" style="+uDark.edit_str(g1))
    return value;
 },(elem,value)=>value && value.toString().includes('style')
        ||elem instanceof HTMLStyleElement); //toString : sombe object can redefine tostring to generate thzir inner
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
        uDark.userSettings = res;
        uDark.userSettings.properWhiteList = (res.white_list || dark_object.background.defaultRegexes.white_list).split("\n").filter(dark_object.background.filterContentScript)
        uDark.userSettings.properBlackList = (res.black_list || dark_object.background.defaultRegexes.black_list).split("\n").filter(dark_object.background.filterContentScript)
        uDark.userSettings.exclude_regex = (res.black_list || dark_object.background.defaultRegexes.black_list).split("\n").map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Sanitize regex
          .replace(/(^<all_urls>|\\\*)/g, "(.*?)") // Allow wildcards
          .replace(/^(.*)$/g, "^$1$")).join("|") // User multi match)
        uDark.knownvariables = {};
        browser.webRequest.onBeforeRequest.removeListener(dark_object.misc.monitorBeforeRequest);
        if (uDark.regiteredCS) {
          uDark.regiteredCS.unregister();
          uDark.regiteredCS = null
        }
        if (!res.disable_webext && uDark.userSettings.properWhiteList.length) {
          browser.webRequest.onBeforeRequest.addListener(dark_object.misc.monitorBeforeRequest, {
              urls: uDark.userSettings.properWhiteList,
              types: ["stylesheet", "main_frame", "sub_frame", "image"]
            },
            ["blocking"]);
          var contentScript = {
            matches: uDark.userSettings.properWhiteList,
            excludeMatches: uDark.userSettings.properBlackList,

            //js : [{code: uDark.injectscripts_str}],
            css: [{code: uDark.inject_css_override}], // Forced overrides
            runAt: "document_start",
            matchAboutBlank: true,
            allFrames: true
          }
          if (!uDark.userSettings.properBlackList.length) {
            delete contentScript.excludeMatches;
          }
          browser.contentScripts.register(contentScript).then(x => {
            uDark.regiteredCS = x
          });
        }




//////////////////////////////EXPERIMENTAL

browser.webRequest.onHeadersReceived.addListener(function(e){
    var n = e.responseHeaders.length;
    var headersLow={}
    while (n--) {
      headersLow[e.responseHeaders[n].name.toLowerCase()] = e.responseHeaders[n].value;
    }
  uDark.knownvariables["request-headers-"+e.requestId]=headersLow

                var headersdo = {
                  "experimental-content-security-policy":(x=>{
                    x.value = x.value.replace(/script-src/, "script-src *")
                    x.value = x.value.replace(/default-src/, "default-src-src *")
                    x.value = x.value.replace(/style-src/, "style-src *")
                      return true;
                    }),
                    "content-type":(x=>{
                      x.value = x.value.replace(/charset=[0-9A-Z-]+/i, "charset=utf-8")
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
              urls: uDark.userSettings.properWhiteList,
              types: ["main_frame", "sub_frame"]
            },
            ["blocking", "responseHeaders"]);

///////////////////////////////EXPERIMENTAL
















      });
    },
    install: function() {
      uDark.injectscripts = [dark_object.both.install, dark_object.foreground.inject].map(code => {
        var script = document.createElement("script");
        script.innerHTML = "(" + code.toString() + ")()";
        return script;
      })
      //uDark.injectscripts_str = uDark.injectscripts.map(x => x.outerHTML).join("")// Head detection method
      uDark.injectscripts_str = uDark.injectscripts.map(x => x.innerHTML).join(";") // JS injection method
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

          
          uDark.inject_css_suggested=uDark.edit_str(str);
          return fetch("inject_css_override.css")

      })
      .then(res=>res.text())
      .then(str=>{
          uDark.inject_css_override=uDark.edit_str(str);
      })
      .then(x=>dark_object.background.setListener())
      
      window.uDark = {
        ...uDark,
        ...{
          attfunc_map:{
              "fill":uDark.revert_rgba,
              "color":uDark.revert_rgba,
              "bgcolor":uDark.rgba
            },
          edit_background_image_urls: function(str) {
            //  var valueblend=["overlay","multiply","color","exclusion"].join(","); 
            return str;
          },
          svgDataURL:function(svg) {
            var svgAsXML = (new XMLSerializer).serializeToString(svg);
            return "data:image/svg+xml," + encodeURIComponent(svgAsXML);
          },
          edit_an_image: function(details) {
            var theUrl = new URL(details.url);
            if (theUrl.search.includes("ud-bypass_image")
              ||(theUrl.search="" && theUrl.pathname=="/favicon.ico")) {
              return {}; // avoid simple favicons
            }
           
            var is_background = (uDark.background_match).test(theUrl.pathname+theUrl.search);
            is_background = is_background||details.url.includes("#ud-background")
            if (theUrl.pathname.endsWith(".gif") && !is_background && !theUrl.pathname.match(/logo|icon/i)) {
              return {}; // avoid animated gifs
            }
            var canvas = document.createElement('canvas');
            var myImage = new Image;

            if(theUrl.pathname.match(/\.svg$/))
            {
              return new Promise((resolve, reject) => { //on my way to do a reaaal svg url parsing
                fetch(details.url+"#ud-letpass_image")
                    .then(response=>response.text()).then(text=>{
                          var div = document.createElement("div");
                          div.innerHTML=text;
                          document.body.appendChild(div)
                          var svg  = div.querySelector('svg')
                          var {width, height} = svg.getBBox(); 
                          div.innerHTML=text.replace("<svg",`<svg width="${width}"  height="${height}" ` );
                          svg  = div.querySelector('svg')
                          var can  = document.createElement("canvas")
                          var ctx  = can.getContext('2d');
                          var sourceImage = new Image;
                          can.width=width;
                          can.height=height;

                           sourceImage.onload = function(){
                                      ctx.drawImage(sourceImage,0,0,width,height);
                                      div.remove()
                                      //So far  svg'sare only used for logos
                                      var islogo = uDark.edit_a_logo(ctx, width, height, details);
                                      //console.log(details,can.toDataURL())
                                      //img1.src = can.toDataURL();
                                      resolve(islogo?{
                                        redirectUrl: can.toDataURL()
                                      }:{});
                                    };
                            sourceImage.src = uDark.svgDataURL(svg)

                        
                    })
              })
            }
            else{
                return new Promise((resolve, reject) => {
                  var dataImageId=details.url.match(/\?data-image=[0-9-]+/)
                  if(dataImageId)
                  {
                    myImage.src=uDark.knownvariables[dataImageId[0]];
                    delete uDark.knownvariables[dataImageId[0]];
                  }
                  else
                  {
                      myImage.src=details.url+"#ud-letpass_image";
                  }
                  var normalresolve = x => {
                    //Very small data:images are often used as backgrounds
                    is_background = is_background || dataImageId && (myImage.width<5 || myImage.height<5)


                    canvas.width = myImage.width;
                    canvas.height = myImage.height;
                    var context = canvas.getContext('2d');
                    context.drawImage(myImage, 0, 0);

                    //is_background=is_background&&!((/(logo|icon)/i).test(theUrl.pathname+theUrl.search))
                    
                    var islogo = !is_background && uDark.edit_a_logo(context, myImage.width, myImage.height, details);
                    /*&& !theUrl.pathname.endsWith(".jpg") //some websites renames png files in jpg */
                    
                   //   console.log(theUrl,is_background,islogo,theUrl.search.startsWith("?data-image="))
                    
                    //console.log(1,islogo,details.url,myImage.src, is_background,canvas.toDataURL())
                    
                    if (islogo ) {
                      resolve({
                        redirectUrl: canvas.toDataURL()
                      });
                    }
                    else if (is_background) {
                      if(details.url.includes("#ud-background-magic"))
                      {
                        uDark.magic_a_background(context, myImage.width, myImage.height, 0xff)
                      }
                      else
                      {
                        uDark.edit_a_background(context, myImage.width, myImage.height, 0xff)  
                      
                      }
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
              }
          },
          edit_a_logo: function(canvasContext, width, height, details) { // must found a better saturation, less brighness calc
            if (width * height < 50 || width<5 || height < 5) { // small images can't be logos or affect the page
                  //console.log(`${details.url} is too small: ${width} width, ${height} height `)
                  return false;
            }
            //console.log(width,height,details)
            let theImageData = canvasContext.getImageData(0, 0, width, height),
              theImageDataBufferTMP = new ArrayBuffer(theImageData.data.length),
              theImageDataClamped8TMP = new Uint8ClampedArray(theImageDataBufferTMP),
              theImageDataUint32TMP = new Uint32Array(theImageDataBufferTMP),
              n = theImageDataUint32TMP.length;
            theImageDataClamped8TMP.set(theImageData.data);
            //    console.log(details,"willresolve")
            var cornerpixs = [
            0, // 1 top right pixel
            parseInt(width / 2), //2 midle top pixel
            width-1, // 3 top right pixel
            width * parseInt(height / 2) - (width-1), //4
            width * parseInt(height / 2), //5
            n - width, //6
            n - parseInt(width / 2), //7
            n - 1] //8
            //console.log(cornerpixs.map(x=>theImageDataUint32TMP[x]));
            //cornerpixs = cornerpixs.map(x => theImageDataUint32TMP[x] <= 0x00ffffff) //superior to 0x00ffffff is not fully alpha
            cornerpixs = cornerpixs.map(x => theImageDataUint32TMP[x] < 0xff000000) //inferior to 0xff000000 is at least a bit transparent
            // console.log(cornerpixs)
            var pixelcount1 = cornerpixs.slice(0,4).reduce((a, b) => a + b)
            var pixelcount2 = cornerpixs.slice(4).reduce((a, b) => a + b)
            //console.log(pixelcount)


          //  console.log(details.url,pixelcount1,pixelcount1)
            if (!pixelcount1 || !pixelcount2) {

              //console.log(details.url,"is not a logo : not enough trasnparent pixels",cornerpixs,theImageData)
              return false;
            }

            var samplepixels = theImageDataUint32TMP;
            if (uDark.sample_mode_active == false) {
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
              var maxcol = uDark.max(r, g, b) // Local max col
              var delta = 255 - maxcol // 255 is the future logo brightness; can be configurable
              if (delta2 && a && (r + g + b) < 1) {
                delta -= delta2; // Experimental : if pic has black and white do not set black entirely white
              
              }
                       
            r = uDark.min(Math.pow(r + delta,1.05),255);
            g = uDark.min(Math.pow(g + delta,1.05),255);
            b = uDark.min(Math.pow(b + delta,1.05),255); // experimental power up whites in logos; but how much ?

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
          magic_a_background(canvasContext,width,height){
            let theImageData = canvasContext.getImageData(0, 0, width, height),
            colorThreshold = 10,
                  blurRadius = 5,
                  simplifyTolerant = 5,
                  simplifyCount = 300,
                  hatchLength = 4,
                  hatchOffset = 0,
                  imageInfo = null,
                  cacheInd = null,
                  cacheInds = [],      
                  downPoint = null,
                  mask = null,
                  masks = [],
                  allowDraw = false,
                  currentThreshold = colorThreshold;
               var image = {
                  data: theImageData.data,
                  width: theImageData.width,
                  height: theImageData.height,
                  bytes: 4
                };
                //mask = MagicWand.floodFill(image, 0, 0, currentThreshold);
                //mask = MagicWand.gaussBlurOnlyBorder(mask, blurRadius);
                theImageDataBufferTMP = new ArrayBuffer(theImageData.data.length),
                theImageDataClamped8TMP = new Uint8ClampedArray(theImageDataBufferTMP),
                theImageDataUint32TMP = new Uint32Array(theImageDataBufferTMP),
                n = theImageDataUint32TMP.length;
                theImageDataClamped8TMP.set(theImageData.data);
                imgDataLoop: while (n--) {
                  //theImageDataUint32TMP[n]-=0xff000000*mask.data[n]
                  var number = theImageDataUint32TMP[n];
                  var r = number & 0xff
                  var g = (number >> 8) & 0xff
                  var b = (number >> 16) & 0xff
                  var a = (number >> 24) & 0xff
                  //if((r+g+b)/3>200)
                  //{
                    r= uDark.round(r*0.7)
                    g=uDark.round(g*0.7)
                    b=uDark.round(b*0.7)
                  //}
                  var newColor = ((a << 24)) | (b << 16) | (g << 8) | r;
                  theImageDataUint32TMP[n] = newColor;
                  //seems efficient lol
                }

                theImageData.data.set(theImageDataClamped8TMP);
                canvasContext.putImageData(theImageData, 0, 0); 

          }


          ,
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
              // var rgbarr = [r,g,b].map(x => uDark.maxbrightbg *(x/uDark.max(r,g,b)));
              //r=uDark.max( r-100,0)//rgbarr[0];
              //g=uDark.max( g-100,0)//rgbarr[1];
              //b=uDark.max( b-100,0)//rgbarr[2];
              // r=rgbarr[0];
              //g=rgbarr[1];
              //b=rgbarr[2];
              //  a=Math.abs(uDark.max(r,g,b)-255);
              //a=uDark.min(a,(r+g+b)/-3+255); // linear
              a = uDark.min(a, Math.pow((r + g + b) / -3 + 255, 1.25)); // pow, solves gradients & keeps colors; 0 means full dark;
              //cant fully alpha : if text is on white(to alpha) div and div on an image, text will be hard to read
              if (a < 1) {
                r = g = b = uDark.minbrightbg;
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
                uDark.knownvariables[id] = match[1];
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
            substr=uDark.edit_str(substr)
            //    if(substr.includes("data:image")){
            substr = uDark.send_data_image_to_parser(substr, details);

            str = str.replace(o_substr, substr);
          });

          html_element.querySelectorAll("link[rel='icon']").forEach(link=>{
            str=str.replace(link.outerHTML,link.outerHTML.replace(/(href*=".*?)"/,"$1?ud-bypass_image\""))
          })

          html_element.querySelectorAll("[fill],[color],path,[bgcolor]").forEach(coloreditem=>{
            var thecolor
            var o_outer=coloreditem.outerHTML

          for (const [key, afunction] of Object.entries({
              "fill":uDark.revert_rgba,
              "color":uDark.revert_rgba,
              "bgcolor":uDark.rgba
            })) {
                if(uDark.is_color(thecolor=coloreditem.getAttribute(key)))

                coloreditem.setAttribute(
                  key,afunction(...uDark.eget_color(thecolor)))
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
                  str = str.substring(0, position) + "<style id='ud-style'>"+uDark.inject_css_suggested+"</style>"+str.substring(position);
                  //  str += "<style id='ud-style'>"+uDark.inject_css_suggested+"</style>";
                  //  str = str.substring(0, position) + uDark.injectscripts_str+str.substring(position)
                  headFound = true;
                }
                else{
                  /* Non overrride styles */
                  str = "<style id='ud-style'>"+uDark.inject_css_suggested+"</style>"+str;
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

            str=uDark.send_data_image_to_parser(str,details);


            str= str.replace(/(<style ?.*?>)((.|[\r\n])*?)(<\/style>)/g,(match, g1, g2, g3,g4)=>[g1,uDark.edit_str(g2),g4].join(''));

            str=str.replace(/[\s\t]style[\s\t]*?=[\s\t]*?(".*?"|'.*?')/g,(match,g1)=>" style="+uDark.edit_str(g1))
            
            str=str.replace(/[\s\t](fill|color|bgcolor)[\s\t]*?=[\s\t]*?("(.*?)"|'(.*?)'|[a-zA-Z0-9#])/g,(match,g1,g2,g3,g4)=>
              {
                var usedcolor=g3||g4;
                var possiblecolor=uDark.is_color(usedcolor)
           //     console.log(possiblecolor,g1,usedcolor,uDark.attfunc_map[g1],uDark.hex_val,(uDark.attfunc_map[g1])(...(possiblecolor||[]),uDark.hex_val));

             return  [" ",g1,"=",'"',possiblecolor?(uDark.attfunc_map[g1])(...possiblecolor,uDark.hex_val):usedcolor,'"'].join('')
            }
            )
            
          //  console.log(str);
            //str= str.replace(/(<style ?.*?>)(.*?)(<\/style>)/g,(match, g1, g2,g3)=>{console.log(match);return match});
           // console.log(str.match(/(<style.*?>)(.*?)(<\/)/g),str.match(/<style.{0,300}/g).map(x=>x.slice(0,300)))
            if(details.datacount==1)
            {
              str=uDark.inject_inject_css_suggested_tag(str);
              str=str.replace(/(<body.*?url\()(.*?)(["']?\).*?>)/,(match,g1,g2,g3)=>[g1,g2,"#ud-background-darken",g3].join(""))
            }
            str=str.replace(/[\s\t]integrity=/g," nointegrity=")
            details.requestScripts.forEach(securedScript=>{
              str=str.replace(securedScript.id,securedScript.content)
            })
            return str;
          }

          ,
          parse_and_edit_html3:function(str,details){
            details.requestScripts=details.requestScripts||[]
            if(uDark.debugFirstLoad=false)
            {
                      str= str.replace(/(<script ?.*?>)((.|\n)*?)(<\/script>)/g,(match, g1, g2, g3,g4)=>{
                      var securedScript = {
                        "id":["--ud-SecuredScript-",details.requestScripts.length,"_-"].join(""),
                        "content":match
                      }
                      details.requestScripts.push(securedScript);
                      return securedScript.id;
                    });
 
            }
                  //var html_element = document.createElement("html")
                  //html_element.innerHTML=str.replace(/<\/?html.*?>/g,"")
                  var parser = new DOMParser();
                  var html_element = parser.parseFromString(
                    str.replace(/&/g,"&UD-Disabled",/*XSS PROTECTION*/)
                    ,"text/html").documentElement;
                  // The code
//              console.log(html_element)

                    html_element.querySelectorAll("noscript").forEach(anoscript=>{
                        anoscript.remove();
                    });
                    html_element.querySelectorAll("style").forEach(astyle=>{
                      astyle.innerHTML=uDark.edit_str(astyle.innerHTML);
                      astyle.classList.add("ud-edited-background")
                      astyle.innerHTML=uDark.send_data_image_to_parser(astyle.innerHTML,details);
                    });
                    html_element.querySelectorAll("[style]").forEach(astyle=>{
                      astyle.setAttribute("style",uDark.edit_str(astyle.getAttribute("style")));
                    });
                    html_element.querySelectorAll("img[src*='data']").forEach(image=>{
                      image.src=uDark.send_data_image_to_parser(image.src,details)
                    })
                    html_element.querySelectorAll("[fill],[color],path,[bgcolor]").forEach(coloreditem=>{
                    for (const [key, afunction] of Object.entries(uDark.attfunc_map)) {
                        var possiblecolor=uDark.is_color(coloreditem.getAttribute(key))
                        if(possiblecolor)
                        {
                          coloreditem.setAttribute(key,afunction(...possiblecolor,uDark.hex_val))
                        }
                      }
                    })
                    if(details.datacount==1)
                    {
                      var udStyle = document.createElement("style")
                      udStyle.innerHTML=uDark.inject_css_suggested;
                      udStyle.id="ud-style"
                      html_element.querySelector("head").prepend(udStyle);

                      var udScript = document.createElement("script")
                      udScript.innerHTML=uDark.injectscripts_str;
                      udScript.id="ud-script"
                      html_element.querySelector("head").prepend(udScript);
                    }
                    html_element.querySelectorAll("integrity").forEach(anintegrity=>{
                      anintegrity.removeAttribute("integrity")
                    });
                    
                  //
                  var outer_edited = "<!DOCTYPE html>"+html_element.outerHTML
                  outer_edited=outer_edited.replace(/[\s\t]integrity=/g," nointegrity=")

              //console.log(details.requestScripts,outer_edited.match(/.{50}replace\(Zd.{50}/g),outer_edited);
            

                  outer_edited=uDark.decodeHtml(outer_edited).replace(/UD-Disabled/g,"")
                  /*details.requestScripts.forEach(securedScript=>{
                    outer_edited=outer_edited.replace(securedScript.id,securedScript.content)
                  });
                  */
                  return outer_edited;
            }
        }
      }
    }
  },
  both: {
    install: function() {
      document.o_createElement = document.createElement;
      const CSS_COLOR_NAMES = ["AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "DarkOrange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray", "Grey", "Green", "GreenYellow", "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "RebeccaPurple", "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen", ];
      const CSS_COLOR_NAMES_RGX = "([:,\\s\\n])(" + (CSS_COLOR_NAMES.join("|")) + ")([,;\\s\\n!\"}]|$)"

      window.uDark = {
        userSettings:{},
        colorRegex:new RegExp(CSS_COLOR_NAMES_RGX, "gi"),
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
        background_match:/(footer[^\/\\]*$)|background|(bg|box|panel|fond|bck)[._-]/i,
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
        revert_mode2: (x, multiplier) => uDark.min(uDark.round(x * multiplier), 255),
        rgba_mode1: (x, delta) => uDark.max(x - delta, uDark.minbrightbg),
        rgba_mode2: (x, multiplier) => uDark.max(x * multiplier, uDark.minbrightbg),
        rgba_mode3: (x, multiplier) => uDark.round(x * multiplier + uDark.minbrightbg),
        rgba: function(r, g, b, a,render=false) {
          a = typeof a == "number" ? a : 1
          //  var trigger = uDark.max(r,g,b);
          var trigger = (r + g + b) / 3;
          var mincol = uDark.min(r, g, b);
          //    if(maxcol<=200){return "rgba("+max(r,200)+","+max(g,200)+","+max(b,200)+","+(a)+")";}
          if (trigger < uDark.maxbrighttrigger) {
            //   return uDark.rgba_val(...[r,g,b].map(x => x),a); // Keep same dark
            return (render||uDark.rgba_val)(...[r, g, b].map(x => x + uDark.minbrightbg), a); // Pre Light(better contrast) 
            //  return uDark.rgba_val(...[r,g,b].map(x => uDark.max(uDark.minbrightbg,x)),a); // Set at minimum brightness of background colors
          }
          //         return uDark.rgba_val(...[r,g,b].map(x => uDark.rgba_mode1(x,maxcol-uDark.maxbrightbg)),a);
          // return uDark.rgba_val(...[r,g,b].map(x => uDark.rgba_mode2(x,uDark.maxbrightbg/maxcol)),a);
          //return uDark.rgba_val(...[r,g,b].map(x => uDark.rgba_mode3(x,(uDark.maxbrightbg-uDark.minbrightbg)/maxcol)),a);
          //a=uDark.min(a,Math.pow((r+g+b)/-3+255,1.25))
          ;

          var delta = mincol;
          var delta2 = uDark.min(255 - mincol /*keep original contrast*/ , mincol /*do not revert already dark backgrounds*/ );
          var rgbarr=[r, g, b].map(x => (uDark.maxbrightbg - uDark.minbrightbg) / 255 * (x - delta) + uDark.minbrightbg + delta2);
          rgbarr=rgbarr.map(x=>uDark.round(Math.pow(x,1.02))); /*little secret, better contrast*/
          
          return (render||uDark.rgba_val)(...rgbarr,a);
          
        },
        revert_rgba: function(r, g, b, a,render) {

          a = typeof a == "number" ? a : 1

          var mincol = uDark.min(r, g, b);
         
          if (mincol >= uDark.minbright) {
            return (render||uDark.rgba_val)(r, g, b, a)
          }
/*
          var rgbarr=[r,g,b].map(x=>(uDark.maxbright-uDark.minbright)/255*x);
          var maxcol=uDark.max(...rgbarr);
          var delta =  uDark.maxbright-maxcol;
          return uDark.rgba_val(...rgbarr.map(x => Math.round(x+delta)), a)
  */
          //var avg = (r+ g+ b)/3;
          
          var delta = uDark.minbright - mincol;
          r = r + delta;
          g = g + delta;
          b = b + delta;
          var multiplier = uDark.maxbright / uDark.max(r, g, b)
          return (render||uDark.rgba_val)(...[r, g, b].map(x => uDark.revert_mode2(x, multiplier)), a)
          
        },
        onlyUnique: function(value, index, self) {
          return self.indexOf(value) === index;
        },
        escapeRegExp: function(string) {
          return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
        },
        eget_color: function(anycolor, force1 = "color", force2 = "color") {
          return uDark.get_color(force1 + ":" + anycolor, force2)
        },
        get_color: function(colorprop, whatget = "background-color", thespanp = false) {
          if (!uDark.userSettings.disable_cache && !thespanp && uDark.knownvariables[colorprop + whatget]) {
            return uDark.knownvariables[colorprop + whatget];
          }
          var thespan = thespanp || document.o_createElement("meta")
          thespan.style = colorprop
          document.head.appendChild(thespan)
          var style = getComputedStyle(thespan)
          var returnvalue = [...[...(style[whatget].matchAll(/[0-9\.]+/g))].map(x => parseFloat(x)), 1].splice(0, 4)
          thespan.remove();
          if (!uDark.userSettings.disable_cache) {
            uDark.knownvariables[colorprop + whatget] = returnvalue;
          }
          return returnvalue
        },
        get_inject_css_suggested_tag:x=>"<style id='ud-style'>"+uDark.inject_css_suggested+"</style>",
        inject_inject_css_suggested_tag:function(str)
        {
            var head_tag = str.match(/<head ?.*?>/);
            str=head_tag?
              str.replace(head_tag[0],head_tag[0]+uDark.get_inject_css_suggested_tag())
              :uDark.get_inject_css_suggested_tag()+str
            return str
        },
        is_color: function(possiblecolor) {
          //if(possiblecolor.match(/^(rgba?\([0,.\s\t]+?\))/))
          //{
          //     return possiblecolor.match(/((rgb)|,)/g).map(x=>0)
          // }
          if(!possiblecolor)
            {return false}
          var testresult = uDark.eget_color(possiblecolor, "background", "background-color")
          return testresult.filter(x => x).length ? testresult : false
        },
        restore_color: function(str,regex) {
          return str.replace(uDark.restoreColorRegex,
            (match,g1,g2,g3,g4)=>g1+g2+":"+uDark.set_oricolor(g4, uDark.revert_rgba(...uDark.eget_color(g4))))
/*
          [...str.matchAll(regex||uDark.restoreColorRegex)].forEach(match => {
            str = str.replace(match[0], match[1] + match[2] + uDark.set_oricolor(match[4], uDark.revert_rgba(...uDark.eget_color(match[4]))))
          })
          return str;
  */
        },
  
        prefix_fg_vars: function(str) { // Must replace important with direct styles
          return str.replace(uDark.variableRegex2,"$&!important;--ud-fg$2:/*evi*/$6/*svi*/");
        },
        restore_var_color: function(str) { 

          return str.replace(uDark.restoreVarRegex,match=>match.replace(/--/g,"--ud-fg--"))
          .replace(/\/\*evi\*\/(.*?)\/\*svi\*\//g,match=>uDark.revert_rgba(...uDark.eget_color(match)))
          
        },
        restore_comments: function(str) {
          return str.replace(/\/\*ori.+?eri\*\/|\/\*sri\*\//g, "")
        },
        set_the_round_border: function(str) {
          return str.replace(uDark.radiusRegex, "$1;filter:brightness(0.95);box-shadow: 0 0 5px 1px rgba(0,0,0,0)!important;border:1px solid rgba(255,255,255,0.2)!important;$2$7");
        },
        no_repeat_backgrounds: function(str) {
          //    return str.replace(/\/\*(.|\n)*?[^oes][^r][^i]\*\//g,"");
          return str.replace(/(^|[^a-z0-9-])(repeat(-[xy])?)($|["}\n;,)! ])/g, "$1no-repeat;background-color:rgba(0,0,0,0.5);noprop:$4")
        },
        edit_str_named_colors: function(str) {
          return str.replace(uDark.colorRegex,(match,g1,g2,g3)=>g1 + uDark.set_oricolor(g2, uDark.rgba(...uDark.eget_color(g2))) + g3)
         },
        edit_dynamic_colors: function(str) {
          return str.replace(uDark.dynamicColorRegex,(match,g1,g2,g3)=>
              uDark.set_oricolor(g1,uDark.rgba(...uDark.eget_color(g1)))+g3
            )
          /*
          [1,2,3,4,5,6].forEach(x => { // C MOCHE
            [...str.matchAll(uDark.dynamicColorRegex)].forEach(match => {
              newcolor = uDark.rgba(...uDark.eget_color(match[2])).replace("rgba", "colorfunc");
              str = str.replace(match[0], match[1] + uDark.set_oricolor(match[2], newcolor) + match[4])
            })
          })
          return str.replace(/colorfunc/g, "rgba");*/
        },
        edit_str:function(str)
        {
          str = uDark.edit_str_named_colors(str)
          str = uDark.edit_dynamic_colors(str)
          str = uDark.prefix_fg_vars(str);
          str = uDark.restore_var_color(str);
          str = uDark.restore_color(str);
          str = uDark.restore_comments(str);
          //Send css data images to data parser ?
          return str; 
        },
        getallBgimages:function(adocument,acondition=(elem,url)=>true){
           var url, B= [], A= adocument.body.querySelectorAll('*:not([ud-backgrounded])');
           A=B.slice.call(A, 0, A.length);
           while(A.length){
            var C=A.shift()
            url= uDark.deepCss(C,'background-image',adocument);
            if(url) url=/url\(['"]?([^")]+)/.exec(url) || [];
            url= url[1];
            if(url && B.indexOf(url)== -1 && acondition(C,url)) B[B.length]= [C,url];
          }
           return B;
          },

          deepCss:function(who, css,adocument){
           if(!who || !who.style) return '';
           var sty= css.replace(/\-([a-z])/g, function(a, b){
            return b.toUpperCase();
           });
           var dv= adocument.defaultView || window;
           return who.style[sty] || 
           dv.getComputedStyle(who,"").getPropertyValue(css) || '';
          }

      }
      uDark.radiusRegex = /(^|[^a-z0-9-])(border-((top|bottom)-(left|right)-)?radius?[\s\t]*?:[\s\t]*?([5-9]|[1-9][0-9]|[1-9][0-9][0-9])[a-zA-Z\s\t%]+)($|["}\n;])/gi,
        uDark.variableRegex = /(^|[^a-z0-9-])(--[a-z0-9-]+)[\s\t]*?:[\s\t]*?((#|rgba?)[^"}\n;]*?)[\s\t]*?($|["}\n;])/gi,
        uDark.variableRegex2 = /(^|[^a-z0-9-])(--[a-z0-9-]+)([\s\t]*?:)[\s\t]*?((\/\*ori\*(.*?)\*eri\*\/rgb.*?\/\*sri\*\/))/gi,"$&;$2-ud-fg:/*evi*/$6/*svi*/"
        uDark.variableBasedRegex = /(^|[^a-z0-9-])var[\s\t]*?\([\s\t]*?(--[a-z0-9-]+)[\s\t]*?\)/gi,
        uDark.interventRegex = /(^|[^a-z0-9-])(color|background(-color|-image)?)[\s\t]*?:[\s\t]*?[\n]*?([^;}]*?)([^;}]*?['"].*['"][^;}]*?)*?[\s\t]*?(![\s\t]*?important)?[\s\t]*?($|[;}\n\\])/gi
      // uDark.matchStylePart=/{[^{]+}/gi //breaks amazon
      //    uDark.dynamicColorRegex=/(#[0-9a-f]{3,8}|(rgb?|hsl)a?\([%0-9, .]+?\))/gi
      //
      uDark.dynamicColorRegex = /(#[0-9a-f]{3,8}|(rgb?|hsl)a?\([%0-9, .]+?\))([,);\n\r\s\t}!]|$)/gi
      uDark.urlBGRegex = /(^|[^a-z0-9-])(background(-image)?)[\s\t]*?:[\s\t]*?(url\(["']?(.+?)["']?\))/g
      uDark.restoreColorRegex = /(^|[^a-z0-9-])(color|fill)[\s\t]*?:[\s\t]*?(\/\*ori\*(.*?)\*eri\*\/rgb.*?\/\*sri\*\/)/g
      uDark.restoreAnyRegex = /()()(\/\*ori\*(.*?)\*eri\*\/rgb.*?\/\*sri\*\/)/g
      
      //Variables can use other variables :
      uDark.restoreVarRegex = /([^a-z0-9-])(--ud-fg--[a-zA-Z0-9]|color|fill)[\s\t]*?:[\s\t]*?var[\s\t]*?\(.*?($|["}\n;!])/g
      //uDark.matchStylePart=new RegExp(["{[^}]+?((",[uDark.radiusRegex,uDark.variableRegex,uDark.interventRegex ].map(x=>x.source).join(")|("),"))[^}]+?}"].join(""),"gi");
      uDark.matchStylePart = /(^|<style.*?>)(.|\n)*?(<\/style>|$)|[^a-z0-9-]style=("(.|\n)+?("|$)|'(.|\n)+?('|$))/g
    }
  },
  misc: {
    monitorBeforeRequest: function(details) {
      //console.log(details.url,details);
      if(details.originUrl && details.originUrl.startsWith("moz-extension://"))
      {
        return{cancel:!details.url.endsWith("#ud-letpass_image")};
      }
      if ((details.documentUrl || details.url).match(uDark.userSettings.exclude_regex)) {
        return {}
      }
      if (details.type == "image") {
        return uDark.edit_an_image(details);
      }
      let filter = browser.webRequest.filterResponseData(details.requestId);
      let decoder = new TextDecoder();
      let encoder = new TextEncoder();
      details.datacount = 0;
      details.writeEnd = "";
      details.isMainFrame = ["main_frame","sub_frame"].includes(details.type)
      details.isStyleSheet = ["stylesheet"].includes(details.type)
      details.charset = null;

      filter.ondata = event => {
        details.datacount++

        if(details.isMainFrame && decoder.encoding=="utf-8" && details.charset!="utf-8")
        {
          let headers = uDark.knownvariables[ "request-headers-" + details.requestId ];
          details.charset = (headers["content-type"].match(/charset=([0-9A-Z-]+)/i) || ["","utf-8"])[1]
          decoder=new TextDecoder(details.charset)
        }
        var str = decoder.decode(event.data, {
          stream: true
        });
        if (details.isStyleSheet) {
          str = uDark.edit_str(str);

          str = uDark.send_data_image_to_parser(str, details);
        }
        else if (details.isMainFrame) {
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
            details.writeEnd=uDark.parse_and_edit_html3(details.writeEnd,details)
          
            filter.write(encoder.encode(details.writeEnd));
        }
        filter.disconnect();
      }
      return {}
    }
  }
}
dark_object.both.install()
dark_object.background.install()