class uDarkExtendedContentScript {

  is_content_script = true


  askSynchronousBackground(question, json = false, syncData = {}, param = "param") {
    let requestIdentifier = Math.random().toString(36).slice(2);
    browser.runtime.sendMessage({ askSynchronousBackgroundIdentifier: requestIdentifier, ...syncData });
    let xhr = new window.XMLHttpRequest();
    xhr.open("GET", `https://${question}.uDark/askSynchronousBackground/${requestIdentifier}/${param}`, false); // false = synchrone
    xhr.send(null);
    let responseText = xhr.responseText;
    return json ? JSON.parse(responseText) : responseText;
  }

  install() {


    if (window.parent !== window && window.userSettings.embedsInheritanceBehavior == "inheritFromParent") {
      let useHttpSwitchOff = ["http:", "https:"].includes(document.location.protocol);
      let isParentUDark = this.askSynchronousBackground("isParentUDark", true, {
        switchOffCSS: useHttpSwitchOff,
      }, "switchOffCSS").parentHasUltimaDark;
      if (!isParentUDark) {
        if (!useHttpSwitchOff) {

          let sheet = new CSSStyleSheet();
          sheet.replaceSync(uDark.cssSwitchOffString);
          // document.adoptedStyleSheets = [sheet]
          window.wrappedJSObject.document.adoptedStyleSheets.push(sheet);
        }
        return false; // Do not install uDark in this embed since the parent does not have uDark and the user requested inheritance from parent
      }

    }
    this.port = browser.runtime.connect({ // Connect to the background script to register the edition of subresources
      // Do it after checking the parent frame to avoid registering unneeded connections && therefore whitelisting the frame
      name: "port-from-cs"
    });
    uDark.exportFunction = globalThis.exportFunction; // Don't override the exportFunction function, but make it available to ultimadark
    console.info("UltimaDark", "Content script install", window);
    if (uDark.direct_window_export && !window.world_injection_available) {

      [
        ["this.uDarkExtended = class {};this.uDarkC=", uDarkC],
        z => {
          window.uDark = new uDarkC();
        },
        AllLevels.install,
        {
          do: z => window.wrappedJSObject.uDark.userSettings = cloneInto(uDark.getSafeUserSettings(window.userSettings), window)
        },
        WebsitesOverrideScript.override_website


      ].map(code => {
        if (code.do) {
          console.log("Executing code.do()", code);
          return code.do();
        }
        let codeStr = code.join ? code.map(x => x.toString()).join("\n") : "(" + code.toString() + ")()";
        (new window.wrappedJSObject.Function(codeStr))(); // Use Function to avoid eval, better speed, less warning
      });


    }
    else {
      // console.warn("UltimaDark : Direct window export is not available, using cloneInto is not implemented yet");
      // TODO : Alterantive injection : Cloneinto ? or smart <script> injection ?
      // CloneInto seems to be the best candidate given testing.
    }
  }

}
