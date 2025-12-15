
class Listeners {
  static cancelPopupXHRCalls(details) {
    if (details.tabId == uDark.popupTabId) {
      console.log("Canceling popup XHR call", details.url, details);
      // message to popup, we fund his friend
      uDark.connected_cs_ports["port-from-popup-" + details.tabId].postMessage({
        cancelPopupXHRCalls: true,
        url: details.url
      });
      return { cancel: true };
    }
  }
  static askSynchronousBgIdHelper(message, sender, sendResponse) {
    if (message.askSynchronousBackgroundIdentifier) {


      let mapKey = "askSynchronousBG_" + message.askSynchronousBackgroundIdentifier;
      uDark.general_cache.set(mapKey, {
        frameDetails: {
          tabId: sender.tab.id,
          frameId: sender.frameId,
        },
        message: message

      });
    }
  }
  static askSynchronousBgId(details) {
        let questionParts = details.url.split("/");
        let param = questionParts.pop();
        let identifer = questionParts.pop();
        let mapKey = "askSynchronousBG_" + identifer;
        let mapData = uDark.general_cache.get(mapKey);
        
        // switch off CSS if requested

        if (mapData) {
          uDark.general_cache.delete(mapKey); // One time use
          return browser.webNavigation.getFrame(mapData.frameDetails).then(moreFrameDetails => {
            let isParentUDark = !!uDark.getPort({ tabId: mapData.frameDetails.tabId, frameId: moreFrameDetails.parentFrameId });
            
            if (!isParentUDark && mapData.message.switchOffCSS) {
              uDark.switchOffCSSInFrame(mapData.frameDetails.tabId, mapData.frameDetails.frameId);
            }
            return { redirectUrl: `data:application/json,{"parentHasUltimaDark":${isParentUDark}}` };
          });
        }
        return {};

      
  }
  static moreInfoOnImageResult(details, obuffer, event) {

    // uDark.warn("Image editing complete",details.url.split("#"),event.data.is_photo?"photo": event.data.heuristic);
  }
  static isEligibleResource(details) {
    // Check if the resource is eligible for uDark
    return uDark.getPort(details) || details.tabId == -1 && !details.documentUrl.match(uDark.userSettings.exclude_regex);
  }
  static editOnHeadersImage(details) {

    // Util 2024 jan 02 we were checking details.documentUrl, or details.url to know if a stylesheet was loaded in a excluded page
    // Since only CS ports that matches blaclist and whitelist are connected, we can simply check if this resource has a corresponding CS port
    if (!Listeners.isEligibleResource(details)) {
      // uDark.log("Image","No port found for",details.url,"loaded by webpage:",details.originUrl,"Assuming it is not an eligible webpage, or even blocked by another extension");
      return {}
    }
    // now in 2025 we can exclude all res or image res
    if (details.url.match(uDark.userSettings.exclude_regexRes) || details.url.match(uDark.userSettings.exclude_regexImgr)) {
      // uDark.log("Image","This image is excluded by the user settings",details.url,"loaded by webpage:",details.originUrl,"Assuming it is not an eligible webpage, or even blocked by another extension");
      return {}
    }
    // now in 2025 we can exclude all image from site
    if (details.documentUrl?.match(uDark.userSettings.exclude_regexImg)) {
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
    let { is_enforced_nobody } = uDark.getNoBodyStatus(details);
    if (is_enforced_nobody) {
      return {}; // We cannot edit this request: either it has no body, or it's empty because unmodified, so the webRequestFilter will receive an already edited content from the cache
    }
    let filter = globalThis.browser.webRequest.filterResponseData(details.requestId); // After this instruction, browser espect us to write data to the filter and close it
    let imageWorker;
    let secureTimeout = setTimeout(() => {
      try {
        filter.disconnect();
        imageWorker && imageWorker.terminate("security termination " + details.url);
      } catch (e) { }
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
          let svgString = uDarkDecode(details.charset, buffer, {
            stream: true
          })

          let svgStringEdited = uDark.frontEditHTML(false, svgString, details, {
            notableInfos,
            svgImage: true,
            remoteSVG: true,
            remoteSVGURL: svgURLObject.href,
          });
          filter.write(uDarkEncode(details.charset, svgStringEdited));
          filter.disconnect();
          clearInterval(secureTimeout);
        });
      }
    } else {

      if (uDark.userSettings.pooledWorkersEnabled) {
        let allBuffers = [];



        filter.ondata = event => {
          allBuffers.push(event.data);
        }

        filter.onstop = event => {

          // console.log("Image", "Filter stopped, sending to worker", performance.now(), details.url);
          let t0_perf = performance.now();
          let blob = new Blob(allBuffers);
          Promise.all([
            blob.arrayBuffer(),
            uDark.imageWorkerPool.getIdleWorker()
          ]).then(([arrayBuffer, h]) => {
            h.process(arrayBuffer, details).then(out => {
              filter.write(out);
              filter.disconnect();
              let t1_perf = performance.now();
              // console.log("Image", "Filter disconnected after worker t1_perf:", t1_perf, "t0_perf:", t0_perf, "total:", t1_perf - t0_perf, details.url, details.requestId);
            });
          })
        }
      }


      else {
        imageWorker = new uDark.LoggingWorker(uDark.imageWorkerJsFile.native);
        imageWorker.addEventListener("message", event => {
          if (event.data.editionComplete) {
            Listeners.moreInfoOnImageResult(details, details.buffers, event);


            for (let buffer of event.data.buffers) {
              try {
                filter.write(buffer);
              } catch (e) {
                uDark.error("Error during write", e, e.message, buffer, details, event.data.buffers.indexOf(buffer));
              }

            }

            filter.disconnect();
            imageWorker.terminate("normal use " + details.url);
            clearInterval(secureTimeout);
          }
        })

        let firstChunk = true;
        filter.ondata = event => {

          let onDataMessage = {
            oneImageBuffer: event.data
          };
          let onDataTransfer = [event.data];
          // onDataTransfer = [];
          // if (firstChunk && !uDark.disableModelTransfer) {
          //   firstChunk = false;
          //   onDataMessage.iaModelJsonBuffer = uDark.iaModelJsonBuffer;
          //   onDataMessage.iaModelWeightsBuffer = uDark.iaModelWeightsBuffer;
          //   onDataMessage.details = details;
          //   onDataMessage.hasIA = true;
          //   onDataMessage.transferStart = Date.now() / 1;
          //   // DISABLED : WE PREFER COPY FOR THESE BUFFERS onDataTransfer.push(onDataMessage.iaModelJsonBuffer,onDataMessage.iaModelWeightsBuffer ); // 
          // }

          imageWorker.postMessage(onDataMessage, onDataTransfer) // Explicityly transfer the ArrayBuffer to the worker

        }



        filter.onstop = event => {
          imageWorker.postMessage({
            filterStopped: 1,
            details
          });
        }
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
  static editBeforeRequestImage(details) {
    if (details.url.startsWith("https://data-image/?base64IMG=")) {
      const dataUrl = details.url.slice(30);


      // now in 2025 we can exclude all res or image res
      if (details.documentUrl?.match(uDark.userSettings.exclude_regexImg) || details.url.match(uDark.userSettings.exclude_regexRes) || details.url.match(uDark.userSettings.exclude_regexImgr)) {
        // uDark.log("Image","This image is excluded by the user settings",details.url,"loaded by webpage:",details.originUrl,"Assuming it is not an eligible webpage, or even blocked by another extension");
        return {
          redirectUrl: dataUrl
        }
      }
      const reader = new FileReader() // Faster but ad what cost later ? 



      if (uDark.userSettings.pooledWorkersEnabled) {

        return Promise.all([
          fetch(dataUrl).then(r => r.arrayBuffer()).then(arrayBuffer => arrayBuffer),
          uDark.imageWorkerPool.getIdleWorker()])
          .then(([arrayBuffer, h]) => {
            return h.process(arrayBuffer, details);
          }).then(out => {
            reader.readAsDataURL(new Blob([out]));
            return new Promise(resolve => reader.onload = (e) => resolve({ redirectUrl: reader.result }));
          });
      }
      else {

        const imageWorker = new uDark.LoggingWorker(uDark.imageWorkerJsFile.native);
        imageWorker.addEventListener("message", event => {
          if (event.data.editionComplete) {

            reader.readAsDataURL(new Blob(event.data.buffers));

            Listeners.moreInfoOnImageResult(Object.assign(details, { url: dataUrl }), undefined, event);
          }
        })


        fetch(dataUrl).then(r => r.arrayBuffer()).then(arrayBuffer => { // Does not block the main thread with await. Cant tell if it is faster or not

          imageWorker.postMessage({
            oneImageBuffer: arrayBuffer,
            iaModelJsonBuffer: uDark.iaModelJsonBuffer,
            iaModelWeightsBuffer: uDark.iaModelWeightsBuffer,
            hasIA: true,
            transferStart: Date.now() / 1,
            filterStopped: 1,
            details: details
          }, [arrayBuffer]) // Explicitly transfer the ArrayBuffer to the worker
        })

        let to_return = new Promise(resolve => reader.onload = (e) => resolve({
          redirectUrl: reader.result
        }));

        to_return.then(x => imageWorker.terminate("normal use b64")); // Very needed : non terminated workers will avoid new workers to reveive messages

        // console.log("PASSING",(globalThis["passing"+details.url+details.requestId]=(globalThis["passing"+details.url+details.requestId]||0)+1),details);

        return to_return;
      }
    }
  }
  static editOnHeadersReceivedStyleSheet(details) {
    uDark.extractCharsetFromHeaders(details, "text/css")
    uDark.general_cache.set(`request_${details.requestId}_more_details`, details);

    let { is_enforced_nobody } = uDark.getNoBodyStatus(details);
    details.already_edited_or_empty = is_enforced_nobody // We cannot edit this request: either it has no body, or it's empty because unmodified, so the webRequestFilter will receive an already edited content from the cache

  }
  static TopCSSFlag = `@import "${browser.runtime.getURL("ultimaDark.css")}";\n`
  static editBeforeRequestStyleSheet_sync(details) {
    let options = {};

    // console.log("Loading CSS", details.url, details.requestId, details.fromCache)

    // Util 2024 jan 02 we were checking details.documentUrl, or details.url to know if a stylesheet was loaded in a excluded page
    // Since only CS ports that matches blaclist and whitelist are connected, we can simply check if this resource has a corresponding CS port
    if (!Listeners.isEligibleResource(details)) {
      // console.log("CSS", "No port found for", details.url, "loaded by webpage:", details.originUrl, "Assuming it is not an eligible webpage, or even blocked by another extension");
      // console.log("If i'm lacking of knowledge, here is what i know about this request", details.tabId, details.frameId);
      return {}
    }
    // now in 2025 we can exclude all res or css res
    if (details.url.match(uDark.userSettings.exclude_regexRes) || details.url.match(uDark.userSettings.exclude_regexCss)) {
      // console.log("CSS", "This CSS is excluded by the user settings", details.url, "loaded by webpage:", details.originUrl, "Assuming it is not an eligible webpage, or even blocked by another extension");
      // console.log("It matches :", details.url.match(uDark.userSettings.exclude_regexRes) ? uDark.userSettings.exclude_regexRes : uDark.userSettings.exclude_regexCss);
      // console.log("basic exclude_regex",uDark.userSettings.exclude_regex);
      return {}
    }




    let filter = globalThis.browser.webRequest.filterResponseData(details.requestId); // After this instruction, browser espect us to write data to the filter and close it



    filter.onstart = event => {
      // console.log("CSS filter started",details.url,details.requestId,details.fromCache)
      // filter.write(uDarkEncode("UTF-8", Listeners.TopCSSFlag)); // Write the top CSS flag to be able to check if the CSS is already edited 
      if (uDark.general_cache.has(`request_${details.requestId}_more_details`)) {
        let moreDetails = uDark.general_cache.get(`request_${details.requestId}_more_details`);
        Object.assign(details, moreDetails);
        // uDark.log("Success : More details found for",details.requestId,details);
      }
      else {
        uDark.warn("onHeaderReceived was not called for", details.requestId, details.url, "not a big deal, but now defaulting to utf 8 & text/css");
        uDark.extractCharsetFromHeaders(details, "text/css");
      }

      details.dataCount = 0;
      details.rejectedValues = "";
    }

    // // ondata event handler
    filter.ondata = event => {
      if (details.already_edited_or_empty) {
        // console.log("Already edited or empty",details.url,details.requestId,details.fromCache);
        filter.write(event.data);
        return;
      }
      details.dataCount++;
      uDark.handleCSSChunk_sync(event.data, true, details, filter);
    };

    // onstop event handler
    filter.onstop = event => {
      if (details.rejectedValues.length > 0) {
        uDark.handleCSSChunk_sync(null, false, details, filter);
      }
      filter.disconnect();  // Ensure disconnection after completion
      uDark.general_cache.delete(`request_${details.requestId}_more_details`); // Clean up the cache
      // console.log("CSS filter stopped",details.url,details.requestId,details.fromCache)
    };
    // return {redirectUrl:details.url};
    // return {responseHeaders:[{name:"Vary",value:"*"},{name:"Location",value:details.url}]};
    // return {};
    // must not return this closes filter//
  }

  static fixForFilterResponseDataFirefoxBug = {
    // Fix for Firefox filterResponseData bug:
    //     // https://bugzilla.mozilla.org/buglist.cgi?quicksearch=filterResponseData

    //     // https://bugzilla.mozilla.org/show_bug.cgi?id=1982934
    //     // https://bugzilla.mozilla.org/show_bug.cgi?id=1806476
    //     // https://bugzilla.mozilla.org/show_bug.cgi?id=1561604
    noIssuesIntetrnalPagesRegex:
      /^about:(blank|welcome|studies|protections|privatebrowsing|newtab|loginsimportreport|logins|home|compat|certificate|blank)$/,

    registerOrUnregisterInternalPage(details) {
      // Firefox bug workaround:
      if (details.frameId != 0) {
        return; // We only care about main frames
      }


      if (details.url.startsWith("about:")) {
        console.log("Checking internal page for Firefox filterResponseData bug workaround:", details.tabId, details.url);
        if (!details.url.match(
          Listeners.fixForFilterResponseDataFirefoxBug.noIssuesIntetrnalPagesRegex
        )) {
          console.warn("Registering internal page for Firefox filterResponseData bug workaround:", details.tabId, details.url);
          uDark.general_cache.set(`fixing_about_tab_${details.tabId}`, true);
          return
        }
      }
      if (uDark.general_cache.has(`fixing_about_tab_${details.tabId}`)) {
        console.warn("Unregistering internal page for Firefox filterResponseData bug workaround:", details.tabId, details.url);
        uDark.general_cache.delete(`fixing_about_tab_${details.tabId}`);
        if (!details.url.startsWith("about:")) {
          browser.tabs.update(details.tabId, { url: `${browser.runtime.getURL("uDarkTools.htm")}?redirect=${details.url}` });// Reload the tab to make sure filterResponseData will work
        }
      }
    },


  }


  static setEligibleRequestBeforeDataWL(details) {
    if (details.frameId !== 0 && uDark.userSettings.embedsInheritanceBehavior === "inheritFromParent") {
      if (!uDark.getPort({ tabId: details.tabId, frameId: details.parentFrameId })) {
        return
      }
    };

    // console.log("Whitelisted page detected for uDark");
    uDark.setPort(details, { arrivingSoon: true, isWhiteList: true }, 0);
  }
  static setEligibleRequestBeforeDataBL(details) {

    details.unEligibleRequest = (details.documentUrl || details.url).match(uDark.userSettings.exclude_regex);
    details.eligibleRequest = !details.unEligibleRequest && uDark.getPort(details)?.isWhiteList;
    // Here we have to check the url or the documentUrl to know if this webpage is excluded
    // It already has passed the whitelist check, this is why we only check the blacklist
    // However this code executes before the content script is conn ected, so we can't check if it will connect or not
    // Even if we could do this, like sending some bytes and waiting for he content script to connect,
    // and it would be not so musch costly in terms of time, some pages as YouTube as the time i write this, somehow manages
    // to send in this very first request tabID -1 and frameID 0, which is not a valid combination, and the content script will never be found
    // stackoverflow says it might be related to worker threads. It's probably true with serviceWorkers

    // console.log("Will check",details.url,"made by",details.documentUrl || details.url,0)
    // console.log("Is eligible for uDark",details.eligibleRequest)




    if (!details.eligibleRequest) {

      uDark.deletePort(details); // Remove any previous port, we will set a new one if needed
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
    // Lets be the MVP here, sometimes the content script is not connected yet, and the CSS will arrive in few milliseconds.
    // This page is eligible for uDark
    // console.log("I'm telling the world that",details.url,"is eligible for uDark", "on", details.tabId,details.frameId)
    // This code must absolutely eb executed before the parsing of headers of the page since the page can have  link header wich will be considered as a <link> tag
    // See https://developer.mozilla.org/fr/docs/Web/HTTP/Headers/Link for details
    // console.log("Eligible page detected for uDark", details.url, "on", details.tabId, details.frameId);
    uDark.setPort(details, { arrivingSoon: true }, 0);


  }
  static editBeforeData(details) {
    if (details.tabId == -1 && uDark.connected_options_ports_count || uDark.connected_cs_ports["port-from-popup-" + details.tabId]) { // -1 Happens sometimes, like on https://www.youtube.com/ at the time i write this, stackoverflow talks about worker threads

      // Here we are covering the needs of the option page: Be able to frame any page
      let removeHeaders = ["content-security-policy", "x-frame-options", "content-security-policy-report-only"]
      details.responseHeaders = details.responseHeaders.filter(x => !removeHeaders.includes(x.name.toLowerCase()))
    }
    if (!uDark.getPort(details)) { // If setEligibleRequestBeforeData removed the port, we don't want to darken the page
      return { responseHeaders: details.responseHeaders };
    }

    uDark.extractCharsetFromHeaders(details);

    if (!details.contentType.includes("text/html") && !details.contentType.includes("application/xhtml+xml")) {
      return { responseHeaders: details.responseHeaders };
    }
    details.responseHeaders = details.responseHeaders.filter(x => {
      var a_filter = uDark.headersDo[x.name.toLowerCase()];
      return a_filter ? a_filter(x) : true;
    })




    let { is_enforced_nobody } = uDark.getNoBodyStatus(details);
    if (is_enforced_nobody) {
      return { responseHeaders: details.responseHeaders }; // We cannot edit this request: either it has no body, or it's empty because unmodified, so the webRequestFilter will receive an already edited content from the cache
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


      let decodedValue = uDarkDecode(details.charset, details.writeEnd, { stream: true });
      if (details.debugParsing) { // debug
        details.writeEnd = decodedValue
      }
      else {
        details.writeEnd = uDark.parseAndEditHtmlContentBackend4(decodedValue, details)
      }

      filter.write(uDarkEncode(details.charset, details.writeEnd));

      filter.disconnect(); // Low perf if not disconnected !
    }
    return { responseHeaders: details.responseHeaders }
  }
}