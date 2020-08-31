window.dark_object = {
  foreground: {
    inject: function() {
        uDark.valuePrototypeEditor = function(leType, atName, watcher = x => x, conditon = (elem, value) => 1) {
       //   console.log(leType,atName)
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
        uDark.functionPrototypeEditor = function(leType, laFonction, watcher = x => x, conditon = (elem, value) => 1,do_on_result=x=>x) {
    //         console.log(leType,leType.name,leType.prototype,laFonction,laFonction.name)
          var originalFunction = Object.getOwnPropertyDescriptor(leType.prototype, laFonction.name).value;
          Object.defineProperty(leType.prototype, "o_ud_"+laFonction.name, {value:originalFunction,writable:true});
          Object.defineProperty(leType.prototype, laFonction.name, 
            {
              value:{[laFonction.name]:function() {
                  if(conditon(this, arguments))
                  {
                    return do_on_result(originalFunction.apply(this, watcher(this, arguments)));
                  }
                  else
                  {
                    return (originalFunction.apply(this, arguments));
                  }
            }}[laFonction.name]
          });
        }
     window.addEventListener('load', (event) => {
          var bodycolor = getComputedStyle(document.body)["backgroundColor"]
          if(bodycolor!="rgba(0, 0, 0, 0)")
          {
            document.head.parentNode.style.o_ud_set_backgroundColor=getComputedStyle(document.body)["backgroundColor"] 
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
        });







//
if(breakpages=false)
{



uDark.valuePrototypeEditor(Element,"className",(elem,value)=>{console.log(elem,value);return "black"})
uDark.valuePrototypeEditor(Element,"classList",(elem,value)=>{console.log(elem,value);return ["black"]})
uDark.valuePrototypeEditor(CSS2Properties,"background-image",(elem,value)=>{console.log(elem,value);return "none"})
/*done*/uDark.valuePrototypeEditor(CSS2Properties,"backgroundColor",(elem,value)=>{console.log(elem,value);return "black"})
/*done*/uDark.valuePrototypeEditor(CSS2Properties,"background-color",(elem,value)=>{console.log(elem,value);return "black"})
/*must add img bg*/uDark.valuePrototypeEditor(CSS2Properties,"background",(elem,value)=>{console.log(elem,value);return "black"})
//uDark.valuePrototypeEditor(Element,"fill",(elem,value)=>{console.log(elem,value);return ["black"]})
/*done*/uDark.valuePrototypeEditor(CSS2Properties,"color",(elem,value)=>{console.log(elem,value);return "lightgreen"})
uDark.functionPrototypeEditor(DOMTokenList,DOMTokenList.prototype.add,(elem,args)=>{console.log(elem,args);return ["yellow"]});

/*done*/uDark.functionPrototypeEditor(CSSStyleSheet,CSSStyleSheet.prototype.addRule,(elem,args)=>{console.log(elem,args); return [".have-border","border: 1px solid black;"]})
/*done*/uDark.functionPrototypeEditor(CSSStyleSheet,CSSStyleSheet.prototype.insertRule,(elem,args)=>{console.log(elem,args); return [".have-border { border: 1px solid black;}",0]})

//Youtube uses this one
uDark.functionPrototypeEditor(CSSStyleDeclaration,CSSStyleDeclaration.prototype.setProperty,(elem,args)=>{console.log(elem,args);return args})

// should not be usefull


uDark.functionPrototypeEditor(DocumentFragment,DocumentFragment.prototype.append,(elem,args)=>{console.log(elem,args); return ["NOAPPEND"]})
uDark.functionPrototypeEditor(Element,Element.prototype.append,(elem,args)=>{console.log(elem,args); return ["NOAPPEND"]})
uDark.functionPrototypeEditor(Document,Document.prototype.append,(elem,args)=>{console.log(elem,args); return ["NOAPPEND"]})
uDark.functionPrototypeEditor(DocumentFragment,DocumentFragment.prototype.prepend,(elem,args)=>{console.log(elem,args); return ["NOAPPEND"]})
uDark.functionPrototypeEditor(Element,Element.prototype.prepend,(elem,args)=>{console.log(elem,args); return ["NOAPPEND"]})
uDark.functionPrototypeEditor(Document,Document.prototype.prepend,(elem,args)=>{console.log(elem,args); return ["NOAPPEND"]})

//Youtube uses this one
uDark.functionPrototypeEditor(CSSStyleDeclaration,CSSStyleDeclaration.prototype.setProperty,(elem,args)=>{console.log(elem,args);return args})

uDark.functionPrototypeEditor(Document,Document.prototype.createElement,function(elem,args){
  //console.log(elem,args,new Error);
  return args},
   (elem,args)=>args[0]=="style",
   (result)=>
   {console.log(result);return result})
}



//experimental zone


//


//UserStyles.org append text nodes to style elements 
uDark.functionPrototypeEditor(Node,Node.prototype.appendChild,(elem,args)=>{(args[0].textContent=uDark.edit_str(args[0].textContent));return args},(elem,value)=>elem instanceof HTMLStyleElement)
uDark.functionPrototypeEditor(Node,Node.prototype.insertBefore,(elem,args)=>{(args[0].textContent=uDark.edit_str(args[0].textContent));return args},(elem,value)=>elem instanceof HTMLStyleElement)


//FINALLY CNN Use this one (webpack)!!!!
uDark.valuePrototypeEditor(Node,"textContent",(elem,value)=>uDark.send_data_image_to_parser(uDark.edit_str(value)),(elem,value)=>elem instanceof HTMLStyleElement)


uDark.valuePrototypeEditor(CSS2Properties,"background",(elem,value)=>{
  let possiblecolor =  uDark.is_color(value);
  return possiblecolor?uDark.rgba(...possiblecolor):value;
  
})


uDark.valuePrototypeEditor(CSSRule,"cssText",(elem,value)=>console.log("CSSTEXT OF",elem,"=>",value)||uDark.edit_str(value))
uDark.valuePrototypeEditor(CSSStyleDeclaration,"cssText",(elem,value)=>console.log("CSSTEXT OF",elem,"=>",value)||uDark.edit_str(value))


uDark.functionPrototypeEditor(CSSStyleSheet,CSSStyleSheet.prototype.addRule,(elem,args)=> [args[0], uDark.edit_str(args[1])])

//Facebook classic uses this one

uDark.functionPrototypeEditor(CSSStyleSheet,CSSStyleSheet.prototype.insertRule,(elem,args)=>[uDark.edit_str(args[0]),args[1]||0])

//W3C uses this one

uDark.valuePrototypeEditor(CSS2Properties,"backgroundColor",(elem,value)=>uDark.rgba(...uDark.eget_color(value)))
uDark.valuePrototypeEditor(CSS2Properties,"background-color",(elem,value)=>uDark.rgba(...uDark.eget_color(value)))
uDark.valuePrototypeEditor(CSS2Properties,"color",(elem,value)=>uDark.revert_rgba(...uDark.eget_color(value)))
uDark.valuePrototypeEditor(HTMLElement,"style",(elem,value)=>uDark.edit_str(value,true),(elem,value)=>!elem.is_easy_get)// Care with "style and eget, this cause recursions"

uDark.valuePrototypeEditor( HTMLElement,"innerText",
  (elem,value)=>{
      return uDark.edit_str(value)
  },(elem,value)=>value && elem instanceof HTMLStyleElement);
//This is the one youtube uses
uDark.valuePrototypeEditor( Element,    "innerHTML", (elem,value)=>{

  if(elem instanceof HTMLStyleElement)
  {
    return uDark.edit_str(value)
  }
     var parser = new DOMParser();
                  var html_element = parser.parseFromString(
                    value//.replace(/&([a-zA-Z0-9#]+?);/g,"&UD-Disabled-$1;",/*XSS PROTECTION*/)
                  .replace(/<noscript ?.*?>.*?<\/noscript>/gi,"")
                    ,"text/html").documentElement;
//value= value.replace(/(<style ?.*?>)((.|[\r\n])*?)(<\/style>)/g,(match, g1, g2, g3,g4)=>[g1,uDark.edit_str(value),g4].join(''))
  //.replace(/[\s\t\r\n]style[\s\t]*?=[\s\t]*?(".*?"|'.*?')/g,(match,g1)=>" style="+uDark.edit_str(g1))
 
  //console.log(value)
html_element.querySelectorAll("style").forEach(astyle=>{
      astyle.innerHTML=uDark.edit_str(astyle.innerHTML);
      astyle.classList.add("ud-edited-background")
      //astyle.innerHTML=uDark.send_data_image_to_parser(astyle.innerHTML,details);
    });
      html_element.querySelectorAll("[style]").forEach(astyle=>{
      //console.log(details,astyle,astyle.innerHTML,astyle.innerHTML.includes(`button,[type="reset"],[type="button"],button:hover,[type="button"],[type="submit"],button:active:hover,[type="button"],[type="submi`))
      astyle.setAttribute("style",uDark.edit_str(astyle.getAttribute("style")));
    });
    return html_element.innerHTML;
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
        uDark.fixedRandom = Math.random();
        browser.webRequest.onHeadersReceived.removeListener(dark_object.misc.editBeforeData);
        browser.webRequest.onBeforeRequest.removeListener(dark_object.misc.editBeforeRequest);
        if (uDark.regiteredCS) {
          uDark.regiteredCS.unregister();
          uDark.regiteredCS = null
        }
        if (!res.disable_webext && uDark.userSettings.properWhiteList.length) {
          browser.webRequest.onHeadersReceived.addListener(dark_object.misc.editBeforeData, {
              urls: uDark.userSettings.properWhiteList,
              types: [ "main_frame", "sub_frame"]
            },
            ["blocking", "responseHeaders"]);
          browser.webRequest.onBeforeRequest.addListener(dark_object.misc.editBeforeRequest, {
              urls: uDark.userSettings.properWhiteList,
              types: ["stylesheet", "image"]
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
        else
          console.log("UD Did not load : ","White list",uDark.userSettings.properWhiteList,"Enabled",!res.disable_webext)
      });
      browser.webRequest.handlerBehaviorChanged().then(x=>console.log(`In-memory cache flushed`),error=>console.log(`Error: ${error}`));
      browser.browsingData.removeCache({}).then(x=>console.log(`Browser cache flushed`),error=>console.log(`Error: ${error}`));

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
          return fetch("inject_css_suggested_no_edit.css").then(res=>res.text())
      })
      .then(str=>{
          uDark.inject_css_suggested+=str;
          return fetch("inject_css_override.css").then(res=>res.text())
      })
      .then(str=>{
          uDark.inject_css_override=uDark.edit_str(str);
          return fetch("inject_css_override_no_edit.css").then(res=>res.text())
      })
      .then(str=>{
          uDark.inject_css_override+=str;
          dark_object.background.setListener()
      })
      
      window.uDark = {
        ...uDark,
        ...{
           headersdo:{
                  "content-security-policy":(x=>{
                    x.value = x.value.replace(/script-src/, "script-src *")
                    x.value = x.value.replace(/default-src/, "default-src *")
                    x.value = x.value.replace(/style-src/, "style-src *")
                      return false;
                    }),
                    "content-type":(x=>{
                      x.value = x.value.replace(/charset=[0-9A-Z-]+/i, "charset=utf-8")
                      return true;
                    }),
                },
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
          get_image_base64: function(details) {

              return new Promise((resolve, reject) => { 

                  var canvas = document.createElement('canvas');
                  var myImage = new Image;
                  var normalresolve=x=>{

                    canvas.width = myImage.width;
                    canvas.height = myImage.height;
                    var context = canvas.getContext('2d');
                    context.drawImage(myImage, 0, 0);
                      resolve({
                        redirectUrl: canvas.toDataURL()
                      });  
                  }
                  myImage.src=details.url;
                  myImage.onload = normalresolve;
                  myImage.onerror = x => {
                    resolve({})
                  }
                  setTimeout(x => resolve({}), 1000);
            });
          },
          edit_an_image: function(details) {
            var theUrl = new URL(details.url);
            details.isDataUrl =theUrl.hostname=="data-image.com"
            if(details.isDataUrl)
            {
              details.dataUrl= details.url.slice(34)
              details.isSvgDataUrl = details.dataUrl.startsWith("data:image/svg+xml;base64,")
            }
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

            if(theUrl.pathname.match(/\.svg$/) || details.isSvgDataUrl)
            {
              return new Promise((resolve, reject) => { //on my way to do a reaaal svg url parsing
                let svgSupport = function(text)
                {
                  var div = document.createElement("div");
                          div.innerHTML=text;
                          document.body.appendChild(div)
                          var svg  = div.querySelector('svg')
                          var {width, height} = svg.getBoundingClientRect(); 
                          div.innerHTML=text.replace("<svg",`<svg width="${width}"  height="${height}" ` );
                          svg  = div.querySelector('svg')
                          var can  = document.createElement("canvas")
                          var ctx  = can.getContext('2d');
                          var sourceImage = new Image;
                          can.width=width;
                          can.height=height;

                           sourceImage.onload = function(){
     //                               console.log(width,height);
                                      ctx.drawImage(sourceImage,0,0,width,height);
                                      div.remove()
                                      //So far  svg'sare only used for logos
                                      var islogo = uDark.edit_a_logo(ctx, width, height, details);
                                      //console.log(details,can.toDataURL())
                                      //img1.src = can.toDataURL();
                                      resolve({redirectUrl:islogo?can.toDataURL():details.dataUrl});
                                    };
                            myImage.onerror = x => {
                                resolve({})
                            }
                            setTimeout(x => resolve({}), 1000);

                            sourceImage.src = uDark.svgDataURL(svg)
                }

                details.isSvgDataUrl?
                svgSupport(atob(details.dataUrl.slice(26)))
                :fetch(details.url).then(response=>response.text()).then(svgSupport)

              })
            }
            else{
                return new Promise((resolve, reject) => {
                  if(details.isDataUrl)
                  {
                    myImage.src=details.dataUrl;
                  }
                  else
                  {
                      myImage.src=details.url;
                  }

                  var normalresolve = x => {

                    //Very small data:images are often used as backgrounds
                    is_background = is_background || details.isDataUrl && (5-myImage.width<0 || 5-myImage.width<0)


                    canvas.width = myImage.width;
                    canvas.height = myImage.height;
                    var context = canvas.getContext('2d');
                    context.drawImage(myImage, 0, 0);

                    //is_background=is_background&&!((/(logo|icon)/i).test(theUrl.pathname+theUrl.search))
                    
                    var islogo = !is_background && uDark.edit_a_logo(context, myImage.width, myImage.height, details);
                    /*&& !theUrl.pathname.endsWith(".jpg") //some websites renames png files in jpg */
                    
                   //   console.log(theUrl,is_background,islogo,theUrl.search.startsWith("?data-image="))
                    
                    
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
                    } else if(details.isDataUrl){
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
                    str//.replace(/&([a-zA-Z0-9#]+?);/g,"&UD-Disabled-$1;",/*XSS PROTECTION*/)
                  .replace(/<noscript ?.*?>.*?<\/noscript>/gi,"")
                    ,"text/html").documentElement;
                  // The code
//              console.log(html_element)

                    //html_element.querySelectorAll("noscript").forEach(anoscript=>{
                    //    anoscript.remove();
                    //});
                    html_element.querySelectorAll("style").forEach(astyle=>{
                      astyle.innerHTML=uDark.edit_str(astyle.innerHTML);
                      astyle.classList.add("ud-edited-background")
                      astyle.innerHTML=uDark.send_data_image_to_parser(astyle.innerHTML,details);
                    });
                    html_element.querySelectorAll("[style]").forEach(astyle=>{
                      //console.log(details,astyle,astyle.innerHTML,astyle.innerHTML.includes(`button,[type="reset"],[type="button"],button:hover,[type="button"],[type="submit"],button:active:hover,[type="button"],[type="submi`))
                      astyle.setAttribute("style",uDark.edit_str(astyle.getAttribute("style")));
                    });
                    html_element.querySelectorAll("img[src*=data]").forEach(image=>{
                      //console.log(html_element,image,uDark.send_data_image_to_parser(image.src,details))
                      image.src=uDark.send_data_image_to_parser(image.src,details)
                    })
                    //I would prefer clear cache one rather than killing it
                    html_element.querySelectorAll("link[rel='stylesheet']")
                    .forEach(x=>x.setAttribute("href",x.getAttribute("href")+"#cachekiller=1"+uDark.fixedRandom)); // 1 as cache killer is better than random :)
                    ///

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
                    
                  
                  var outer_edited = "<!doctype html>"+html_element.outerHTML
                  outer_edited=outer_edited.replace(/[\s\t]integrity=/g," nointegrity=")
          

                  return outer_edited;
            }
        }
      }
    }
  },
  both: {
    install: function() {
      document.o_createElement = document.createElement;
      const CSS_COLOR_NAMES = ["AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "DarkOrange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray", "Grey", "Green", "GreenYellow", "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "RebeccaPurple", "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen", ]
      .sort(function(a, b){  return b.length - a.length;});  // ASC  -> a.length - b.length   // DESC -> b.length - a.length
      const CSS_COLOR_NAMES_RGX = "(" + (CSS_COLOR_NAMES.join("|")) + ")([,;\\s\\n!\"})]|$)"

      window.uDark = {
        userSettings:{},
        colorRegex:new RegExp(CSS_COLOR_NAMES_RGX, "gi"),
        CSS_COLOR_NAMES_RGX:"(" + (CSS_COLOR_NAMES.join("|")) + ")",
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
        background_match:/(footer[^\/\\]*$)|background|(bg|box|panel|fond|fundo)[._-]/i,
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
          return uDark.get_color(force1 + ":" + anycolor, force2,false,anycolor)
        },
        get_color: function(colorprop, whatget = "background-color", thespanp = false,anycolor=false) {
          if(anycolor=="none") // linkedin ???????? does not work
          {
          //  console.log(colorprop)
            //return [0,0,0,0]
          }
          if (!uDark.userSettings.disable_cache && !thespanp && uDark.knownvariables[colorprop + whatget]) {
            return uDark.knownvariables[colorprop + whatget];
          }
          let thespan = thespanp || document.o_createElement("meta")
          thespan.is_easy_get = true; 
          if('o_ud_set_cssText' in thespan.style)
          {
            thespan.style.o_ud_set_cssText=colorprop;
          }
          else{
            thespan.style.cssText=colorprop;
          }
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
          let testresult = uDark.eget_color(possiblecolor, "background", "background-color")
          return testresult.filter(x => x).length ? testresult : false
        },

        restore_all_color: function(str) {
          return str.replace(uDark.restoreAllColorRegex,match=>
            uDark.revert_rgba(...uDark.eget_color(match))
          ).replace(/(^|[^a-z0-9-])--([a-z0-9-])/g,"$1--ud-fg--$2")
        },
        

        restore_color: function(str,regex) {
         // No need to use the restore all as colors are single values or at most var based :)
          return str.replace(uDark.restoreColorRegex,
            (match,g1,g2,g3,g4,g5,g6)=>
            {
              let possiblecolor = uDark.is_color(g3)
              let result = g1+g2+":"
              +(possiblecolor?uDark.revert_rgba(...uDark.eget_color(g3)):
                g3.replace(/--/g,"--ud-fg--"))+g4
              return result
            })
        },
  
        prefix_fg_vars: function(str) { 
          return str.replace(uDark.variableRegex2,(match,g1,g2,g3)=>
          {
            //Fixed : uDark.prefix_fg_vars("{;--scrollbar:rgba(255,255,255,0.2);--highlight-bg:#1c1b1b;--highlight-color:#fff;--highlight-comment:#999;--highlight-punctuation:#ccc;}")
                      //console.log(2,str,3,g1,4,g2,5,g3,6,g4)
           // console.log(match,"\n",g1,"\n",g2,"\n",g3,"\n")
            return g1+g2+":"+uDark.edit_all_dynamic_colors(g3)
            +";--ud-fg"+g2+":"+uDark.restore_all_color(g3)  
            
          })
          
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

        edit_str_named_colors_no_chunk: function(chunk) {
           return chunk.replace(uDark.colorRegex,(match,g1,g2,pos)=>{
                if(!(/[,(:\s\t\r\n]/).test(chunk[pos-1]))
                {
                  return match;
                }
                return uDark.rgba_val(...uDark.eget_color(g1))+g2;
              })
              
         },
        edit_str_named_colors: function(str) {
           return str.replace( new RegExp("{[^{}]*?"+uDark.CSS_COLOR_NAMES_RGX+"[^{}]*}","gis"),chunk=>{
              return chunk.replace(uDark.colorRegex,(match,g1,g2,pos)=>{
                if(!(/[,(:\s\t\r\n]/).test(chunk[pos-1]))
                {
                  return match;
                }
                return uDark.rgba_val(...uDark.eget_color(g1))+g2;
              })
            })  
         },
        edit_dynamic_colors_no_chunk:str=>str.replace(uDark.dynamicColorRegex,(match,g1,g2,g3)=>uDark.rgba(...uDark.eget_color(match))),
        edit_all_dynamic_colors:str=>str.replace(uDark.dynamicAllColorRegex,(match)=>uDark.rgba(...uDark.eget_color(match))),
        edit_dynamic_colors:str=>str.replace( new RegExp("{[^{}]*?}","gis"),uDark.edit_dynamic_colors_no_chunk),
        edit_str:function(str)
        {
          let nochunk = !str.includes("{");
          str = nochunk
            ?uDark.edit_str_named_colors_no_chunk(str)
            :uDark.edit_str_named_colors(str)
          str = uDark.prefix_fg_vars(str);

          str = nochunk
            ?uDark.edit_dynamic_colors_no_chunk(str)
            :uDark.edit_dynamic_colors(str)
          //str = uDark.edit_dynamic_colors(str)
          str = uDark.restore_color(str);
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
          },
          send_data_image_to_parser: function(str, details) {
            if (str.includes('data:')) {
              str=str.replace(/(?<!(base64IMG=))(data:image\/(png|jpe?g|svg\+xml);base64,([^\"]*?))([)'"]|$)/g,"https://data-image.com?base64IMG=$&")
           } 
            return str;
          }

      }
      //uDark.radiusRegex = /(^|[^a-z0-9-])(border-((top|bottom)-(left|right)-)?radius?[\s\t]*?:[\s\t]*?([5-9]|[1-9][0-9]|[1-9][0-9][0-9])[a-zA-Z\s\t%]+)($|["}\n;])/gi,
        uDark.variableRegex2 = /(^|[^a-z0-9-])(--[a-z0-9-]+)(?:[\s\t]*?:)[\s\t]*(([^;}])*)/gi,
        //uDark.variableBasedRegex = /(^|[^a-z0-9-])var[\s\t]*?\([\s\t]*?(--[a-z0-9-]+)[\s\t]*?\)/gi,
       // uDark.interventRegex = /(^|[^a-z0-9-])(color|background(-color|-image)?)[\s\t]*?:[\s\t]*?[\n]*?([^;}]*?)([^;}]*?['"].*['"][^;}]*?)*?[\s\t]*?(![\s\t]*?important)?[\s\t]*?($|[;}\n\\])/gi
        uDark.dynamicColorRegex = /(?<!(^|[^a-z0-9-])(--[a-zA-Z0-9-]+|color|fill)(?:[\s\t]*?:)[\s\t]*?)(#[0-9a-f]{3,8}|(rgb|hsl)a?\([%0-9, .]+?\))/gi // Any color .. if not preceded by color attribute or is not a var() already edited:)
        uDark.dynamicAllColorRegex = /(#[0-9a-f]{3,8}|(rgb|hsl)a?\([%0-9, .]+?\))/gi // Use in proerty values
      
        //uDark.urlBGRegex = /(^|[^a-z0-9-])(background(-image)?)[\s\t]*?:[\s\t]*?(url\(["']?(.+?)["']?\))/g
        uDark.restoreColorRegex = /(^|[^a-z0-9-])(color|fill)[\s\t]*?:[\s\t]*(.+?)($|[;\n\r}!])/g // var edits are done in the prefix 
        uDark.restoreAllColorRegex = /(?:#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([%0-9, .]+?\))/gi // var edit is in the function
        //Variables can use other variables :
        //uDark.restoreVarRegex = /([^a-z0-9-])(--ud-fg--[a-zA-Z0-9]+|color|fill)[\s\t]*?:[\s\t]*?var[\s\t]*?\(.*?($|["}\n;!])/g
        //uDark.matchStylePart=new RegExp(["{[^}]+?((",[uDark.radiusRegex,uDark.variableRegex,uDark.interventRegex ].map(x=>x.source).join(")|("),"))[^}]+?}"].join(""),"gi");
        //uDark.matchStylePart = /(^|<style.*?>)(.|\n)*?(<\/style>|$)|[^a-z0-9-]style=("(.|\n)+?("|$)|'(.|\n)+?('|$))/g
    }
  },
  misc: {
    editBeforeRequest:function(details)
    {
      //console.log(details)
      if(details.originUrl && details.originUrl.startsWith("moz-extension://")||
        (details.documentUrl || details.url).match(uDark.userSettings.exclude_regex)) {
        return {}
      }
      details.isStyleSheet = ["stylesheet"].includes(details.type)
      details.isImage = ["image"].includes(details.type)
      if (details.isImage) {
        return uDark.edit_an_image(details);
      }
      let filter = browser.webRequest.filterResponseData(details.requestId);
      let decoder=new TextDecoder()
      let encoder = new TextEncoder();
      details.datacount = 0;
      filter.ondata = event => {

        details.datacount++
        var str = decoder.decode(event.data, {stream: true});
       
          str = uDark.edit_str(str);
          str = uDark.send_data_image_to_parser(str, details);
          filter.write(encoder.encode(str));
        }
      filter.onstop = event => {
        filter.disconnect(); // Low perf if not disconnected !
      }
        //must not return this closes filter//
      return {}
    },

    editBeforeData: function(details) {
      if(details.originUrl && details.originUrl.startsWith("moz-extension://")||
        (details.documentUrl || details.url).match(uDark.userSettings.exclude_regex)) {
        return {}
      }
      var n = details.responseHeaders.length;
      details.headersLow={}
      while (n--) {
        details.headersLow[details.responseHeaders[n].name.toLowerCase()] = details.responseHeaders[n].value;
      }
      if(!(details.headersLow["content-type"]||"text/").includes("text/")) return {}
      details.charset = ((details.headersLow["content-type"]||"").match(/charset=([0-9A-Z-]+)/i) || ["","utf-8"])[1]
      if(details.url.startsWith("https://data-image.com/?base64IMG="))
      {
        return {redirectUrl:data.url.slice(34)}
      }
      details.responseHeaders= details.responseHeaders.filter(x=>{
          var a_filter= uDark.headersdo[x.name.toLowerCase()];
          return a_filter?a_filter(x):true;
      })
      let filter = browser.webRequest.filterResponseData(details.requestId);
      let decoder=new TextDecoder(details.charset)
      let encoder = new TextEncoder();
      details.datacount = 0;
      details.writeEnd = "";

      filter.ondata = event => {
          details.datacount++
          // Cant do both, next step would be to truly parse str ;
          details.writeEnd+=decoder.decode(event.data, {stream: true});
          //must not return this closes filter//
      }
      filter.onstop = event => {
        details.datacount=1;
        details.writeEnd=uDark.parse_and_edit_html3(details.writeEnd,details)
        filter.write(encoder.encode(details.writeEnd));
        filter.disconnect(); // Low perf if not disconnected !
      }
      return {responseHeaders:details.responseHeaders}
    }
  }
}
dark_object.both.install()
dark_object.background.install()