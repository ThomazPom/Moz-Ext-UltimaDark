class uDarkExtended extends uDarkExtendedContentScript {
  noBodyStatusCodes = {
    enforcedNoBody : {
      100: "Continue",
      101: "Switching Protocols",
      102: "Processing",
      103: "Early Hints",
      204: "No Content",
      205: "Reset Content",
      304: "Not Modified"
    },
    
    // Responses that are TYPICALLY EMPTY but NOT ENFORCED
    typicallyNoBody : {
      301: "Moved Permanently",
      302: "Found",
      303: "See Other",
      307: "Temporary Redirect",
      308: "Permanent Redirect"
    }
  }
  getNoBodyStatus_heuristic(details){
    return false;
  }
  getNoBodyStatus(details){
    let heuristic = this.getNoBodyStatus_heuristic(details);
    
    let resultStatus = {
      is_enforced_nobody: uDark.noBodyStatusCodes.enforcedNoBody[details.statusCode] || false,
      is_typical_nobody: uDark.noBodyStatusCodes.typicallyNoBody[details.statusCode] || false,
      is_heuristic_nobody: heuristic
    }
    return resultStatus;
  }
  handleCSSChunk_sync(data, verify, details, filter) {
    let str = details.rejectedValues;
    
    
    if(data){ str += uDarkDecode(details.charset,data,{stream:true}); }
    
    
    let options = {  };
    
    options.chunk = uDark.edit_str( str, false, verify, details, false, options);
    
    
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
    
    filter.write(uDarkEncode(details.charset,options.chunk));
  }
  settingsInContentScriptCSS(){
    let editedCSS = this.inject_css_override;
    let settingsToInject = {
      uDark_darken_A: this.userSettings.max_bright_bg,
      uDark_darken_B: this.userSettings.min_bright_bg,
      uDark_lighten_A: this.userSettings.min_bright_fg,
      uDark_lighten_B: this.userSettings.max_bright_fg,
      uDark_treshold: this.userSettings.min_bright_bg_trigger,
      uDark_darken_O1: this.userSettings.bg_negative_modifier,
      uDark_darken_O2: this.userSettings.fg_negative_modifier
    }
    Object.entries(settingsToInject).forEach(([key, value]) => {
      editedCSS = editedCSS.replace(new RegExp(`--${key}:\\s*[^;]+;`), `--${key}: ${value};`);
    });
    if(this.userSettings.bg_negative_modifier>0 || this.userSettings.fg_negative_modifier>0) {
      editedCSS = editedCSS.replace(/O1O2MModifiers_disabled:root/g, ":root");
    }
    return editedCSS;
  }
  getInjectCSS(resourcesPaths, actions = {}) {
    if (typeof resourcesPaths == "string") resourcesPaths = [resourcesPaths]
    return Promise.all(resourcesPaths.map(resourcePath =>
      fetch(resourcePath).then(r => r.text()).then(t => {
        let aCSSsrc = new CSSStyleSheet();
        aCSSsrc.replaceSync(t)
        return aCSSsrc;
      }).then(aCSSsrc => {
        uDark.edit_cssRules(aCSSsrc.cssRules, false, {}, function(rule) {
          // It's important to use Object.values as it retrieves values that could be ignored by "for var of rules.style"
          for (let key of Object.values(rule.style)) {
            
            // Here value can be empty string, if the key used in CSS is a shorthand property
            // like "background" and a var(--var) is used in the CSS but it's ok as we are here only searching for 
            // non conventional colors in gre-resources or removal of non-color properties and they don't use --vars.
            // !! Warning about css injected, or override css : var(--colors) does not match expected regex for colors but 
            // for this part xfunction is called with non-color properties so it falls OK
            let value = rule.style.getPropertyValue(key);
            
            if (actions.detectRareColors) {
              
              value = value.replace(/[a-z-0-9]+/g, function(match) {
                let is_color = uDark.is_color(match);
                return is_color ? uDark.rgba(...is_color, uDark.rgba_val) : match
              })
              if (actions.unsetMode == "fill_minimum" && value == "unset" && ["color", "background-color"].includes(key)) {
                value = uDark.hsla_val(0, 0, uDark.userSettings.max_bright_bg, 1)
              }
              let priority = rule.style.getPropertyPriority(key);
              rule.style.setProperty(key, value, priority);
              
            }
            
            if (actions.removeNonColors && !(value.match(uDark.hsl_a_colorsRegex) || value.match(uDark.rgb_a_colorsRegex))) {
              rule.style.removeProperty(key)
            }
          }
        })
        return aCSSsrc
      }).then(aCSS => {
        actions.edit_css && uDark.edit_css(aCSS)
        return aCSS
      }).then(aCSS => [...aCSS.cssRules].map(rule => rule.cssText).join("\n")).then(text => {
        for (let [key, item] of Object.entries(actions.set || {})) {
          item[key] = text
        }
        for (let [key, item] of Object.entries(actions.append || {})) {
          item[key] = (item[key] || "") + text 
        }
        
      })));
    }
    registerCS(contentScriptRegister) {
      let defaultCS = {
        matches: uDark.userSettings.properWhiteList,
        runAt: "document_start",
        matchAboutBlank: true,
        allFrames: true
      };
      if (uDark.browserInfo.Mozilla_Firefox >= 128) {
        defaultCS.matchOriginAsFallback = true // This crucial feature is only available since FF 128
      }
      if (uDark.userSettings.properBlackList.length) {
        defaultCS.excludeMatches = uDark.userSettings.properBlackList;
      }
      let contentScript = {
        ...defaultCS,
        ...contentScriptRegister
      }
      
      browser.contentScripts.register(contentScript).then(x => uDark.registeredCS.push(x));
      
    }
    properBlackListToExcludeRegex(list) {
      return list.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Sanitize regex
      .replace(/(^<all_urls>|\\\*)/g, "(.*?)") // Allow wildcards
      .replace(/^(.*)$/g, "^$1$")).join("|").replace(/^$/,"no_match") // User multi match
    }
    async asyncFilter(array, asyncPredicate) {
      const results = await Promise.all(array.map(asyncPredicate));
      return array.filter((_, i) => results[i]);
    }
    async setListener(initial) {
      let userSettings = uDark.userSettings;
      initial && Common.appCompat(userSettings);


      uDark.ensureBestRGBAFuncRef(); // Ensure the best rgba function is used, depending on user settings
      await uDark.getInjectAllCSS();
      uDark.userSettings.properWhiteList = (userSettings.inclusionPatterns).split("\n");
      
      uDark.userSettings.properWhiteList = await uDark.asyncFilter(uDark.userSettings.properWhiteList,uDark.filterValidExpression);

      // Process all exclusion patterns
      const allBlacklistPatterns = (userSettings.exclusionPatterns).split("\n");
      
      // Helper to filter by flag
      function filterByFlag(flagArr) {
        return allBlacklistPatterns
        .map(x => uDark.mapRegexAndRemoveUdFlag(x, flagArr, "erased"))
        .filter(x => x !== "erased" && x !== null && x !== undefined);
      }
      
      // Full exclusion (no flag or #ud_all)
      uDark.userSettings.properBlackList = filterByFlag(["", "all"]);
      uDark.userSettings.properBlackList = await uDark.asyncFilter(uDark.userSettings.properBlackList, uDark.filterValidExpression);
      uDark.userSettings.exclude_regex = uDark.properBlackListToExcludeRegex(uDark.userSettings.properBlackList);
      
      // Images only
      uDark.userSettings.properBlackListImg = filterByFlag(["img"]);
      uDark.userSettings.properBlackListImg = await uDark.asyncFilter(uDark.userSettings.properBlackListImg, uDark.filterValidExpression);
      uDark.userSettings.exclude_regexImg = uDark.properBlackListToExcludeRegex(uDark.userSettings.properBlackListImg);
      
      // CSS only
      uDark.userSettings.properBlackListCss = filterByFlag(["css"]);
      uDark.userSettings.properBlackListCss = await uDark.asyncFilter(uDark.userSettings.properBlackListCss, uDark.filterValidExpression);
      uDark.userSettings.exclude_regexCss = uDark.properBlackListToExcludeRegex(uDark.userSettings.properBlackListCss);
      
      // Image resource only (#ud_imgr)
      uDark.userSettings.properBlackListImgr = filterByFlag(["imgr"]);
      uDark.userSettings.properBlackListImgr = await uDark.asyncFilter(uDark.userSettings.properBlackListImgr, uDark.filterValidExpression);
      uDark.userSettings.exclude_regexImgr = uDark.properBlackListToExcludeRegex(uDark.userSettings.properBlackListImgr);
      
      // Resources only (CSS, JS, images)
      uDark.userSettings.properBlackListRes = filterByFlag(["res"]);
      uDark.userSettings.properBlackListRes = await uDark.asyncFilter(uDark.userSettings.properBlackListRes, uDark.filterValidExpression);
      uDark.userSettings.exclude_regexRes = uDark.properBlackListToExcludeRegex(uDark.userSettings.properBlackListRes);
      
      
      
      uDark.fixedRandom = Math.random();
      
      browser.webRequest.onSendHeaders.removeListener(Listeners.setEligibleRequestBeforeData);
      browser.webRequest.onHeadersReceived.removeListener(Listeners.editBeforeData);
      browser.webRequest.onBeforeRequest.removeListener(Listeners.editBeforeRequestStyleSheet_sync);
      browser.webRequest.onHeadersReceived.removeListener(Listeners.editOnHeadersReceivedStyleSheet);
      browser.webRequest.onBeforeRequest.removeListener(Listeners.editBeforeRequestImage);
      browser.webRequest.onHeadersReceived.removeListener(Listeners.editOnHeadersImage);

      if (uDark.registeredCS && uDark.registeredCS.length) {
        while (uDark.registeredCS.length) {
          uDark.registeredCS.shift().unregister();
        }
      }
      // { // EvenOff listeners
      //   uDark.log("EvenOff listeners removed");
      //   browser.webRequest.onBeforeRequest.removeListener(Listeners.cancelPopupXHRCalls);
      //   browser.webRequest.onBeforeRequest.addListener(Listeners.cancelPopupXHRCalls, {
      //     urls: ["<all_urls>"],
      //     types: ["xmlhttprequest"]
      //   }, ["blocking"]);
      //   uDark.info("EvenOff listeners added");
      // }      
      // { // EvenOff listeners
      //   uDark.log("EvenOff listeners removed");
      //   browser.webRequest.onBeforeRequest.removeListener(Listeners.cancelPopupXHRCalls);
      //   browser.webRequest.onBeforeRequest.addListener(Listeners.cancelPopupXHRCalls, {
      //     urls: ["<all_urls>"],
      //     types: ["xmlhttprequest"]
      //   }, ["blocking"]);
      //   uDark.info("EvenOff listeners added");
      // }
      // uDark.registerCS({matches:["<all_urls>"],excludeMatches:null,js: [{file: "contentScriptEvenOff.js"}],css:[{file: "contentScriptEvenOff.css"}]});
      if (userSettings.isEnabled && userSettings.properWhiteList.length) {
        
        browser.webRequest.onSendHeaders.addListener(Listeners.setEligibleRequestBeforeData, {
          urls: userSettings.properWhiteList,
          types: ["main_frame", "sub_frame"]
        }, );
        
        browser.webRequest.onHeadersReceived.addListener(Listeners.editBeforeData, {
          urls: userSettings.properWhiteList,
          types: ["main_frame", "sub_frame"]
        },
        ["blocking", "responseHeaders"]);
        
        
        {
          
          browser.webRequest.onBeforeRequest.addListener(Listeners.editBeforeRequestStyleSheet_sync, {
            // urls: uDark.userSettings.properWhiteList, // We can't assume the css is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
            urls: ["<all_urls>"],
            types: ["stylesheet"]
          },
          ["blocking"]);
          browser.webRequest.onHeadersReceived.addListener(Listeners.editOnHeadersReceivedStyleSheet, {
            // urls: uDark.userSettings.properWhiteList, // We can't assume the css is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
            urls: ["<all_urls>"],
            types: ["stylesheet"]
          },
          ["blocking", "responseHeaders"]);
        }
        
        
        
        if (uDark.userSettings.imageEditionEnabled) {
          uDark.log("Image edition enabled","Registering handlers");
          browser.webRequest.onBeforeRequest.addListener(Listeners.editBeforeRequestImage, {
            urls: ["<all_urls>"],
            
            
            // urls: uDark.userSettings.properWhiteList, // We can't assume the image is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
            types: ["image"]
          },
          ["blocking"]);
          browser.webRequest.onHeadersReceived.addListener(Listeners.editOnHeadersImage, {
            urls: ["<all_urls>"],
            // urls: uDark.userSettings.properWhiteList, // We can't assume the image is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
            types: ["image"]
          },
          ["blocking", "responseHeaders"]);
          
        }

        
        let contentScript = {
          js: [
            // {  file: "content_script.js"    }
            {
              file: "contentScriptClass.js"
            },
            {
              code: `
                this.uDarkExtended=uDarkExtendedContentScript;
                window.userSettings = ${JSON.stringify(uDark.userSettings)};`
            },
            {
              file: "background.js",
            },
          ], // Forced overrides
          css: [{
            code: uDark.settingsInContentScriptCSS()
          }], // Forced overrides
        };
        uDark.registerCS({
          css: [{
            code: uDark.inject_css_override_top_only
          }],
          allFrames: false
        });
        uDark.registerCS(contentScript);
        uDark.registerCS({
          css: [{
            code: uDark.inject_css_override_top_only
          }],
          allFrames: false
        }); // Register a default content script, to be able to edit the page before the other one is loaded
        
      } else
        {
        uDark.info("UD Did not load : ",
          "White list", uDark.userSettings.properWhiteList,
          "UltimaDark enable state :", uDark.userSettings.isEnabled)
        }
        
        
        browser.webRequest.handlerBehaviorChanged().then(x => uDark.info(`In-memory cache flushed`), error => console.error(`Error: ${error}`));
        browser.browsingData.removeCache({}).then(x => uDark.info(`Browser cache flushed`), error => console.error(`Error: ${error}`));
        
      }
      filterContentScript(x) {
        return x.match(/<all_urls>|^(https?|wss?|file|ftp|\*):\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^file:\/\/\/.*$|^resource:\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^about:$/)
      }
      async filterValidExpression(x) {
        try {
          await browser.contentScripts.register({ matches:[x],runAt:"#<udark>"})
        } catch (e) {
          return e.message.includes("#<udark>");
        } 
      }
      mapRegexAndRemoveUdFlag(x, keepFlags=["","all"],notFoundValue = null) { 
        let [pattern,flag] = x.split("#ud_");
        if (keepFlags.includes(flag)||!flag) {
          return pattern;
        }
        return notFoundValue;
      }
      
      getInjectAllCSS(){
        //reset suggested, override and top only:
        return Promise.all([
          this.getInjectCSS("/inject_css_suggested.css", {
            set: {
              inject_css_suggested: uDark,
            },
            edit_css: true
          }),
          this.getInjectCSS("/inject_css_suggested_no_edit.css", {
            append: {
              inject_css_suggested: uDark
            }
          }),
          this.getInjectCSS("/inject_css_override.css", {
            set: {
              inject_css_override: uDark
            },
            edit_css: true
          }),
          this.getInjectCSS("/inject_css_override_top_only.css", {
            set: {
              inject_css_override_top_only: uDark
            },
            edit_css: true
          }),
          this.getInjectCSS("/inject_css_override_no_edit.css", {
            append: {
              inject_css_override: uDark
            }
          }),
        ]).then(x => {
          uDark.info("All inject CSS loaded");
        });
      }
      install() {
        this.logPrefix = "UD";
        fetch("manifest.json").then(x => x.text()).then(x=>JSON.parse(x.replace(/\s+\/\/.+/g, ""))).then(x => {
          uDark.production = x.browser_specific_settings.gecko.id;
          
          if (uDark.production) {
            uDark.success( "Production mode", uDark.production);
            [console.log, console.warn, console.table, console.info] = Array(20).fill(z => {})
          }
          else {
            uDark.success( "Development mode",uDark);
          }
          
        });
        
        browser.runtime.onConnect.addListener(uDark.portConnected);
        browser.runtime.onInstalled.addListener(uDark.onInstalled);
        Promise.all([
          browser.runtime.getBrowserInfo().then(x => {
            uDark.browserInfo = x;
            uDark.browserInfo.version = parseInt(x.version.split(".")[0]);
            uDark.browserInfo[[uDark.browserInfo.vendor, uDark.browserInfo.name].join("_")] = uDark.browserInfo.version;
          }),
          uDark.getInjectCSS("/inject_css_suggested.css", {
            append: {
              inject_css_suggested: uDark,
            },
            edit_css: true
          }),
          uDark.getInjectAllCSS(),
          new Promise(uDark.getSettings),
          new Promise(uDark.installToggleSiteCommand)
        ]).then(x => uDark.info("CSS processed")).then(r => uDark.setListener(true));
        browser.storage.onChanged.addListener((changes, area) => {
          
          if (area == "local" && !(uDark.installOrUpdate++==true)) {
            uDark.success("Settings changed");
            new Promise(uDark.getSettings).then(uDark.setListener);
          }
        });
        uDark.keypoint("Installed");
      }
      
      installToggleSiteCommand(resolve) { // This is a command that will be available in the browser shortcuts, it will trigger the toggle action, it's a way to toggle the site without opening the popup
        if(!browser.commands) {
          uDark.warn("Browser does not support commands, toggle site command will not be available");
          resolve();
          return;
        }
        browser.commands.onCommand.addListener((command) => {
          if (command === "toggle-site") {
            console.log("Shortcut triggered: toggle-site");
            
            browser.browserAction.getPopup({}).then(previousValue => { // Prepare to restore the previous popup after the toggle
              setTimeout(() => {
                browser.browserAction.setPopup({popup:previousValue}); // Restore the previous popup after the toggle
              },500);
            });
            
            browser.browserAction.setPopup({popup:"/popup/popup.html?mode=uDark-popup&action=toggleSite"}); // Open the popup with the toggle action
            browser.browserAction.openPopup(); // Open the popup
            
            
          }
        });
        resolve();
      }
      onInstalled(details) {
        
        uDark.installOrUpdate = true;
        if (details.reason === "install") {
          uDark.info("Extension installed");
          browser.storage.local.set(uDark.userSettings).then(() => {
            uDark.info("Default user settings saved");
          });
        }
        else if (details.reason === "update") {
          uDark.info("Extension updated");
          browser.storage.local.get(null).then((res) => {
            uDark.info("Current user settings", res);
            let mergeSettings = {};
            Object.entries(uDark.userSettings).forEach(([key, value]) => {
              if(res[key] === undefined) {
                mergeSettings[key] = value;
              }
            });
            if(res.black_list) { // Legacy cleanup
              mergeSettings.exclusionPatterns = res.black_list;
              mergeSettings.inclusionPatterns = res.white_list;
              mergeSettings.isEnabled = !res.disable_webext;
              mergeSettings.imageEditionEnabled = !res.disable_image_edition;
              browser.storage.local.remove(["black_list", "white_list","disable_webext","disable_image_edition", "disable_cache"]);
            }
            uDark.info("Merging user settings", mergeSettings);
            browser.storage.local.set(mergeSettings).then(() => {
              uDark.info("User settings merged");
            });
          });
        }
      }
      // popupEmbedXHRHelperOnConnect(port)
      // {
      //   port.listenersXHRCancel=[]
      //   for(indexedDB, pattern of uDark.userSettings.properWhiteList) {
          
      //     let listenerFunc = details=>{
      //       // find a "X-Uark header and its value";
      //       if(details.requestHeaders) {
      //         details.requestHeaders.forEach(header => {
      //           if(header.name.toLowerCase() === "x-uark") {
      //             uDark.info("X-Uark header found", header.value);
      //             //tell port we f
      //           }
      //         });
      //       }
      //     }


      //     browser.webRequest.addListener(Listeners.popupEmbedXHRHelper, {
      //       urls: [pattern],
      //       types: ["xmlhttprequest"]
      //     }, ["blocking"]);
      //   }
      // }

      portConnected(connectedPort) {
        uDark.info("Connected", connectedPort.sender.url, connectedPort.sender.contextId, connectedPort.sender);
        if (connectedPort.name == "port-from-cs" && connectedPort.sender.tab) {
          // At first, we used exclude_regex here to not register some content scripts, but thent we used it earlier, in the content script registration
          
          let portKey = `port-from-cs-${connectedPort.sender.tab.id}-${connectedPort.sender.frameId}`
          uDark.connected_cs_ports[portKey] = connectedPort;
          connectedPort.onDisconnect.addListener(disconnectedPort => {
            let portValue = uDark.connected_cs_ports[portKey]
            
            uDark.info("Disconnected", disconnectedPort.sender.url, disconnectedPort.sender.contextId);
            if (portValue === disconnectedPort) { // If the port is the same, we can delete it, otherwise, we are on a late disconnection, the port is already replaced either by a new one or by one that will arrive soon
              uDark.info("Deleting", portKey)
              delete uDark.connected_cs_ports[portKey];
              
            }
          });
        }
        if (connectedPort.name == "port-from-popup") {
          
          if (connectedPort.sender.tab) {
            let portKey = `port-from-popup-${connectedPort.sender.tab.id}`
            // Knowing if my options are open or not, to change requests behaviour in these windows
            // Basicaly i want them to be able to frame any website
            // Popup does not have a tab, this may be how we could differenciate popup from options 
            uDark.connected_cs_ports[`port-from-popup-${connectedPort.sender.tab.id}`] = connectedPort;
            uDark.connected_options_ports_count++;
            connectedPort.onDisconnect.addListener(disconnectedPort => {
              
              let portValue = uDark.connected_cs_ports[portKey]
              if (portValue === disconnectedPort) {
                delete uDark.connected_cs_ports[portKey]
              }
              uDark.connected_options_ports_count--;
            });
          }
        }
        
      }
      
      
      
      
      
      connected_cs_ports=  {}
      getPortKey(details){
        return "port-from-cs-" + details.tabId + "-" + details.frameId
      }
      getPort(details){
        return uDark.connected_cs_ports[uDark.getPortKey(details)];
      }
      deletePort(details,moment){
        delete uDark.connected_cs_ports[uDark.getPortKey(details)];
      }
      setPort(details,port,moment){
        uDark.connected_cs_ports[uDark.getPortKey(details)]=port;
      }
      extractCharsetFromHeaders(details,defaultCT="text/html",defaultCharset="utf-8") {
        // We have seen cases where the charset was not specified in the content-type header, and the browser document.characterSet was defaulting to <meta> tag charset.
        // This is why we need to extract the charset from the headers, to knwo if we are in this kind of cases.
        
        let contentTypeHeader = details.responseHeaders?.find(x => x.name.toLowerCase() == "content-type");
        if(!contentTypeHeader){
          details.noContentTypeHeader=true;
          contentTypeHeader={value:defaultCT};
        }
        details.contentType = contentTypeHeader.value;
        details.charset = details.contentType.match(/charset=([0-9A-Z-_]+)/i)
        details.unspecifiedCharset = !details.charset;
        details.charset=(details.charset ||["",defaultCharset])[1].toLowerCase();
      }
      headersDo = {
        "content-security-policy-report-only": (x => { false }),
        "content-security-policy": (x => {
          let csp = x.value.toLowerCase();
          let cspArray = csp.split(/;|,/g).map(x => x.trim()).filter(x => x); 
          /* Quoted values are very defined and never contain a comma or a semicolon. No protection needed
          Urls in CSP break on these characters, browser expects them to be url encoded, so we can't have them in the value
          */
          let cspObject = {};
          
          cspArray.forEach(element => {
            element = element + " ";
            let spIndex = element.indexOf(" ");
            let key = element.slice(0, spIndex);
            let value = " ";
            value = element.slice(spIndex + 1);
            // uDark.log("CSP", key, value,spIndex);
            cspObject[key] = value.trim();
          });
          let CSPBypass_map = {
            // "* 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: data:": ["default-src"],
            "delete": new Set(["default-src","report-uri", "report-to","require-trusted-types-for","img-src","script-src", "script-src-attr","style-src-attr","script-src-elem","style-src"]),
          }
          for(let [newCSPValue,cspDirectiveKeys] of Object.entries(CSPBypass_map)){
            for(let cspDirective of cspDirectiveKeys){
              if(cspDirective in cspObject){ // Care to use in ; as default-src can be empty, which is equivalent to 'none' 
                cspObject[cspDirective] = newCSPValue;
              }
              if(newCSPValue === "delete")
                delete cspObject[cspDirective];
            }
          }
          let newCSP = Object.entries(cspObject).map(([key, value]) => {
            return `${key} ${value}`;
          }).join("; ");
          x.value = newCSP;
          return true; // Return true to apply the change, false to remove the header. We must keep the header since a website can send x frame options, among CSP, and removing it would give priority to the x frame options
        }),
      }
      registeredCS = []
      is_background = true // Tell ultimadark that we are in the background script and is_color_var is not available for instance
      LoggingWorker = class LoggingWorker extends Worker {
        constructor(...args) {
          super(...args);
          this.addEventListener('message', function(e) {
            if (e.data.logMessage) {
              uDark.log("imageWorker:", ...e.data.logMessage);
            }
          });
          
        }
      }
    }