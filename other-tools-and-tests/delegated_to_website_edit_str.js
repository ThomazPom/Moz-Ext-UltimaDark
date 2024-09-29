
{ // Was too slow and needed overly complex code to write and also to debug.
     handleCSSChunk(data, verify, details, filter) {
        let str = details.rejectedValues;
        if(data){ str += details.decoder.decode(data,{stream:true}); }
        
        
        let options = { chunk:uDark.idk_cache.get(str) };
        
        if (options.chunk) {
          uDark.idk_cache.delete(str);
          uDark.idk_cache.has(details.tabId) && uDark.idk_cache.get(details.tabId).delete(str);        
          filter.write(details.encoder.encode(options.chunk));
          
          details.countDone+=1;
          return true;
        } 
        
        
        let edit_str_promise = globalThis.browser.tabs.executeScript(details.tabId,{code:
          `
              (function(){
                let details =${JSON.stringify(
          {
            url:details.url,
            tabId:details.tabId,
            frameId:details.frameId,
            originUrl:details.originUrl,
            documentUrl:details.documentUrl,
            requestId:details.requestId,
            dataCount:details.dataCount,
            transientCache: details.transientCache
            
          }
        )};
                let options=${JSON.stringify(options)};
                options.cant_resolve_vars_yet=true;
                let str=uDark.edit_str(${JSON.stringify(str)},false,${JSON.stringify(verify)},details ,false,options);
                if(options.unresolvableStylesheet){
                  if(options.hasUnresolvedVars_idk_vars){
                    console.log("Unresolvable idk vars",options.unresolvableStylesheet.rules);
                  }
                  let rulesArray = [...options.unresolvableStylesheet.cssRules].map(r=>({cssText:r.cssText}));
                  options.unresolvableStylesheet={cssRules:rulesArray};
                }
                delete options.cssStyleSheet;
                return {str,details ,options};
            })();
            `
        ,frameId:details.frameId,allFrames:false,matchAboutBlank:true,runAt:"document_start"})
        .then(promise=>promise).then(result=>result[0]);
        
        
        // options.chunk = uDark.edit_str( str, false, verify, details, false, options);
        
        return edit_str_promise.then(result=>{
          options = result.options;

          details.countDone+=1;
          details.unresolvableChunks=details.unresolvableChunks||result.details||false;
          options.chunk=result.str;
          details.transientCache = result.details.transientCache;
          if (options.chunk.message) {
            details.rejectedValues = str;  // Keep rejected values for later use
            return;
          } else {
            details.rejectedValues = "";
            if (options.chunk.rejected) {
              details.rejectedValues = options.chunk.rejected;
              options.chunk = options.chunk.str;
            }
          }
          options.str_key_cache = str;
          dark_object.misc.chunk_manage_idk_direct(details, options, filter);
          filter.write(details.encoder.encode(options.chunk));
          
        })
      
    },
    editBeforeRequestStyleSheet: function(details) {
      let options = {};
      options.isCorsRequest = dark_object.misc.isCorsRequest(details);
      
      // console.log("Loading CSS", details.url, details.requestId, details.fromCache)
      
      // Util 2024 jan 02 we were checking details.documentUrl, or details.url to know if a stylesheet was loaded in a excluded page
      // Since only CS ports that matches blaclist and whitelist are connected, we can simply check if this resource has a corresponding CS port
      if (!uDark.getPort(details)) {
        // console.log("CSS", "No port found for", details.url, "loaded by webpage:", details.originUrl, "Assuming it is not an eligible webpage, or even blocked by another extension");
        // console.log("If i'm lacking of knowledge, here is what i know about this request", details.tabId, details.frameId);
        return {}
      }
      
      let filter = globalThis.browser.webRequest.filterResponseData(details.requestId); // After this instruction, browser espect us to write data to the filter and close it
      
      let n = details.responseHeaders.length;
      details.headersLow = {}
      while (n--) {
        details.headersLow[details.responseHeaders[n].name.toLowerCase()] = details.responseHeaders[n].value;
      }
      console.log("Will darken", details.url, details.requestId, details.fromCache,details)
      
      details.charset = ((details.headersLow["content-type"] || "").match(/charset=([0-9A-Z-]+)/i) || ["", "utf-8"])[1]
      details.decoder = new TextDecoder(details.charset)
      details.encoder = new TextEncoder();
      details.dataCount = 0;
      details.countDone = 0;
      details.rejectedValues = "";
      
      
      
      // // ondata event handler
      filter.ondata = async event => {
        details.dataCount++;
        dark_object.misc.handleCSSChunk(event.data, true, details, filter);
      };
      
      // onstop event handler
      
      // onstop event handler
      filter.onstop = event => {
        if (details.rejectedValues.length > 0) {
          let handleResult = dark_object.misc.handleCSSChunk(null, false, details, filter);
          // if(handleResult.then){console.log("Closing filter 1"); return handleResult.then(x=>filter.disconnect())}
        }
        
        let intervalClose=setInterval(()=>{
          if(details.countDone>=details.dataCount){
            clearInterval(intervalClose);
            filter.disconnect();  // Ensure disconnection after completion of last chunk
          }
          else{
            console.log("Not closing filter 2",details.countDone,"/",details.dataCount,"for",details.url,details.requestId);
          }
        },100)
          
      };
      // return {redirectUrl:details.url};
      // return {responseHeaders:[{name:"Vary",value:"*"},{name:"Location",value:details.url}]};
      // return {};
      // must not return this closes filter//
    }
}