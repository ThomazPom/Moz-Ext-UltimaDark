
class Listeners {
  static cancelPopupXHRCalls(details) {
    if(details.tabId == uDark.popupTabId ) {
      console.log("Canceling popup XHR call",details.url,details);
      // message to popup, we fund his friend
      uDark.connected_cs_ports["port-from-popup-" + details.tabId].postMessage({
        cancelPopupXHRCalls: true,
        url:details.url
      });
      return {cancel: true};
    }
  }
  static editOnHeadersImage(details) {
    // Util 2024 jan 02 we were checking details.documentUrl, or details.url to know if a stylesheet was loaded in a excluded page
    // Since only CS ports that matches blaclist and whitelist are connected, we can simply check if this resource has a corresponding CS port
    if (!uDark.getPort(details)) {
      // uDark.log("Image","No port found for",details.url,"loaded by webpage:",details.originUrl,"Assuming it is not an eligible webpage, or even blocked by another extension");
      return {}
    }
    // now in 2025 we can exclude all res or image res
    if( details.url.match(uDark.userSettings.exclude_regexRes) || details.url.match(uDark.userSettings.exclude_regexImgr)) {
      // uDark.log("Image","This image is excluded by the user settings",details.url,"loaded by webpage:",details.originUrl,"Assuming it is not an eligible webpage, or even blocked by another extension");
      return {}
    }
    // now in 2025 we van exclude all image from site
    if (details.documentUrl.match(uDark.userSettings.exclude_regexImg)) {
      return {}
    }

    let imageURLObject = new URL(details.url);
    details.headersLow = {}
    
    uDark.extractCharsetFromHeaders(details, "image/png",);
    details.isSVGImage = details.contentType.includes("image/svg");
    
    // Determine if the image deserves to be edited
    if (imageURLObject.pathname.startsWith("/favicon.ico") || imageURLObject.hash.endsWith("#ud_favicon")) {
      return {};
    }
    let {is_enforced_nobody} = uDark.getNoBodyStatus(details);
    if (is_enforced_nobody) {
      return {}; // We cannot edit this request: either it has no body, or it's empty because unmodified, so the webRequestFilter will receive an already edited content from the cache
    }
    let filter = globalThis.browser.webRequest.filterResponseData(details.requestId); // After this instruction, browser espect us to write data to the filter and close it
    let imageWorker;
    let secureTimeout = setTimeout(() => {
      try {
        filter.disconnect();
        imageWorker && imageWorker.terminate();
      } catch (e) {}
    }, 30000) // Take care of very big images 
    details.buffers = details.buffers || [];
    if (details.isSVGImage) {
      filter.ondata = event => details.buffers.push(event.data);
      let svgURLObject = new URL(details.url);
      { // Sometimes the website reencodes as html chars the data
        let HTMLDecoderOption = new Option();
        HTMLDecoderOption.p_ud_innerHTML = svgURLObject.hash;
        svgURLObject.hash = HTMLDecoderOption.textContent;
      }
      let complementIndex = svgURLObject.hash.indexOf(uDark.imageSrcInfoMarker);
      let notableInfos = new URLSearchParams(complementIndex == -1 ? "" : svgURLObject.hash.slice(complementIndex + 6))
      notableInfos = Object.fromEntries(notableInfos.entries());
      notableInfos.remoteSVG = true;
      filter.onstop = event => {
        new Blob(details.buffers).arrayBuffer().then((buffer) => {
          let svgString = uDarkDecode(details.charset,buffer, {
            stream: true
          })
          
          let svgStringEdited = uDark.frontEditHTML(false, svgString, details, {
            notableInfos,
            svgImage: true,
            remoteSVG: true,
            remoteSVGURL: svgURLObject.href,
          });
          filter.write(uDarkEncode(details.charset,svgStringEdited));
          filter.disconnect();
          clearInterval(secureTimeout);
        });
      }
    } else {
      imageWorker = new uDark.LoggingWorker(uDark.imageWorkerJsFile);
      imageWorker.addEventListener("message", event => {
        if (event.data.editionComplete) {
          for (let buffer of event.data.buffers) {
            try {
              filter.write(buffer);
            } catch (e) {
              uDark.error(e.message)
            }
          }
          filter.disconnect();
          imageWorker.terminate();
          clearInterval(secureTimeout);
        }
      })
      filter.ondata = event => {
        imageWorker.postMessage({
          oneImageBuffer: event.data
        }, [event.data]) // Explicityly transfer the ArrayBuffer to the worker
        
      }
      filter.onstop = event => {
        imageWorker.postMessage({
          filterStopped: 1,
          details
        });
      }
    }
    // Here we catch any image, including data:images <3 ( in the form of https://data-image/data:image/png;base64,....)
    let resultEdit = {}
    
    // If resultEdit is a promise, image will be edited (foreground or background), otherwise it may be a big background image to include under text
    // Lets inform the content script about it
    if (uDark.enable_registering_background_images && (!resultEdit.then || !resultEdit.edited)) {
      // uDark.registerBackgroundItem(false,{selectorText:`img[src='${details.url}']`},details);
      let imageURLObject = new URL(details.url);
      if (imageURLObject.searchParams.has("uDark_cssClass")) {
        let cssClass = decodeURIComponent(imageURLObject.searchParams.get("uDark_cssClass"));
        // console.log("Found a background image via property",cssClass);
        uDark.registerBackgroundItem(false, {
          selectorText: cssClass
        }, details);
        imageURLObject.searchParams.delete("uDark_cssClass");
        imageURLObject.searchParams.set("c", uDark.fixedRandom);
        return {
          redirectUrl: imageURLObject.href
        };
      } else if (!imageURLObject.searchParams.has("c")) {
        // uDark.log("Found an img element",details.url)
        // uDark.log(details.url,"is not a background image, but an img element",details)
        uDark.registerBackgroundItem(false, {
          selectorText: `img[src='${details.url}']`
        }, details);
      }
    }
    return resultEdit;
    
  }
  static async editBeforeRequestImage(details) {
    if (details.url.startsWith("https://data-image/?base64IMG=")) {
      const dataUrl = details.url.slice(30);
      
    // now in 2025 we can exclude all res or image res
      if( details.documentUrl.match(uDark.userSettings.exclude_regexImg) || details.url.match(uDark.userSettings.exclude_regexRes) || details.url.match(uDark.userSettings.exclude_regexImgr)) {
        // uDark.log("Image","This image is excluded by the user settings",details.url,"loaded by webpage:",details.originUrl,"Assuming it is not an eligible webpage, or even blocked by another extension");
        return {
          redirectUrl: dataUrl
        }
      }
      const arrayBuffer = await (await fetch(dataUrl)).arrayBuffer();
      const reader = new FileReader() // Faster but ad what cost later ? 
      
      const imageWorker = new uDark.LoggingWorker(uDark.imageWorkerJsFile);
      
      imageWorker.addEventListener("message", event => {
        if (event.data.editionComplete) {
          
          reader.readAsDataURL(new Blob(event.data.buffers));
        }
      })
      
      imageWorker.postMessage({
        oneImageBuffer: arrayBuffer,
        filterStopped: 1,
        details: details
      }, [arrayBuffer]) // Explicityly transfer the ArrayBuffer to the worker
      
      let to_return = new Promise(resolve => reader.onload = (e) => resolve({
        redirectUrl: reader.result
      }));
      
      to_return.then(x => imageWorker.terminate()); // Very needed : non terminated workers will avoid new workers to reveive messages
      
      // console.log("PASSING",(globalThis["passing"+details.url+details.requestId]=(globalThis["passing"+details.url+details.requestId]||0)+1),details);
      
      return to_return;
    }
  }
  static editBeforeRequestStyleSheet_sync(details) {
    let options = {};
    
    // console.log("Loading CSS", details.url, details.requestId, details.fromCache)
    
    // Util 2024 jan 02 we were checking details.documentUrl, or details.url to know if a stylesheet was loaded in a excluded page
    // Since only CS ports that matches blaclist and whitelist are connected, we can simply check if this resource has a corresponding CS port
    if (!uDark.getPort(details)) {
      // console.log("CSS", "No port found for", details.url, "loaded by webpage:", details.originUrl, "Assuming it is not an eligible webpage, or even blocked by another extension");
      // console.log("If i'm lacking of knowledge, here is what i know about this request", details.tabId, details.frameId);
      return {}
    }
    // now in 2025 we can exclude all res or css res
    if( details.url.match(uDark.userSettings.exclude_regexRes) || details.url.match(uDark.userSettings.exclude_regexCss)) {
      console.log("CSS", "This CSS is excluded by the user settings", details.url, "loaded by webpage:", details.originUrl, "Assuming it is not an eligible webpage, or even blocked by another extension");
      console.log("It matches :", details.url.match(uDark.userSettings.exclude_regexRes) ? uDark.userSettings.exclude_regexRes : uDark.userSettings.exclude_regexCss);
      console.log("basic exclude_regex",uDark.userSettings.exclude_regex);
      return {}
    }

    
    uDark.extractCharsetFromHeaders(details, "text/css");
    
    let {is_enforced_nobody} = uDark.getNoBodyStatus(details);
    if (is_enforced_nobody) {
      return {}; // We cannot edit this request: either it has no body, or it's empty because unmodified, so the webRequestFilter will receive an already edited content from the cache
    }

    let filter = globalThis.browser.webRequest.filterResponseData(details.requestId); // After this instruction, browser espect us to write data to the filter and close it
    
    details.dataCount = 0;
    details.rejectedValues = "";
    
    
    filter.onstart = event => {
      // console.log("CSS filter started",details.url,details.requestId,details.fromCache)
      filter.write(uDarkEncode("UTF-8", `@import "${browser.runtime.getURL("ultimaDark.css")}";\n`));
    }

    // // ondata event handler
    filter.ondata = event => {
      details.dataCount++;
      uDark.handleCSSChunk_sync(event.data, true, details, filter);
    };
    
    // onstop event handler
    filter.onstop = event => {
      if (details.rejectedValues.length > 0) {
        uDark.handleCSSChunk_sync(null, false, details, filter);
      }
      filter.disconnect();  // Ensure disconnection after completion
    };
    // return {redirectUrl:details.url};
    // return {responseHeaders:[{name:"Vary",value:"*"},{name:"Location",value:details.url}]};
    return {};
    // must not return this closes filter//
  }
  
