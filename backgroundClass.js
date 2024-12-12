class uDarkExtended extends uDarkExtendedContentScript {
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
                value = uDark.hsla_val(0, 0, uDark.max_bright_bg, 1)
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
      
      browser.contentScripts.register(contentScript).then(x => uDark.regiteredCS.push(x));
      
    }
    setListener(initial) {
      let userSettings = uDark.userSettings;
      initial && Common.appCompat(userSettings);
      uDark.userSettings.properWhiteList = (userSettings.white_list || uDark.defaultRegexes.white_list).split("\n").filter(uDark.filterContentScript)
      uDark.userSettings.properBlackList = (userSettings.black_list || uDark.defaultRegexes.black_list).split("\n").filter(uDark.filterContentScript)
      uDark.userSettings.exclude_regex = (userSettings.black_list || uDark.defaultRegexes.black_list).split("\n").map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Sanitize regex
      .replace(/(^<all_urls>|\\\*)/g, "(.*?)") // Allow wildcards
      .replace(/^(.*)$/g, "^$1$")).join("|") // User multi match)
      
      uDark.fixedRandom = Math.random();
      
      browser.webRequest.onSendHeaders.removeListener(Listeners.setEligibleRequestBeforeData);
      browser.webRequest.onHeadersReceived.removeListener(Listeners.editBeforeData);
      browser.webRequest.onHeadersReceived.removeListener(Listeners.editBeforeRequestStyleSheet_sync);
      browser.webRequest.onBeforeRequest.removeListener(Listeners.editBeforeRequestImage);
      browser.webRequest.onHeadersReceived.removeListener(Listeners.editOnHeadersImage);
      
      if (uDark.regiteredCS && uDark.regiteredCS.length) {
        while (uDark.regiteredCS.length) {
          uDark.regiteredCS.shift().unregister();
        }
      }
      if (!userSettings.disable_webext && userSettings.properWhiteList.length) {
        
        browser.webRequest.onSendHeaders.addListener(Listeners.setEligibleRequestBeforeData, {
          urls: userSettings.properWhiteList,
          types: ["main_frame", "sub_frame"]
        }, );
        
        browser.webRequest.onHeadersReceived.addListener(Listeners.editBeforeData, {
          urls: userSettings.properWhiteList,
          types: ["main_frame", "sub_frame"]
        },
        ["blocking", "responseHeaders"]);
        
        browser.webRequest.onHeadersReceived.addListener(Listeners.editBeforeRequestStyleSheet_sync, {
          // urls: uDark.userSettings.properWhiteList, // We can't assume the css is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
          urls: ["<all_urls>"],
          types: ["stylesheet"]
        },
        ["blocking", "responseHeaders"]);
        
        if (!uDark.userSettings.disable_image_edition) {
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
            code: uDark.inject_css_override
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
      uDark.info("UD Did not load : ",
        "White list", uDark.userSettings.properWhiteList,
        "UltimaDark enable state :", !userSettings.disable_webext)
        
        browser.webRequest.handlerBehaviorChanged().then(x => uDark.info(`In-memory cache flushed`), error => console.error(`Error: ${error}`));
        browser.browsingData.removeCache({}).then(x => uDark.info(`Browser cache flushed`), error => console.error(`Error: ${error}`));
        
      }
      filterContentScript(x) {
        return x.match(/<all_urls>|^(https?|wss?|file|ftp|\*):\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^file:\/\/\/.*$|^resource:\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^about:$/)
      }
      defaultRegexes = {
        white_list: ["<all_urls>", "*://*/*", "https://*.w3schools.com/*"].join('\n'),
        black_list: ["*://example.com/*"].join('\n')
      }
      
      getSettings(resolve) {
        browser.storage.local.get(null, function(res) {
          uDark.userSettings = res;
          resolve(res);
        })
      }
      
      install() {
        this.logPrefix = "UD";
        fetch("manifest.json").then(x => x.json()).then(x => {
          uDark.production = x.browser_specific_settings.gecko.id;
          
          if (uDark.production) {
            uDark.success( "Production mode", uDark.production);
            [console.log, console.warn, console.table, console.info] = Array(20).fill(z => {})
          }
          else {
            uDark.success( "Development mode");
          }
          
        });
        
        browser.runtime.onConnect.addListener(uDark.portConnected);
        
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
          uDark.getInjectCSS("/inject_css_suggested_no_edit.css", {
            append: {
              inject_css_suggested: uDark
            }
          }),
          uDark.getInjectCSS("/inject_css_override.css", {
            append: {
              inject_css_override: uDark
            },
            edit_css: true
          }),
          uDark.getInjectCSS("/inject_css_override_top_only.css", {
            append: {
              inject_css_override_top_only: uDark
            },
            edit_css: true
          }),
          uDark.getInjectCSS("/inject_css_override_no_edit.css", {
            append: {
              inject_css_override: uDark
            }
          }),
          new Promise(uDark.getSettings)
        ]).then(x => uDark.info("CSS processed")).then(r => uDark.setListener(true));
        browser.storage.onChanged.addListener((changes, area) => {
          uDark.success("Settings changed", changes, area);
          if (area == "local") {
            new Promise(uDark.getSettings).then(uDark.setListener);
          }
        });
      }
      
      
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
        
        let contentTypeHeader = details.responseHeaders.find(x => x.name.toLowerCase() == "content-type");
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
            "delete": new Set(["default-src","report-uri", "report-to","require-trusted-types-for","img-src","script-src", "script-src-attr","style-src-attr","style-src"]),
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
      regiteredCS = []
      is_background = true
      loggingWorkersActiveLogging = false // Conider moving this to imageWorker to avoid messages passing for nothing
      LoggingWorker = class LoggingWorker extends Worker {
        constructor(...args) {
          super(...args);
          if (uDark.loggingWorkersActiveLogging) {
            this.addEventListener('message', function(e) {
              if (e.data.logMessage) {
                uDark.log("imageWorker:", ...e.data.logMessage);
              }
            });
          }
          
        }
      }
    }