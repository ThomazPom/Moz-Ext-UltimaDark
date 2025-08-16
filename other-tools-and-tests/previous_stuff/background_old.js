
  
  class ContentScript {
    
    static install() {
      
      
      if (uDark.direct_window_export) {
        
        [
          
          dark_object.all_levels.install,
          dark_object.content_script.override_website
          
        ].map(code => {
          
          window.wrappedJSObject.eval("(" + code.toString() + ")()");
        });
        
      }
      window.wrappedJSObject.uDark.userSettings = cloneInto({  // Preserve user privacy by not exporting sensible settings to the page
        cacheEnabled: window.userSettings.cacheEnabled,
        serviceWorkersEnabled:window.userSettings.serviceWorkersEnabled,
        imageEditionEnabled: window.userSettings.imageEditionEnabled,
      }, window);
      window.wrappedJSObject.userSettingsReadyAction()
 

      
      let myPort = globalThis.browser.runtime.connect({
        name: "port-from-cs"
      });
      
      
      
    }
    
    website_load() {
      
    }
 
  }

          
  
  dark_object.all_levels.install();
  dark_object.both.install()
  
  if (globalThis.browser.webRequest) {
    dark_object.background.install();
  } else {
    dark_object.content_script.install();
    if (!uDark.direct_window_export) {
      dark_object.content_script.override_website();
    }
    dark_object.content_script.website_load();
    
  }
  