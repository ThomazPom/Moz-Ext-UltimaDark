let myPort = browser.runtime.connect({name:"port-from-cs"});

function csOverrideRemoteContent(url,content) {
    myPort.postMessage({overrideRemoteContent:{ source:document.location.href, url:url, content:content }});
};

function resolveIDKVars(data) {
    setTimeout(()=>{
  let ikd_resolved = window.wrappedJSObject.uDark.edit_str(data.chunk,false,false,false,true);
  
//   console.log("In content script, resolving IDK vars: ", ikd_resolved,data.chunk);

  data.chunk = ikd_resolved;
  myPort.postMessage({resolvedIDKVars:data});
//   console.log("In content script, resolved IDK vars: ", data);
          if(data.refresh_stylesheet) {
                setTimeout(()=>{
                  window.wrappedJSObject.uDark.refresh_stylesheet(data.details.url);
              },0)
          }
    }
    ,100); // 100s should be enough, as in fact the page is already almost loaded :
    // We are here because link tags are already loaded, (so stylesheets are OK) and we are only waiting for all of this to be put in context wich is short 
};

function registerBackgroundItem(selectorText) {
  window.wrappedJSObject.uDark.registerBackgroundItem(false,selectorText,false); // go directly to the edit, the validation is already done
}

myPort.onMessage.addListener(function(m) {
  // console.log("In content script, received message from background script: ",m);
  
  if(window.wrappedJSObject.uDark) { // if uDark is loaded (uDark is not loaded on txt resources for example)
      m.havingIDKVars&& resolveIDKVars(m.havingIDKVars);
      m.registerBackgroundItem&& registerBackgroundItem(m.registerBackgroundItem);
  }
});



  
exportFunction(csOverrideRemoteContent , window, { defineAs: "UDarkOverrideRemoteContent" });