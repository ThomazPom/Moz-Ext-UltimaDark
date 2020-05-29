
window.dark_object=
{
  foreground:{
    inject:function()
    {
      console.log("LOL IM THERE");
    }

  },
  background:{
    install:function(){
        ud.injectscripts=[dark_object.both.install,dark_object.foreground.inject].map(code=>{
          var script=document.createElement("script");
          script.innerHTML="("+code.toString()+")()";
          return script;
        })
        ud.injectscripts_str=ud.injectscripts.map(x=>x.outerHTML).join("")
        browser.webRequest.onBeforeRequest.removeListener(dark_object.misc.monitorBeforeRequest);
        browser.webRequest.onBeforeRequest.addListener(
          dark_object.misc.monitorBeforeRequest,
            {
              urls : ["<all_urls>"],
              types:["stylesheet","main_frame","sub_frame"]

            },
            ["blocking"]
        );
        // Listen for onHeaderReceived for the target page.
        // Set "blocking" and "responseHeaders".
        var portFromCS;
        function connected(p) {
          portFromCS = p;
          portFromCS.onMessage.addListener(function(m) {
          
          });
        }
        browser.runtime.onConnect.addListener(connected);
    }
  },
  both:{
    install:function(){
      window.ud={
        min:Math.min,
        max:Math.max,
        round:Math.round,
        minbright:200,
        minbrightbg:20,
        maxbright:60, // main bgcolor
        maxbrighttrigger:200,
        knownvariables:{},
        rgba_val:function(r,g,b,a){
          a= typeof a == "number"?a:1
          return "rgba("+(r)+","+(g)+","+(b)+","+(a)+")"
        },
        revert_mode2:(x,multiplier)=>ud.min(ud.round(x*multiplier),255),
        rgba_mode1:(x,delta)=>ud.max(x-delta,ud.minbrightbg),
        rgba_mode2:(x,multiplier)=>ud.max(x*multiplier,ud.minbrightbg),
        rgba_mode3:(x,multiplier)=>ud.round(x*multiplier+ud.minbrightbg),
        rgba:function(r,g,b,a){
            a= typeof a == "number"?a:1
            var maxcol = ud.max(r,g,b);
            if(maxcol<=ud.maxbrighttrigger){
              return ud.rgba_val(...[r,g,b].map(x => ud.max(ud.maxbright,x)),a);
            }
            return ud.rgba_val(...[r,g,b].map(x => ud.rgba_mode1(x,maxcol-ud.maxbright)),a);
           // return ud.rgba_val(...[r,g,b].map(x => ud.rgba_mode2(x,ud.maxbright/maxcol)),a);
          //  return ud.rgba_val(...[r,g,b].map(x => ud.rgba_mode3(x,(ud.maxbright-ud.minbrightbg)/maxcol)),a);
        },
        revert_rgba:function(r,g,b,a){
            a= typeof a == "number"?a:1
            var mincol = ud.min(r,g,b);
            if(mincol>=ud.minbright){return ud.rgba_val(r,g,b,a)}
            
            var delta = ud.minbright-mincol;
            r=r+delta;g=g+delta;b=b+delta;
            var multiplier = 255/ud.max(r,g,b)
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
          if(!thespanp && ud.knownvariables[colorprop+whatget])
          {
            return ud.knownvariables[colorprop+whatget];
          }
          var thespan = thespanp || document.createElement("span")
          thespan.style=colorprop
          document.body.appendChild(thespan)
          var style = getComputedStyle(thespan)
          var returnvalue = [...(style[whatget].matchAll(/[0-9\.]+/g))].map(x=>parseFloat(x))
          thespan.remove();
          ud.knownvariables[colorprop+whatget]=returnvalue;
          return returnvalue
        },
        is_color:function(possiblecolor)
        {
            var testresult = ud.eget_color(possiblecolor,"background","background-color")
            return testresult.filter(x=>x).length?testresult:false
        }
      }
    }
  },
  misc:{
    monitorBeforeRequest:function(details) {
        let filter = browser.webRequest.filterResponseData(details.requestId);
        let decoder = new TextDecoder("utf-8");
        let encoder = new TextEncoder();
        var headFound = false;
        filter.ondata = event => {
            let str = decoder.decode(event.data, {stream: true});
            if(details.type=="stylesheet")
            {
                str=str.replace(/([}\n;])/g,"$1 ")
            }
            else
            {

              //str.replace(/<font([^>]*)/,"<span$1") pff ?? no
              [...str.matchAll(/(^|[^a-z0-9-])style="[^"]*?("|$)/gi)].forEach(subval=>{
                str=str.replace(subval[0],subval[0].replace(/(;)/g,"$1 "))
              });
              [...str.matchAll(/<style[^>]*?>.*?(<\/style[^>]*?>|$)/gi)].forEach(subval=>{
                str=str.replace(subval[0],subval[0].replace(/(;)/g,"$1 "))
              });
              

            }
            //  str=str.replace(/(^|[^a-z0-9-])(color|background(-color)?)[\s\t]*?:[\s\t]*?([^"}\n;]*?)[\s\t]*?![\s\t]*?important[\s\t]*?($|["}\n;])/gi,"$1$2:$4$5");//VERYYOK
            str= str.replace(/integrity/g,"") // too wide
            str= str.replace(/checksum/g,"")  // too wide
            str = str.replace(/(^|[^a-z0-9-])(border-((top|bottom)-(left|right)-)?radius?[\s\t]*?:[\s\t]*?([5-9]|[1-9][0-9]|[1-9][0-9][0-9])[a-zA-Z\s\t%]+)($|["}\n;])/gi,
        "$1;filter:brightness(0.95);box-shadow: 0 0 5px 1px rgba(0,0,0,0)!important;border:1px solid rgba(255,255,255,0.1)!important;$2$7") ;

        var bgvals= [...str.matchAll(/(^|[^a-z0-9-])(--[a-z0-9-]+)[\s\t]*?:[\s\t]*?((#|rgba?)[^"}\n;]*?)[\s\t]*?($|["}\n;])/gi )]//OK
        bgvals.forEach(function(bgval){
          var replacestr = bgval[1]
            +bgval[2]+":"+((bgval[3]))+";"
            +bgval[2]+"-fg:"+ud.revert_rgba(...ud.eget_color(bgval[3]))+";"
            +bgval[2]+"-bg:"+ud.rgba(...ud.eget_color(bgval[3]))
            +bgval[5]
          str =str.replace(new RegExp(ud.escapeRegExp(bgval[0]),"g"),replacestr)//OK
        })
        var bgvals=[...str.matchAll(/(^|[^a-z0-9-])(color|background(-color|-image)?)[\s\t]*?:[\s\t]*?([^"}\n;]*?)[\s\t]*?(![\s\t]*?important)?[\s\t]*?($|["}\n;\\])/gi)]
        var varbasedrgx =  /(^|[^a-z0-9-])var[\s\t]*?\([\s\t]*?(--[a-z0-9-]+)[\s\t]*?\)/gi;
        var o_strlen=str.length
        bgvals.forEach(function(bgval)
      {
        var replacestr=o_str=bgval[0];
        var property=bgval[2];
        var value=bgval[4]
        var start=bgval[1];
        var important=bgval[5]||"";
        var end=bgval[6];
        if(bgval.index+bgval.length==o_strlen && !value.trim().length){
         str=str+"unset;noprop:"
          return;
        }
        var isvarbased = value.match(varbasedrgx)
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
        if(isvarbased)
        {
          var suffix = ["background","background-color","background-image"].includes(property)?"-bg":"-fg";
          replacestr=start+property+":"+value.replace(varbasedrgx,"var($2"+suffix+")")+important+end;
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
        if(["main_frame","sub_frame"].includes(details.type) && !headFound && str.match(/<head>/))//inject foreground script
        {
          headFound=true;
          str=str.replace(/(<head>)/,"$1"+ud.injectscripts_str)
        }


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
dark_object.both.install()
dark_object.background.install()




/*

var min=Math.min;
var max=Math.max;

var minbright=200;
var minbrightbg=20;
var maxbright=60;
var maxbrighttigger=200;
var rgba_val=function(r,g,b,a){

    a= typeof a == "number"?a:1
    return "rgba("
                    +(r)+","
                    +(g)+","
                    +(b)+","
                    +(a)+")"
}
var rgba=function(r,g,b,a){
    a= typeof a == "number"?a:1
    var maxcol = max(r,g,b);
   // if(maxcol<=maxbrighttigger){return "rgba("+max(r,minbrightbg)+","+max(r,minbrightbg)+","+max(r,minbrightbg)+","+(a)+")";}
    var delta = maxcol-maxbright;
    r=r-delta;g=g-delta;b=b-delta
    return "rgba("
                    +max(r,minbrightbg)+","
                    +max(g,minbrightbg)+","
                    +max(b,minbrightbg)+","
                    +(a)+")"
}
var revert_rgba=function(r,g,b,a){
    a= typeof a == "number"?a:1
    var mincol = min(r,g,b);
    if(mincol>=minbright){return "rgba("+r+","+g+","+b+","+(a)+")"}
    var delta = minbright-mincol;

    r=r+delta;g=g+delta;b=b+delta;

  var multiplier = 255/max(r,g,b)
    return "rgba("
                    +min(parseInt(r*multiplier),255)+","
                    +min(parseInt(g*multiplier),255)+","
                    +min(parseInt(b*multiplier),255)+","
                    +(a)+")"
}
var myStyleElement = document.createElement("style")



function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}



function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

eget_color=
function(anycolor,force1="color",force2="color")
{
  return get_color(force1+":"+anycolor,force2)
}

var get_color=function(colorprop,whatget="background-color",thespanp=false)
{

  if(!thespanp && knownvariables[colorprop+whatget])
  {
    return knownvariables[colorprop+whatget];
  }
  var thespan = thespanp || document.createElement("span")
  thespan.style=colorprop
  document.body.appendChild(thespan)
  style = getComputedStyle(thespan)

  var returnvalue = [...(style[whatget].matchAll(/[0-9\.]+/g))].map(x=>parseFloat(x))
    thespan.remove();
    knownvariables[colorprop+whatget]=returnvalue;
    return returnvalue
}
var is_color =function(possiblecolor)
{
    var testresult = eget_color(possiblecolor,"background","background-color")
    return testresult.filter(x=>x).length?testresult:false
}
var knownvariables ={

}
/*
function monitorBeforeRequest(details) {

  let filter = browser.webRequest.filterResponseData(details.requestId);
  let decoder = new TextDecoder("utf-8");
  let encoder = new TextEncoder();

  filter.ondata = event => {



    let str = decoder.decode(event.data, {stream: true});

      if(str.includes(".sticky-navbar.navbar"))
      {
        console.log(str);
      }
    if(details.type=="stylesheet")
    {
      str=str.replace(/([}\n;])/g,"$1 ")


    }
    else
    {

      //str.replace(/<font([^>]*)/,"<span$1") pff ?? no
      [...str.matchAll(/(^|[^a-z0-9-])style="[^"]*?("|$)/gi)].forEach(subval=>{
        str=str.replace(subval[0],subval[0].replace(/(;)/g,"$1 "))
      });
      [...str.matchAll(/<style[^>]*?>.*?(<\/style[^>]*?>|$)/gi)].forEach(subval=>{
        str=str.replace(subval[0],subval[0].replace(/(;)/g,"$1 "))
      });
    }
  
//    console.log(str);
  //  str=str.replace(/(^|[^a-z0-9-])(color|background(-color)?)[\s\t]*?:[\s\t]*?([^"}\n;]*?)[\s\t]*?![\s\t]*?important[\s\t]*?($|["}\n;])/gi,"$1$2:$4$5");//VERYYOK
    str= str.replace(/integrity/g,"") // too wide
      str= str.replace(/checksum/g,"")  // too wide

      str = str.replace(/(^|[^a-z0-9-])(border-((top|bottom)-(left|right)-)?radius?[\s\t]*?:[\s\t]*?([5-9]|[1-9][0-9]|[1-9][0-9][0-9])[a-zA-Z\s\t%]+)($|["}\n;])/gi,
        "$1;filter:brightness(0.95);box-shadow: 0 0 5px 1px rgba(0,0,0,0)!important;border:1px solid rgba(255,255,255,0.1)!important;$2$7") ;



  



       var bgvals= [...str.matchAll(/(^|[^a-z0-9-])(--[a-z0-9-]+)[\s\t]*?:[\s\t]*?((#|rgba?)[^"}\n;]*?)[\s\t]*?($|["}\n;])/gi )]//OK
       bgvals.forEach(function(bgval){
          var replacestr = bgval[1]
            +bgval[2]+":"+((bgval[3]))+";"
            +bgval[2]+"-fg:"+revert_rgba(...eget_color(bgval[3]))+";"
            +bgval[2]+"-bg:"+rgba(...eget_color(bgval[3]))
            +bgval[5]
          str =str.replace(new RegExp(escapeRegExp(bgval[0]),"g"),replacestr)//OK
        })


     var bgvals=[...str.matchAll(/(^|[^a-z0-9-])(color|background(-color|-image)?)[\s\t]*?:[\s\t]*?([^"}\n;]*?)[\s\t]*?(![\s\t]*?important)?[\s\t]*?($|["}\n;\\])/gi)]

      var varbasedrgx =  /(^|[^a-z0-9-])var[\s\t]*?\([\s\t]*?(--[a-z0-9-]+)[\s\t]*?\)/gi;
      var o_strlen=str.length
      bgvals.forEach(function(bgval)
      {
      //  console.log(bgval);
        var replacestr=o_str=bgval[0];
        var property=bgval[2];
        var value=bgval[4]
        var start=bgval[1];
        var important=bgval[5]||"";
        var end=bgval[6];
       // console.log(!value.trim().length,bgval.index+bgval.length==str.length,bgval.index,bgval.length,str.length)

        // 
        if(bgval.index+bgval.length==o_strlen && !value.trim().length){
         // console.log("VALUE IS EMPTY",value,bgval,str.length)
         str=str+"unset;noprop:"
          return;
       //   str = [str.slice(0, bgval.index+1), "not", str.slice(bgval.index+1)].join('');
         // return;
        }
        var isvarbased = value.match(varbasedrgx)
        if(value.match(/gradient[\s\t]*?\(/))
        {
          value.match(/(rgba?\([0-9,.\s\t]+?\)|#[a-f0-9]{2,8}|[a-z-]+)/gi).forEach(x=>{
            
              var is_color_result=is_color(x)
              if(is_color_result)
              {
                  valuebefore=value;
                  value=value.replace(x,rgba(...is_color_result));
          //        console.log(valuebefore,value,x);
              }

          })
        }
        if(isvarbased)
        {
          var suffix = ["background","background-color","background-image"].includes(property)?"-bg":"-fg";
          replacestr=start+property+":"+value.replace(varbasedrgx,"var($2"+suffix+")")+important+end;
        }

        else if(property=="background-image")
        {

          replacestr=start+property+":"+value+important+end
        }
        else if(property=="background")
        {
          replacestr=start+property+":"+value+";background-color:"+(rgba(...eget_color(value,property,"background-color")))+important+end
        }
        else if(property=="background-color")
        {

          replacestr=start+property+":"+(rgba(...eget_color(value,property,property)))+important+end
          //console.log(replacestr,o_str);
        }
        else if(["color"].includes(property))
        {
          replacestr=start+property+":"+(revert_rgba(...eget_color(value,property,property)))+important+end
         
        }

       //   console.log("-",o_str,"-",replacestr,"-",str.includes(o_str))
        str =str.replace(new RegExp(escapeRegExp(o_str),"g"),replacestr)//OK
//        console.log(bgval);   
      });
    	filter.write(encoder.encode(str));
      //must not return this closes filter//
   }
  filter.onstop = event => {
    filter.disconnect();
  }
  	//return {requestBody: e.responseHeaders};
  	return{}
}
browser.webRequest.onBeforeRequest.removeListener(monitorBeforeRequest)
browser.webRequest.onBeforeRequest.addListener(
	monitorBeforeRequest,
	{urls : ["<all_urls>"],
	types:["stylesheet","main_frame","sub_frame"]

},
	["blocking"]
);
// Listen for onHeaderReceived for the target page.
// Set "blocking" and "responseHeaders".
var portFromCS;
function connected(p) {
	portFromCS = p;
	portFromCS.onMessage.addListener(function(m) {
	});
}
browser.runtime.onConnect.addListener(connected);
*/