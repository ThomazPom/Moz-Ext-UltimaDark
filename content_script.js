let myPort = browser.runtime.connect({
  name: "port-from-cs"
});

function csOverrideRemoteContent(url, content) {
  myPort.postMessage({
    overrideRemoteContent: {
      source: document.location.href,
      url: url,
      content: content
    }
  });
};

let expectedValueForResolvableColor = "rgba(255, 254, 253, 0.55)";
function resolveIDKVars(data) {
    if (data.chunk) {
      
      let readable_variable_check_value=`rgba(255,254,253,var(--chunk_is_readable_${data.details.requestId}_${data.details.datacount}))`;
      let option = new Option();
      document.head.appendChild(option);
      option.style.floodColor=readable_variable_check_value;

        let workInterval = setInterval(() => {
        let floodColor=getComputedStyle(option).floodColor;
        // console.log("floodColor",floodColor);
        if(floodColor!=expectedValueForResolvableColor){return;} // If the floodColor is not the one we expect for this chunk, it means that the chunk is not written yet, so we wait
        clearInterval(workInterval);
        option.remove();
        
        // The variables we are looking a might be in data.chunk we have to read it first to make them available to idk_variables_only.
        let ikd_chunk_resolved = window.wrappedJSObject.uDark.edit_str(data.chunk, false, false, false, true);
            
        let idk_variables_only = window.wrappedJSObject.uDark.edit_str(data.chunk_variables , false, false, false, "partial_idk");
        
        let tempVariablesStyle=document.createElement("style");
        tempVariablesStyle.id="UltimaDarkTempVariablesStyle";
        
        tempVariablesStyle.innerHTML="/*UltimaDark temporary style*/\n"+idk_variables_only;
        document.head.append(tempVariablesStyle);
        


            console.log("Resolved variables: will now post message to background script",readable_variable_check_value);
            data.chunk = ikd_chunk_resolved;
            myPort.postMessage({
              resolvedIDKVars: data
            });
      },50); // Allow time for a chunk to be written before reading vairables out of it.
      setTimeout(() => {
        console.log("Timeout: on chunk",data.details.datacount,"for",data.details.requestId,"(url:",data.details.url,")");
        // console.log("It was containing:", window.wrappedJSObject.uDark.edit_str(data.chunk_variables , false, false, false, "partial_idk"));
        clearInterval(workInterval);
      }, 10000); // If the chunk is not written after 10 seconds, we stop waiting for it.
    }
};

function refreshStylesheet(data) {
    window.wrappedJSObject.uDark.refresh_stylesheet(data.details.url);
}


function registerBackgroundItem(selectorText) {
  window.wrappedJSObject.uDark.registerBackgroundItem(false, selectorText, false); // go directly to the edit, the validation is already done
}

myPort.onMessage.addListener(function(m) {
  // console.log("In content script, received message from background script: ",m);

  if (window.wrappedJSObject.uDark) { // if uDark is loaded (uDark is not loaded on txt resources for example)
    m.havingIDKVars && resolveIDKVars(m.havingIDKVars);
    m.registerBackgroundItem && registerBackgroundItem(m.registerBackgroundItem);
    m.refreshStylesheet && refreshStylesheet(m.refreshStylesheet);
  }
});

exportFunction(csOverrideRemoteContent, window, {
  defineAs: "UDarkOverrideRemoteContent"
});

console.log("Content script loaded",document.location.href);