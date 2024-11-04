
  
  class ContentScript {
    
    static install() {
      console.info("UltimaDark", "Content script install", window);
      
      window.uDark = {
        ...uDark,
        ...{
          is_content_script: true,
          website_context: true,
          userSettings : window.userSettings
        }
      }
      
      
      if (uDark.direct_window_export) {
        
        [
          
          dark_object.all_levels.install,
          dark_object.content_script.override_website
          
        ].map(code => {
          
          window.wrappedJSObject.eval("(" + code.toString() + ")()");
        });
        
      }
      window.wrappedJSObject.uDark.userSettings = cloneInto({  // Preserve user privacy by not exporting sensible settings to the page
        disable_cache: window.userSettings.disable_cache,
        keep_service_workers:window.userSettings.keep_service_workers,
        disable_image_edition: window.userSettings.disable_image_edition,
      }, window);
      window.wrappedJSObject.userSettingsReadyAction()
 

      
      let myPort = globalThis.browser.runtime.connect({
        name: "port-from-cs"
      });
      
      
      
    }
    
    website_load() {
      
    }
    override_website() {
      try {
        typeof localStorage;
        uDark.localStorageAvailable = true;
      } catch (e) {
        // console.log("UltimaDark", "Local storage is not available", e,document.location.href);
      }
      
      let start = performance.now();
      
      console.log("UltimaDark", "Content script override website", window);
      
      window.userSettingsReadyAction = function() {
        console.log(new Error(),JSON.stringify(uDark.userSettings));
        if (!uDark.userSettings.keep_service_workers && window.navigator.serviceWorker) {
          if (uDark.localStorageAvailable) {
            // Insecure operations have in common a non available localStorage
            window.navigator.serviceWorker.getRegistrations().then(rs => rs.map(x => x.unregister()))
          }
          delete Navigator.prototype.serviceWorker;
        }
      }
      uDark.linkIntegrityErrorEvent = function(elem,) {
        // This fix is needed for some websites that use link integrity, i don't know why but sometime even removing the integrity earlier in the code does not work
        console.log("UltimaDark", "Link integrity error", elem,  "lead to a reload of this script");
        let href = elem.getAttribute("href");
        href && elem.setAttribute("href",uDark.addNocacheToStrLink(href) );
        elem.removeAttribute("onerror");
        
      }
      if (uDark.direct_window_export) {
        document.wrappedJSObject = document;
        // Avoid infinite loops 
        if (window.uDark && window.uDark.installed) {
          return; // Already fully installed. Do not reinstall if somehow another uDark object gets injected in the page
        } else {
          uDark.installed = true;
        }
        
        // Emulate content script exportFunction in one line;
        globalThis.exportFunction = f => f;
        
        // Zone for revoking property edition by the website : // no true=no trust
        // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
        // Some functions are replaced by good or less polyfills, i prefer native functions when possible
        Object.defineProperty(String.prototype, "replaceAll", {
          value: String.prototype.replaceAll,
          writable: false,
          configurable: false,
          enumerable: false
        }); // WikiCommons uses this one
        
        // End of zone for revoking property edition by the website
      }
      console.info("UltimaDark", "Websites overrides install", window);
      
      uDark.functionPrototypeEditor(HTMLObjectElement,HTMLObjectElement.prototype.checkValidity, (elem, args) => {
        console.log("UltimaDark:", elem, args);
        return args;
      })
      uDark.functionPrototypeEditor(CSSStyleDeclaration, CSSStyleDeclaration.prototype.setProperty, (elem, args) => {
        let parts = uDark.edit_str_nochunk(args[0] + ":" + args[1]);
        let partsIndex = parts.indexOf("; --ud-fg--");
        let part1 = parts.slice(0, partsIndex);
        let part2 = parts.slice(partsIndex + 2); //+2: Remove the ; and the space
        let subParts1_1 = part1.slice(0, part1.indexOf(":"));
        let subParts1_2 = part1.slice(part1.indexOf(":") + 2); // +2 to remove the : and the space
        let subParts2_1 = part2.slice(0, part2.indexOf(":"));
        let subParts2_2 = part2.slice(part2.indexOf(":") + 2, -1); // +2 to remove the : and the space, -1 to remove the ;
        
        args[0] = subParts1_1
        args[1] = subParts1_2
        
        elem.o_ud_setProperty(subParts2_1, subParts2_2, args[2]);
        return args
      }, (elem, args) => args[0].startsWith("--"))
      
      uDark.functionPrototypeEditor(CSSStyleSheet,
        [
          CSSStyleSheet.prototype.replace,
          CSSStyleSheet.prototype.replaceSync
        ], (elem, args) => { // Needed to manage it some day, now done :)
          args[0] = uDark.edit_str(args[0]);
          return args;
        })
        // This is the one youtube uses
        uDark.valuePrototypeEditor([Element, ShadowRoot], "innerHTML", uDark.frontEditHTML); // toString : some objects can redefine tostring to generate their inner
        // uDark.valuePrototypeEditor([Element, ShadowRoot], "innerHTML", uDark.frontEditHTML, (elem,value)=>
          
        
        { // Wrap JS editing iframe and this kind of objects SRC's
          uDark.valuePrototypeEditor([HTMLIFrameElement, HTMLEmbedElement], "src", uDark.frontEditHTMLPossibleDataURL ); 
          uDark.valuePrototypeEditor([HTMLObjectElement], "data", uDark.frontEditHTMLPossibleDataURL ); 
          uDark.valuePrototypeEditor([HTMLIFrameElement], "srcdoc", uDark.frontEditHTML ); 
        }
        
        uDark.valuePrototypeEditor(Element, "outerHTML", uDark.frontEditHTML); // toString : sombe object can redefine tostring to generate thzir inner
        
        // This is the one google uses
        uDark.functionPrototypeEditor(Element, Element.prototype.insertAdjacentHTML, (elem, args) => {
          args[1] = uDark.frontEditHTML("ANY_ELEMENT", args[1]); // frontEditHTML have a diffferent behavior with STYLE elements
          return args;
        })
        
        uDark.functionPrototypeEditor(Element, Element.prototype.setAttribute, (elem, args) => {
          let res = uDark.edit_str(args[1] +
            "" // I just learn again strings are passed by reference in JS the hard way
          );
          args[1] = res;
          return args;
        }, (elem, args) => args[0].toLowerCase() == "style")
        
        uDark.valuePrototypeEditor(HTMLImageElement, "src", (image, value) => {
          let res = uDark.image_element_prepare_href(image, document, value);
          return res;
        },
        false, // Condition: Inconditional
        //Aftermath: none
        false,
        (image, value) => { // Edited getter, to trick websites that are checking src integrity after setting it
          return value.split(new RegExp("#?"+uDark.imageSrcInfoMarker))[0];
        }
        
      );
      
      uDark.valuePrototypeEditor(SVGImageElement, "href", (image, value) => { // the <image> tag inside an SVG, no an <img> tag !
        return uDark.image_element_prepare_href(image, document, value);
      });
      
      uDark.valuePrototypeEditor(HTMLLinkElement, "href", (elem, value) => {
        if (elem.rel.endsWith("icon")) {
          value = value + "#ud_favicon";
        }
        return value;
      }, (elem, value) => {
        elem.rel == elem.rel.trim().toLowerCase();
        return (elem.rel == "stylesheet" || elem.rel.endsWith("icon"))
        
      }, (elem, value, new_value) => {
        if (elem.rel == "stylesheet" && uDark.enable_idk_mode && !uDark.chunk_stylesheets_idk_only_cors) {
          
          elem.addEventListener("load", uDark.do_idk_mode);
        }
      })
      
      // uDark.valuePrototypeEditor(HTMLLinkElement, "integrity", (elem, value) => {
        //   console.log("CSS integrity set", elem, value);
      //   return value;
      // })
      
      uDark.functionWrapper(SVGSVGElement, SVGSVGElement.prototype.setAttribute, "setAttribute", function(elem, args) {
        elem.addEventListener("js_svg_loaded", z => uDark.frontEditSVG(elem, document));
        setTimeout(() => elem.dispatchEvent(new Event("js_svg_loaded")), 50);
        return [elem, args]
      },
      (elem, args) => args[0] == "viewBox")
      
      uDark.functionWrapper(HTMLUnknownElement, HTMLUnknownElement.prototype.setAttribute, "setAttribute", function(elem, args) {
        elem.addEventListener("js_svg_loaded", z => uDark.frontEditSVG(elem, document));
        setTimeout(() => elem.dispatchEvent(new Event("js_svg_loaded")), 50);
        return [elem, args]
      },
      (elem, args) => args[0] == "viewBox" && elem.tagName == "SVG")
      
      // uDark.valuePrototypeEditor(SVGSVGElement, "viewBox", (elem, value) => {
        //   console.log("Viewbox set on",elem,value);
      //   return value;
      // })
      
      // uDark.checkDomEdit = true;
      if (uDark.checkDomEdit) {
        
        uDark.functionPrototypeEditor(Node, [Node.prototype.insertBefore, Node.prototype.appendChild], (elem, args) => {
          console.log(elem, args);
          return args;
        })
        uDark.functionPrototypeEditor(Node, Node.prototype.appendChild, (elem, args) => {
          console.log(elem, args);
          return args;
        })
        uDark.functionPrototypeEditor(Element, Element.prototype.after, (elem, args) => {
          console.log(elem, args);
          return args;
        })
        uDark.functionPrototypeEditor(Document, Document.prototype.createElement, (elem, args) => {
          console.log(elem, args);
          return args;
        })
        
      }
      
      // UserStyles.org and gitlab append text nodes to style elements, this is why we set the textContent of these items
      // uDark.functionPrototypeEditor(Element,Element.prototype.attachShadow, (elem, args) => {
        //   args[0].mode = "open";
      
      //   console.log("Attach shadow",elem,args);
      //   return args;
      // },x=>true,x=>{
        //   console.log("Attached shadow",x);
      //   let aCSS=new CSSStyleSheet();
      //   aCSS.p_ud_replaceSync(uDark.inject_css_override);
      //   x.adoptedStyleSheets=[aCSS];
      //   return x;
      
      // })
      uDark.functionPrototypeEditor(Node, [
        Node.prototype.appendChild,
        Node.prototype.insertBefore
      ], (elem, args) => {
        (args[0].o_ud_textContent = uDark.edit_str(args[0].textContent));
        return args
      }, (elem, value) => elem instanceof HTMLStyleElement)
      
      
      /******************** BUT ********************** */
      // Here are all the cases when editing a style element can affect the page style, and there is a lot of them
      // I encountered innerHTML  appendChild and insertBefore so far, but there are all these cases in the wild
      
      if (false) {
        let ite = undefined
        var testStyle = document.createElement("style")
        
        testStyle.outerHTML += testStyle.outerHTML + testStyle.outerHTML.slice(0, -8) + ".test20 {color:red!important}" + "</style>" // has no effects
        document.querySelectorAll(".test").forEach(w => w.remove())
        document.head.appendChild(testStyle)
        testStyle.classList.add("test")
        testStyle.append(ite = document.createTextNode("invalid"))
        testStyle.replaceChildren(document.createTextNode(".test1 {color:red!important}"))
        
        testStyle.textContent += ".test16{color:red!important}"
        testStyle.innerHTML += ".test17 {color:red!important}"
        testStyle.innerText += ".test18 {color:red!important}"
        testStyle.outerText // Replaces the element by some text, unsuitable
        testStyle.append(ite = document.createTextNode("invalid"))
        testStyle.replaceChild(document.createTextNode(".test2 {color:red!important}"), ite)
        testStyle.append(ite = document.createTextNode(".test3 {color:red!important}"))
        testStyle.prepend(ite = document.createTextNode(".test4 {color:red!important}"))
        
        ite.before(document.createTextNode(".test5 {color:red!important}"))
        ite.after(document.createTextNode(".test6 {color:red!important}"))
        testStyle.appendChild(ite = document.createTextNode(".test7 {color:red!important}"))
        testStyle.insertBefore(document.createTextNode(".test8 {color:red!important}"), ite)
        testStyle.append(ite = document.createTextNode(""))
        testStyle.append(ite = document.createTextNode("invalid"))
        ite.replaceWith(document.createTextNode(".test11 {color:red!important}"))
        testStyle.append(ite = document.createTextNode(""))
        ite.insertData(0, ".test9 {color:red!important}")
        ite.appendData(".test10 {color:red!important}")
        
        ite.replaceData(0, 0, ".test12 {color:red!important}")
        ite.data += ".test13 {color:red!important}"
        ite.nodeValue += ".test14 {color:red!important}"
        ite.textContent += ".test15 {color:red!important}"
        for (let i = 20; i; i--) {
          let title = document.createElement("div");
          title.classList.add("test" + i)
          title.classList.add("test")
          title.textContent = "Test #" + i;
          document.body.prepend(title)
        }
        
        testStyle.outerHTML += testStyle.outerHTML + testStyle.outerHTML.slice(0, -8) + ".test20 {color:red!important}" + "</style>"
      }
      /****************************************** */
      
      // FINALLY CNN Use this one (webpack)!!!!
      uDark.valuePrototypeEditor(Node, "textContent", (elem, value) => {
        return uDark.edit_str(value)
        
      }, (elem, value) => elem instanceof HTMLStyleElement || elem instanceof SVGStyleElement)
      
      uDark.valuePrototypeEditor(CSS2Properties, "background", (elem, value) => {
        let possiblecolor = uDark.is_color(value);
        return possiblecolor ? uDark.rgba(...possiblecolor) : value;
        
      })
      uDark.valuePrototypeEditor(CSS2Properties, "fill", (elem, value) => {
        let randIdentifier = Math.random().toString().slice(2)
        elem.floodColor = `var(--${randIdentifier})`
        return uDark.get_fill_for_svg_elem(document.querySelector(`[style*='${randIdentifier}]`) ||
        document.createElement('zz'), value || "currentColor", {
          notableInfos: {}
        });
      })
      // uDark.valuePrototypeEditor(CSSRule, "cssText", (elem, value) => uDark.edit_str(value)) // As far as I know, this is not affects to edit css text directly on CSSRule
      uDark.valuePrototypeEditor(CSSStyleDeclaration, "cssText", (elem, value) => uDark.edit_str_nochunk(value)) // However this one does ( on elements.style.cssText and on cssRules.style.cssText, it keeps the selector as is, but the css is edited: 'color: red')
      
      { // Note the difference in wich arg is edited in following functions: we-cant-group-them !
        
        uDark.functionPrototypeEditor(CSSStyleSheet, CSSStyleSheet.prototype.addRule, (elem, args) => [args[0], uDark.edit_str(args[1])])
        // Facebook classic uses insertRule
        uDark.functionPrototypeEditor(CSSStyleSheet, CSSStyleSheet.prototype.insertRule, (elem, args) => [uDark.edit_str(args[0]), args[1] || 0])
        
      }
      
      
      // uDark.valuePrototypeEditor(HTMLImageElement, "src", (elem, value) => {
        //   console.log(elem, value,"src","edited");
      //   uDark.registerBackgroundItem(false, `img[src='${value}']`,false)
      //   return value;
      // });
      
      // W3C uses this one
      
      
      
      uDark.valuePrototypeEditor(CSS2Properties, "backgroundColor", (elem, value) =>  uDark.edit_str_nochunk(["background-color:",value]).slice(18,-1)   )
      uDark.valuePrototypeEditor(CSS2Properties, "background-color", (elem, value) =>  uDark.edit_str_nochunk(["background-color:",value]).slice(18,-1)   )
      
      
      
      uDark.valuePrototypeEditor(CSS2Properties, "color", (elem, value) => uDark.edit_str_nochunk(["color:",value]).slice(7,-1))
      uDark.valuePrototypeEditor([HTMLElement, SVGElement], "style", (elem, value) => uDark.edit_str_nochunk(value)) // Care with "style and eget, this cause recursions"
      // TODO: Support CSS url(data-image) in all image relevant CSS properties like background-image etc
      
      uDark.valuePrototypeEditor(HTMLElement, "innerText", (elem, value) => {
        return uDark.edit_str(value)
      }, (elem, value) => value && (elem instanceof HTMLStyleElement)) // No innerText for SVGStyleElement, it's an HTMLElement feature
      
      console.info("UltimaDark", "Websites overrides ready", window, "elapsed:", performance.now() - start);
      
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
  