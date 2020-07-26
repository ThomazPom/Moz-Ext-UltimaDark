
window.dark_object=
{
  foreground:{
    inject:function()
    {
          ud.frontWatch=[["background-color","backgroundColor"]];
          ud.revert_frontWatch=[["color","color"]]
          ud.Inspector = class Inspector {
          constructor(leType, atName,watcher=x=>{},applyOnReturn=x=>{}) {
              var leProto = leType instanceof Function ? leType.prototype : leType
              var originalMethod = leProto[atName]
              var inspectMethod = function() {

                var watcher_result=watcher.apply(null,arguments)
                var callresult = originalMethod.apply(this, arguments)
                var apply_result=applyOnReturn.apply(null,[callresult])
                return callresult;
            }
            if(leProto[atName].name != "inspectMethod")
            {
              leProto[atName] = inspectMethod
            }
            console.log("Now watching",leType.name, originalMethod, "in", document.location.href)
        }
      }

      ud.styleflag="/*watched_ultimadark*/"

      ud.backPoperties=[["background","background-color"],["background-color"]];
      ud.colorProperties=[["color"]];
      ud.propertyEditor=function(aProperty,arule,howto)
      {
        var rulelist = ([arule,...arule.cssRules||[]]).filter(x=>x.style);
        rulelist.forEach(function(arule){
              var propSource = aProperty[0]
              var propDest = aProperty[1]||propSource;
              var value = arule.style[propSource]
              var valueDest = arule.style[propDest]
              if(value && !valueDest.includes(ud.styleflag))
              {
                  howto(propSource,propDest,value,valueDest,arule)
              }
        })
      }
      ud.styleInEdition=[];
      ud.styleEditor=function(astyle)
      {
            if (ud.styleInEdition.includes(astyle)) {
              return;
            }
            ud.styleInEdition.push(astyle);
            [...document.styleSheets].filter(x=>x.ownerNode===astyle).forEach(aSheet=>{      
                  [...(aSheet.rules||aSheet.cssRules)].forEach(arule=>{
                        ud.backPoperties.forEach(aProperty=>{
                            ud.propertyEditor(aProperty,arule,(propSource,propDest,value,valueDest,arule)=>{      
                                var is_color_result = ud.is_color(value)
                                if(is_color_result)
                                {
                                   arule.style[propDest]=ud.rgba(...is_color_result)+ud.styleflag
                                }
                            })
                        })
                        ud.colorProperties.forEach(aProperty=>{
                            ud.propertyEditor(aProperty,arule,(propSource,propDest,value,valueDest,arule)=>{      
                                var is_color_result = ud.is_color(value)
                               // console.log(propSource,propDest,value,valueDest,arule,is_color_result)
                                if(is_color_result)
                                {
                                   arule.style[propDest]=ud.revert_rgba(...is_color_result)+ud.styleflag
                                }
                            })
                        })
                  })
              })
              ud.styleInEdition=ud.styleInEdition.filter(x=>x!=astyle)

      }
      ud.raw_styleEditor=function(astyle)
      {
        astyle.innerHTML= ud.edit_str(astyle.innerHTML)
      }
      ud.styleWatcher=function(){
        [...arguments].forEach(elem=>{
           
                  
            if(elem instanceof HTMLStyleElement && elem.getAttribute("data-ultima")!="ud_style_watched")
            { 
                  
              elem.setAttribute("data-ultima", "ud_style_watched");
                var observer2 = new MutationObserver(mutationreacord=>{
                  ud.styleEditor(elem)
                });
                var innerhtml_config = { characterData: true, attributes: false, childList: true, subtree: true };
                observer2.observe(elem, innerhtml_config);
             
            }

        })
      },
      ud.prototypeEditor=function(leType,atName,watcher=x=>x,conditon=(elem,value)=>1){
          var originalSet = Object.getOwnPropertyDescriptor(leType.prototype, atName).set;
  
          Object.defineProperty(leType.prototype, atName, {
            set: function (value) {
                // change it (ok)
                var new_value = conditon(this,value)?watcher(this,value):value;
                console.log("-",this,"-")
                //Call the original setter
                return originalSet.call(this, new_value);
            }
           });
      }

     // ud.prototypeEditor( Element,    "innerHTML",     ud.frontEditor,     (elem,value)=>elem instanceof HTMLStyleElement       );
    //  new ud.Inspector(Document, "createElement",x=>{},ud.styleWatcher);;
    //  new ud.Inspector(CSSStyleSheet,"addRule",console.log,console.log);

      ud.frontEditor=function(elem,value){
          if(!value.endsWith(ud.styleflag))
          {
            value=value.replace(/((([}\n;])))/g,"$3 ") //Collision with $str
            value = ud.edit_str(value,"foreground")
            elem.innerHTML=[value
            ,ud.styleflag
            ].join("");
          }
      }

      console.log("UltimaDark is loaded");

    }

  },
  background:{

    defaultRegexes:{
      white_list:["<all_urls>","*://*/*","https://*.w3schools.com/*"].join('\n'),
      black_list:["*://example.com/*"].join('\n')
    },


    filterContentScript:function(x){
      return x.match(/<all_urls>|^(https?|wss?|file|ftp|\*):\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^file:\/\/\/.*$|^resource:\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^about:$/)
    },
    setListener:function(){
        browser.storage.local.get(null, function(res) {
            ud.userSettings = res;

            ud.userSettings.properWhiteList = (res.white_list||dark_object.background.defaultRegexes.white_list).split("\n").filter(dark_object.background.filterContentScript)
            ud.userSettings.properBlackList = (res.black_list||dark_object.background.defaultRegexes.black_list).split("\n").filter(dark_object.background.filterContentScript)

            ud.userSettings.exclude_regex=
            (res.black_list||dark_object.background.defaultRegexes.black_list).split("\n")
            .map(x=>x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')  // Sanitize regex
            .replace(/(^<all_urls>|\\\*)/g,"(.*?)") // Allow wildcards
            .replace(/^(.*)$/g,"^$1$")).join("|") // User multi match)

            ud.knownvariables={};
            browser.webRequest.onBeforeRequest.removeListener(dark_object.misc.monitorBeforeRequest);
            if(ud.regiteredCS){ud.regiteredCS.unregister();ud.regiteredCS=null}
            if(!res.disable_webext && ud.userSettings.properWhiteList.length)
            {

                  browser.webRequest.onBeforeRequest.addListener(
                  dark_object.misc.monitorBeforeRequest,
                    {
                      urls : ud.userSettings.properWhiteList,
                      types:["stylesheet","main_frame","sub_frame","image"]
                    },
                    ["blocking"]
                );

              var contentScript = {
                  matches: ud.userSettings.properWhiteList,
                  excludeMatches:ud.userSettings.properBlackList,
                  css : [{file:"override.css"}],
                  runAt: "document_start",
                  matchAboutBlank: true,
                  allFrames: true
                }
              if(!ud.userSettings.properBlackList.length)
              {
                delete contentScript.excludeMatches;
              }
              browser.contentScripts.register(contentScript).then(x=>{ud.regiteredCS=x});
            }
        });      
    },
    install:function(){
        ud.injectscripts=[dark_object.both.install,dark_object.foreground.inject].map(code=>{
          var script=document.createElement("script");
          script.innerHTML="("+code.toString()+")()";
          return script;
        })
        ud.colorRegex=new RegExp(CSS_COLOR_NAMES_RGX,"gi");
        ud.injectscripts_str=ud.injectscripts.map(x=>x.outerHTML).join("")
        
        // Listen for onHeaderReceived for the target page.
        // Set "blocking" and "responseHeaders".
        var portFromCS;
        function connected(p) {
          portFromCS = p;
          portFromCS.onMessage.addListener(function(m) {
            browser.storage.local.set(m,dark_object.background.setListener);
          });
        }
        browser.runtime.onConnect.addListener(connected);
        dark_object.background.setListener();
    }
  },
  both:{
    install:function(){
      document.o_createElement=document.createElement;
      window.ud={
        min:Math.min,
        max:Math.max,
        round:Math.round,
        minbright:200,
        minbrightbg:30,
        nonBreakScriptIdent:"§§IDENTIFIER§§",

        maxbright:255, // Max text brightness
        maxbrightbg:180, // main bgcolor
        maxbrighttrigger:135, // nice colors from 135
        logo_light_trigger:100, 
        knownvariables:{},
        rgba_val:function(r,g,b,a){
          a= typeof a == "number"?a:1
          return "rgba("+(r)+","+(g)+","+(b)+","+(a)+")"
        },
        set_oricolor:(ori,sri)=>"/*ori*"+ori+"*eri*/"+sri+"/*sri*/",
        res_oricolor:x=>x.match(/\/\*ori\*(.*?)\*eri\*\//)[1],
        revert_mode2:(x,multiplier)=>ud.min(ud.round(x*multiplier),255),
        rgba_mode1:(x,delta)=>ud.max(x-delta,ud.minbrightbg),
        rgba_mode2:(x,multiplier)=>ud.max(x*multiplier,ud.minbrightbg),
        rgba_mode3:(x,multiplier)=>ud.round(x*multiplier+ud.minbrightbg),
        rgba:function(r,g,b,a){
            a= typeof a == "number"?a:1
          //  var trigger = ud.max(r,g,b);
            var trigger = (r+g+b)/3;
            var mincol = ud.min(r,g,b);
      
//    if(maxcol<=200){return "rgba("+max(r,200)+","+max(g,200)+","+max(b,200)+","+(a)+")";}
            if(trigger<ud.maxbrighttrigger){
             //   return ud.rgba_val(...[r,g,b].map(x => x),a); // Keep same dark
                return ud.rgba_val(...[r,g,b].map(x => x+ud.minbrightbg),a); // Pre Light(better contrast) 
              //  return ud.rgba_val(...[r,g,b].map(x => ud.max(ud.minbrightbg,x)),a); // Set at minimum brightness of background colors
            }

   //         return ud.rgba_val(...[r,g,b].map(x => ud.rgba_mode1(x,maxcol-ud.maxbrightbg)),a);
           // return ud.rgba_val(...[r,g,b].map(x => ud.rgba_mode2(x,ud.maxbrightbg/maxcol)),a);
            //return ud.rgba_val(...[r,g,b].map(x => ud.rgba_mode3(x,(ud.maxbrightbg-ud.minbrightbg)/maxcol)),a);
            //a=ud.min(a,Math.pow((r+g+b)/-3+255,1.25))
;            var delta = mincol;
            var delta2 = ud.min(255-mincol/*keep original contrast*/,mincol/*do not revert already dark backgrounds*/);
            return ud.rgba_val(...[r,g,b].map(x =>(ud.maxbrightbg-ud.minbrightbg)/255*(x-delta)+ud.minbrightbg+delta2,a));
        },
        revert_rgba:function(r,g,b,a){
            a= typeof a == "number"?a:1
            var mincol = ud.min(r,g,b);
            if(mincol>=ud.minbright){return ud.rgba_val(r,g,b,a)}
      
            var delta = ud.minbright-mincol;
            r=r+delta;g=g+delta;b=b+delta;
            var multiplier = ud.maxbright/ud.max(r,g,b)
            return ud.rgba_val(...[r,g,b].map(x=>ud.revert_mode2(x,multiplier)),a)
        },
        onlyUnique:function(value, index, self) { 
          return self.indexOf(value) === index;
        },
        escapeRegExp:function(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
        },
        eget_color:function(anycolor,force1="color",force2="color")
        {
          return ud.get_color(force1+":"+anycolor,force2)
        },
        get_color:function(colorprop,whatget="background-color",thespanp=false)
        {
          if(!ud.userSettings.disable_cache && !thespanp && ud.knownvariables[colorprop+whatget])
          {
            return ud.knownvariables[colorprop+whatget];
          }
          var thespan = thespanp || document.o_createElement("meta")
          thespan.style=colorprop
          document.head.appendChild(thespan)
          var style = getComputedStyle(thespan)
          var returnvalue = [...[...(style[whatget].matchAll(/[0-9\.]+/g))].map(x=>parseFloat(x)),1].splice(0,4)
          thespan.remove();
          if(!ud.userSettings.disable_cache)
          {
            ud.knownvariables[colorprop+whatget]=returnvalue;  
          }
          return returnvalue
        },
        is_color:function(possiblecolor)
        {
              //if(possiblecolor.match(/^(rgba?\([0,.\s\t]+?\))/))
              //{
           //     return possiblecolor.match(/((rgb)|,)/g).map(x=>0)
             // }
            var testresult = ud.eget_color(possiblecolor,"background","background-color")
            return testresult.filter(x=>x).length?testresult:false
        },
        restore_color:function(str){
          [...str.matchAll(ud.restoreColorRegex)].forEach(match=>{
            str=str.replace(match[0],match[1]+match[2]+ud.set_oricolor(match[4],ud.revert_rgba(...ud.eget_color(match[4])))) 
          })
          return str;
        },
        restore_comments:function(str)
        {
            return str.replace(/\/\*ori.+?eri\*\/|\/\*sri\*\//g,"")
        },
        set_the_round_border:function(str)
        {
            return str.replace(ud.radiusRegex,
          "$1;filter:brightness(0.95);box-shadow: 0 0 5px 1px rgba(0,0,0,0)!important;border:1px solid rgba(255,255,255,0.2)!important;$2$7") ;
        },
        no_repeat_backgrounds:function(str)
        {
      //    return str.replace(/\/\*(.|\n)*?[^oes][^r][^i]\*\//g,"");
            return str.replace(/(^|[^a-z0-9-])(repeat(-[xy])?)($|["}\n;,)! ])/g,"$1no-repeat;background-color:rgba(0,0,0,0.5);noprop:$4")
        },

        edit_background_image_urls  :function(str){

         //  var valueblend=["overlay","multiply","color","exclusion"].join(","); 
         
          return str;
        },
edit_an_image:function(details)
{

 if(!/^https?/.test(details.originUrl))

          {
            return{};
          }
          var theUrl = new URL(details.url);

          if(theUrl.pathname.endsWith(".gif"))
          {
            return;
          }

          return new Promise((resolve, reject) => {

              var canvas = document.createElement('canvas');
              
              var myImage = new Image;
              myImage.src=ud.knownvariables[theUrl.search] || details.url;
              delete ud.knownvariables[theUrl.search];

              var normalresolve = x=>{

                canvas.width = myImage.width;
                canvas.height = myImage.height;
                var context = canvas.getContext('2d');
                context.drawImage(myImage, 0, 0);

                var is_background =  (/footer|background|(bg|box|panel|fond)[._-]/i).test(theUrl.pathname);
              //  console.log(details.url,is_background)
                var islogo = !is_background
                && !theUrl.pathname.endsWith(".jpg")
                && ud.edit_a_logo(context,myImage.width,myImage.height,details);
                
                if(islogo)
                {
                    resolve({ redirectUrl: canvas.toDataURL()});
                }

                if(is_background)
                {

                  ud.edit_a_background(context,myImage.width,myImage.height,0xff)
          
          console.log(details,theUrl,canvas);
                resolve({ redirectUrl: canvas.toDataURL()});
                }
                else
                {
                  resolve({});
                }

            
            }
          myImage.onload= normalresolve;

            myImage.onerror=x=>{
              resolve({})
            }
          setTimeout(x=>resolve({}),1000);
          })

},
edit_a_logo:function(canvasContext, width, height,details) {
      if(width*height<400){ // small images can't be logos
    //    return {};
      }
      let theImageData = canvasContext.getImageData(0, 0, width, height),
      theImageDataBufferTMP = new ArrayBuffer(theImageData.data.length),
      theImageDataClamped8TMP = new Uint8ClampedArray(theImageDataBufferTMP),
      theImageDataUint32TMP = new Uint32Array(theImageDataBufferTMP),
      n = theImageDataUint32TMP.length;
      theImageDataClamped8TMP.set(theImageData.data);

      //    console.log(details,"willresolve")

      var cornerpixs = [0,parseInt(width/2),width*parseInt(height/2)-width,width*parseInt(height/2),n-width,n-parseInt(width/2),n-1]
      //console.log(cornerpixs.map(x=>theImageDataUint32TMP[x]));
      cornerpixs= cornerpixs.map(x=>theImageDataUint32TMP[x]<=0x00ffffff)//superior to 0x00ffffff is not fully alpha
     // console.log(cornerpixs)
      var pixelcount = cornerpixs.reduce((a, b) =>a + b)
      //console.log(pixelcount)

      if(pixelcount<2)
          {
            return false;
          }
      var samplepixels = theImageDataUint32TMP;
      if(ud.sample_mode_active==false)
      {
//          var sampler = 40
  //        var samplepixelscount = Math.round(n/sampler); 
    //      samplepixels = Array.from({length: samplepixelscount}, (x, i) => i*sampler).map(x=>theImageDataUint32TMP[x])
          
          //#was used for globalcol#.map(number=>[number & 0xff,(number >> 8) & 0xff,(number >> 16) & 0xff])
      }
      let unique = [...new Set(samplepixels)];
      //var maxcol = Math.max(...[].concat(...samplepixels));
      //var delta= 255-maxcol // 255 is the future logo brightness inversion; can be configurable
   //   console.log(unique);
      //console.log(details.url,maxcol,n,sampler,samplepixels)
    //  console.log(details.url, unique,unique.length);
          console.log(width,height,
            details.url,
            "alphapix:",pixelcount,
            "unique",unique,
            "fullset",theImageDataUint32TMP,
            "sampleset",samplepixels,theImageData,canvasContext

            )
 
      if(unique.length>600 || unique.length==256 ||unique.indexOf(0)==-1)
      {
        return false;
      }
      var delta2 = unique.indexOf(0x00ffffff)>-1?0:70
      

          imgDataLoop: while (n--) {
      var number = theImageDataUint32TMP[n];
      var r = number & 0xff
      var g = (number >> 8) & 0xff
      var b = (number >> 16) & 0xff
      var a = (number >> 24) & 0xff

      var maxcol=ud.max(r,g,b) // Local max col
      var delta= 255-maxcol// 255 is the future logo brightness; can be configurable
      if(a && (r+g+b)<30 && delta2)
      {
        delta-=delta2; // Experimental : if pic has black and white do not set black entirely white
      }
      r=r+delta;
      g=g+delta;
      b=b+delta;
      var newColor = ((a<<24)) | (b<<16)| (g<<8) | r;
      theImageDataUint32TMP[n] = newColor; 
    }

    theImageData.data.set(theImageDataClamped8TMP);
    canvasContext.putImageData(theImageData, 0, 0);
  return true;
},
edit_a_background:function(canvasContext, width, height,max_a=1) {
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
      var oa= a;


     // var rgbarr = [r,g,b].map(x => ud.maxbrightbg *(x/ud.max(r,g,b)));
      
      //r=ud.max( r-100,0)//rgbarr[0];
      //g=ud.max( g-100,0)//rgbarr[1];
      //b=ud.max( b-100,0)//rgbarr[2];
     // r=rgbarr[0];
      //g=rgbarr[1];
      //b=rgbarr[2];
    //  a=Math.abs(ud.max(r,g,b)-255);
      //a=ud.min(a,(r+g+b)/-3+255); // linear
      a=ud.min(a,Math.pow((r+g+b)/-3+255,1.25)); // pow, solves gradients & keeps colors; 0 means full dark;
      //cant fully alpha : if text is on white(to alpha) div and div on an image, text will be hard to read
      if(a<1)
      {
        r=g=b=ud.minbrightbg;
        a=oa;
       // r=g=b=0;

      }
      var newColor = ((a<<24)) | (b<<16)| (g<<8) | r;
      
      theImageDataUint32TMP[n] = newColor; 
    }
    theImageData.data.set(theImageDataClamped8TMP);
    canvasContext.putImageData(theImageData, 0, 0);
  }
       ,
        send_data_image_to_parser:function(str,details){
           if(str.includes('data:'))
          {

          [...str.matchAll(/(data:image\/.+?)[)'"]/g)].forEach((match,lindex)=>{
          //var id = `https://google.com/favicon.ico?${details.requestId}-${details.datacount}-${lindex}`
         //   var id = "https://google.com/favicon.ico?1=10985-1-1"
            var id=`?data-image=${details.requestId}-${details.datacount}-${lindex}`
            ud.knownvariables[id]=match[1];
            str=str.replace(match[1],'/favicon.ico'+id);
          })

          }
          return str; 
        },
        edit_str_named_colors:function(str){

          [...str.matchAll(ud.colorRegex)].forEach(match=>{
            str=str.replace(match[0],match[1]+ud.set_oricolor(match[2],ud.rgba(...ud.eget_color(match[2])))+match[3]) 
          })
          return str;
        },
        edit_dynamic_colors:function(str){

          [1,2].forEach(x=>{
              [...str.matchAll(ud.dynamicColorRegex)].forEach(match=>{
                newcolor = ud.rgba(...ud.eget_color(match[2])).replace("rgba","colorfunc");
                str=str.replace(match[0],match[1]+ud.set_oricolor(match[2],newcolor)+match[4]) 
              })
          })
          return str.replace(/colorfunc/g,"rgba");
        },
        edit_str:function(strp,source="background"){
          var str = strp;
          str = str.replace(ud.radiusRegex,
          "$1;filter:brightness(0.95);box-shadow: 0 0 5px 1px rgba(0,0,0,0)!important;border:1px solid rgba(255,255,255,0.1)!important;$2$7") ;

          var bgvals= [...str.matchAll(ud.variableRegex)]//OK
          bgvals.forEach(function(bgval){
            var replacestr = bgval[1]
              +bgval[2]+":"+((bgval[3]))+";"
              +bgval[2]+"-fg:"+ud.revert_rgba(...ud.eget_color(bgval[3]))+";"
              +bgval[2]+"-bg:"+ud.rgba(...ud.eget_color(bgval[3]))
              +bgval[5]
            str =str.replace(new RegExp(ud.escapeRegExp(bgval[0]),"g"),replacestr)//OK
          })
          var bgvals=[...str.matchAll(ud.interventRegex)]
         
          var o_strlen=str.length
    
          bgvals.forEach(function(bgval)
          {
            var replacestr=o_str=bgval[0];
            var property=bgval[2];
            var value=bgval[4]||bgval[5]
            var start=bgval[1];
            var important=bgval[6]||"";
            var end=bgval[7];

            if(str.source=="background" && bgval.index+bgval.length==o_strlen && !value.trim().length){
             str=str+"unset;noprop:"
              return;
            }
            var isvarbased = value.match(ud.variableBasedRegex)
            if(value.match(/gradient[\s\t]*?\(/))
            {
              valuebefore=value;
                  value.match(/(rgba?\([0-9,.\s\t]+?\)|#[a-f0-9]{2,8}|[a-z-]+)/gi).forEach(x=>{
                  var is_color_result=ud.is_color(x)
                  if(is_color_result)
                  {
                      value=value.replace(x,ud.rgba(...is_color_result));
                  }

              })
            }
             if(property.startsWith("background") && value.startsWith("url(") && (!value.match(/(logo|icon)/) || value.match(/(background)/)))
            {
              var valueblend=["overlay","multiply","color","exclusion"].join(",");
              var valuedown=[value,value,value,value,value].join(",");// Yaaaay daker backgrounds, keeping colors
              
              replacestr=start+"background-blend-mode:"+valueblend+";"+property+":"+valuedown+important+end
              //console.log(replacestr,o_str)
            }
            else if(isvarbased)
            {
              var suffix = ["background","background-color","background-image"].includes(property)?"-bg":"-fg";
              replacestr=start+property+":"+value.replace(ud.variableBasedRegex,"var($2"+suffix+")")+important+end;
            }
            else if(property=="background-image")
            {
              replacestr=start+property+":"+value+important+end
            }
            else if(property=="background")
            {
              replacestr=start+property+":"+value+";background-color:"+(ud.rgba(...ud.eget_color(value,property,"background-color")))+important+end
    
            }
            else if(property=="background-color")
            {
              replacestr=start+property+":"+(ud.rgba(...ud.eget_color(value,property,property)))+important+end
            }
            else if(["color"].includes(property))
            {
              replacestr=start+property+":"+(ud.revert_rgba(...ud.eget_color(value,property,property)))+important+end
            }
      
            str =str.replace(new RegExp(ud.escapeRegExp(o_str),"g"),replacestr)//OK
          });
          return str;
        }
      }
        ud.radiusRegex=/(^|[^a-z0-9-])(border-((top|bottom)-(left|right)-)?radius?[\s\t]*?:[\s\t]*?([5-9]|[1-9][0-9]|[1-9][0-9][0-9])[a-zA-Z\s\t%]+)($|["}\n;])/gi,
        ud.variableRegex=/(^|[^a-z0-9-])(--[a-z0-9-]+)[\s\t]*?:[\s\t]*?((#|rgba?)[^"}\n;]*?)[\s\t]*?($|["}\n;])/gi,
        ud.variableBasedRegex=/(^|[^a-z0-9-])var[\s\t]*?\([\s\t]*?(--[a-z0-9-]+)[\s\t]*?\)/gi,
        ud.interventRegex=/(^|[^a-z0-9-])(color|background(-color|-image)?)[\s\t]*?:[\s\t]*?[\n]*?([^;}]*?)([^;}]*?['"].*['"][^;}]*?)*?[\s\t]*?(![\s\t]*?important)?[\s\t]*?($|[;}\n\\])/gi
       // ud.matchStylePart=/{[^{]+}/gi //breaks amazon
    //    ud.dynamicColorRegex=/(#[0-9a-f]{3,8}|(rgb?|hsl)a?\([%0-9, .]+?\))/gi
    //
        ud.dynamicColorRegex=/([:, \n(])(#[0-9a-f]{3,8}|(rgb?|hsl)a?\([%0-9, .]+?\))($|["}\n;,)! ])/gi
        ud.urlBGRegex = /(^|[^a-z0-9-])(background(-image)?)[\s\t]*?:[\s\t]*?(url\(["']?(.+?)["']?\))/g
        ud.restoreColorRegex=/(^|[^a-z0-9-])(color.{1,5}|fill.{1,5})(\/\*ori\*(.*?)\*eri\*\/rgb.*?\/\*sri\*\/)/g
        //ud.matchStylePart=new RegExp(["{[^}]+?((",[ud.radiusRegex,ud.variableRegex,ud.interventRegex ].map(x=>x.source).join(")|("),"))[^}]+?}"].join(""),"gi");
        ud.matchStylePart=/(^|<style.*?>)(.|\n)*?(<\/style>|$)|[^a-z0-9-]style=("(.|\n)+?("|$)|'(.|\n)+?('|$))/g
        
    }
  },
  misc:{
    monitorBeforeRequest:function(details) {
        
        if(details.url.match(ud.userSettings.exclude_regex))
        {
          return{}
        }
        if(details.type=="image") 
        {
          return ud.edit_an_image(details);
        }
        let filter = browser.webRequest.filterResponseData(details.requestId);
        let decoder = new TextDecoder("utf-8");
        let encoder = new TextEncoder();
        var headFound = false;
        details.datacount = 0;
        filter.ondata = event => {
            details.datacount++
            var str = decoder.decode(event.data, {stream: true});

            if(details.type=="stylesheet" )
            {

              str=ud.edit_str_named_colors(str)
              str=ud.edit_dynamic_colors(str)
    //   str=ud.edit_background_image_urls(str)
               
              str=ud.restore_color(str)

              str=ud.restore_comments(str)
  //            str=ud.no_repeat_backgrounds(str);
           //   str=ud.set_the_round_border(str);
             // str=ud.edit_background_image_urls(str);
             // if(str.includes("data:image")){
                str=ud.send_data_image_to_parser(str,details);
              //}
     //         str=ud.edit_backgrounds(str,details);
             // //str=str.replace(/([{}\n;])/g,"\t\n\t$1\t\n\t");
              //  str=str.replace(/([{}\n;])/g,"$1 ");  

                //   [...str.matchAll(ud.matchStylePart)].forEach(function(stylepart){            
                  //      str=str.replace(stylepart[0],ud.edit_str(stylepart[0]));
                  //});          
            }
            else if(details.type=="main_frame" || details.type=="sub_frame")
            { 
              str= str.replace(/<font([^>]+)color="/g,'<font$1 style="color:'); ///css4
        
                  str= str.replace(/bgcolor=/g,"");  // css4 too wide
              [...str.matchAll(ud.matchStylePart)].filter(x=>x[0].includes(":")).forEach(function(match)
              {   //matchstylepart breaks amazon
                    var substr=match[0];
                    substr=ud.edit_str_named_colors(substr)
                    substr=ud.edit_dynamic_colors(substr)  
                    substr=ud.restore_color(substr)
                    substr=ud.restore_comments(substr)
                //    if(substr.includes("data:image")){
                      substr=ud.send_data_image_to_parser(substr,details);
                  //  }
//                    substr=ud.no_repeat_backgrounds(substr);
                   // substr=ud.set_the_round_border(substr);
                 //   substr=ud.edit_background_image_urls(substr);
                    
         //     str=ud.edit_backgrounds(str,details);
                    str=str.replace(match[0],substr);

              });

       //str=ud.edit_background_image_urls(str)
              //str=str.replace(/([;{}])/g,"  $1  ");
             // str=str.replace(/([;{])/g,"$1"+ud.nonBreakScriptIdent);
              //str.replace(/<font([^>]*)/,"<span$1") pff ?? no
              str.replace(/<font([^>]+)color="/,'<font$1 style="color:"') ///css4
           //   [...str.matchAll(/(^|[^a-z0-9-])style="[^"]*?("|$)/gi)].forEach(subval=>{
              //    str=str.replace(subval[0],ud.edit_str(subval[0]))
             //     str=str.replace(subval[0],subval[0].replace(/(;)/g,"$1 "))
             // });
//              [...str.matchAll(/<style[^>]*?>.*?(<\/style[^>]*?>|$)/gi)].forEach(subval=>{
             //   str=str.replace(subval[0],subval[0].replace(/(;)/g,"$1 "))
  //            });
        
                 // str=str.replace(/<style(.*?>)/g,'<style onload="" ud-data="ud_broke_style" $1');
                  str= str.replace(/integrity=/g,"nointegrity=");// too wide

                  //[...str.matchAll(ud.matchStylePart)].forEach(function(stylepart){ 
                    //  console.log(!stylepart.match(/(=>|function|return|window|length|typeof)/),stylepart)   
                    //  if(!stylepart[0].match(/=>| if|else|function|return|window|length|typeof/))
                     // {       
                 //       str=str.replace(stylepart[0],ud.edit_str(stylepart[0]));
                      //}
                  //});
            }
            //    str=ud.edit_str(str);


           //   str=str.replace(new RegExp(ud.nonBreakScriptIdent,"g"),"")
         //   if(["main_frame","sub_frame"].includes(details.type) && !headFound && str.includes("head"))//inject foreground script
            //{
             // console.log(str);
           //   headFound=true;
       //      str=str.replace("<head>","<head>"+ud.injectscripts_str)//When using regex replace, care about $1+ presents in injectedscript_str
            //}
              //str=str.replace(/(^|[^a-z0-9-])(color|background(-color)?)[\s\t]*?:[\s\t]*?([^"}\n;]*?)[\s\t]*?![\s\t]*?important[\s\t]*?($|["}\n;])/gi,"$1$2:$4$5");//VERYYOK

      

        filter.write(encoder.encode(str));
        //must not return this closes filter//
      }
      filter.onstop = event => {
        filter.disconnect();
      }
      return{}
    }
  }
}
const CSS_COLOR_NAMES = ["AliceBlue","AntiqueWhite","Aqua","Aquamarine","Azure","Beige","Bisque","Black","BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenRod","DarkGray","DarkGrey","DarkGreen","DarkKhaki","DarkMagenta","DarkOliveGreen","DarkOrange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkSlateGrey","DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick","FloralWhite","ForestGreen","Fuchsia","Gainsboro","GhostWhite","Gold","GoldenRod","Gray","Grey","Green","GreenYellow","HoneyDew","HotPink","IndianRed","Indigo","Ivory","Khaki","Lavender","LavenderBlush","LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenRodYellow","LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen","LightSkyBlue","LightSlateGray","LightSlateGrey","LightSteelBlue","LightYellow","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine","MediumBlue","MediumOrchid","MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","NavajoWhite","Navy","OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink","Plum","PowderBlue","Purple","RebeccaPurple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey","Snow","SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","Wheat","White","WhiteSmoke","Yellow","YellowGreen",];
const CSS_COLOR_NAMES_RGX = "([:,\\s\\n])("+(CSS_COLOR_NAMES.join("|"))+")([,;\\s\\n!\"}]|$)"
dark_object.both.install()
dark_object.background.install()