  static setEligibleRequestBeforeData(details){
    details.unEligibleRequest=(details.documentUrl || details.url).match(uDark.userSettings.exclude_regex);
    details.eligibleRequest=!details.unEligibleRequest;
    // Here we have to check the url or the documentUrl to know if this webpage is excluded
    // It already has passed the whitelist check, this is why we only check the blacklist
    // However this code executes before the content script is connected, so we can't check if it will connect or not
    // Even if we could do this, like sending some bytes and waiting for he content script to connect,
    // and it would be not so musch costly in terms of time, some pages as YouTube as the time i write this, somehow manages
    // to send in this very first request tabID -1 and frameID 0, which is not a valid combination, and the content script will never be found
    // stackoverflow says it might be related to worker threads. It's probably true with serviceWorkers
    
    // console.log("Will check",details.url,"made by",details.documentUrl || details.url,0)
    // console.log("Is eligible for uDark",details.eligibleRequest)
    if (details.unEligibleRequest) {
      
      uDark.deletePort(details)
      // As bellow is marking as arriving soon
      // It is possible to have a page that starts loading, we mark it as arriving soon
      // loading stops, for whatever reason, and the content script does not connect and therefore does not disconnects and get not deleted.
      // In this case, the port will not be erased, and all resources will darkened, even if the page is not eligible for uDark
      // It is testable by disablising the content script, assignation and line above; loading a darkened page, in a tab, to set the arriving soon flag, 
      // then loading an uneligible page in the same tab, and see if it not dakening.
      // A simple delete when the page is not eligible is enough and very low cost.
      // In the end we need to be in this if to avoid darkening the page, we wont be lazy and delete the port.
      return;
      
    }
    if (details.tabId != -1) {
      // Lets be the MVP here, sometimes the content script is not connected yet, and the CSS will arrive in few milliseconds.
      // This page is eligible for uDark
      // console.log("I'm telling the world that",details.url,"is eligible for uDark", "on", details.tabId,details.frameId)
      // This code must absolutely eb executed before the parsing of headers of the page since the page can have  link header wich will be considered as a <link> tag
      // See https://developer.mozilla.org/fr/docs/Web/HTTP/Headers/Link for details
      uDark.setPort(details,{arrivingSoon:true},0);
      
    }
    
  }
  static editBeforeData(details) {
    if (details.tabId == -1 && uDark.connected_options_ports_count || uDark.connected_cs_ports["port-from-popup-" + details.tabId]) { // -1 Happens sometimes, like on https://www.youtube.com/ at the time i write this, stackoverflow talks about worker threads
      
      // Here we are covering the needs of the option page: Be able to frame any page
      let removeHeaders = ["content-security-policy", "x-frame-options", "content-security-policy-report-only"]
      details.responseHeaders = details.responseHeaders.filter(x => !removeHeaders.includes(x.name.toLowerCase()))
    }
    if(!uDark.getPort(details)){ // If setEligibleRequestBeforeData removed the port, we don't want to darken the page
      return {responseHeaders:details.responseHeaders};
    }
    
    uDark.extractCharsetFromHeaders(details);
    
    if(!details.contentType.includes("text/html")){
      return {responseHeaders:details.responseHeaders};
    }
    details.responseHeaders = details.responseHeaders.filter(x => {
      var a_filter = uDark.headersDo[x.name.toLowerCase()];
      return a_filter ? a_filter(x) : true;
    })
    
   


    let {is_enforced_nobody} = uDark.getNoBodyStatus(details);
    if (is_enforced_nobody) {
      return {responseHeaders:details.responseHeaders}; // We cannot edit this request: either it has no body, or it's empty because unmodified, so the webRequestFilter will receive an already edited content from the cache
    }
    // console.log("Editing", details.url, details.requestId, details.fromCache)
    let filter = globalThis.browser.webRequest.filterResponseData(details.requestId);
    
    details.dataCount = 0;
    details.writeEnd = [];     
    filter.ondata = event => {
      details.dataCount++
      details.writeEnd.push(event.data);
      
    }
    filter.onstop = async event => {
      
      // Note the headers are already returned since a long time, so we can't edit them here. Fortunately we don't need to, and if we realy need.. use http equiv.
      details.dataCount = 1;
      details.writeEnd = await new Blob(details.writeEnd).arrayBuffer();
      
      
      let decodedValue= uDarkDecode(details.charset,details.writeEnd,{stream:true});
      if(details.debugParsing){ // debug
        details.writeEnd = decodedValue
      }
      else
      {
        details.writeEnd = uDark.parseAndEditHtmlContentBackend4(decodedValue, details)
      }
      
      filter.write(uDarkEncode(details.charset,details.writeEnd));
      
      filter.disconnect(); // Low perf if not disconnected !
    }
    return {responseHeaders:details.responseHeaders}
  }
}