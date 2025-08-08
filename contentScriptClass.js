class uDarkExtendedContentScript  {
  
  is_content_script =  true
  website_context = true // Tell ultimadark we are in a website context and is_color_var is available
  
  install() {
    uDark.exportFunction = globalThis.exportFunction; // Don't override the exportFunction function, but make it available to ultimadark
    console.info("UltimaDark", "Content script install", window);     
    
    if (uDark.direct_window_export) {
      
      [
        ["this.uDarkExtended = class {};this.uDarkC=",uDarkC],
        z=>{
          window.uDark=new uDarkC();
        },
        AllLevels.install,
        uDark.override_website
        
        
      ].map(code => {
        let codeStr = code.join?code.map(x=>x.toString()).join("\n"): "(" + code.toString()  + ")()";
        window.wrappedJSObject.eval( codeStr );
      });
      
    }
    
    window.wrappedJSObject.uDark.userSettings = cloneInto({  // Preserve user privacy by not exporting sensible settings to the page
      disable_cache: window.userSettings.disable_cache,
      keep_service_workers:window.userSettings.keep_service_workers,
      disable_image_edition: window.userSettings.disable_image_edition,
    }, window);
    window.wrappedJSObject.userSettingsReadyAction()
    
    
    
    browser.runtime.connect({ // Connect to the background script to register the edition of subresources
      name: "port-from-cs"
    });
    setTimeout(() => {
      
    this.fixUnprocessedCSSinterval();
    }, 1000);
  }
  toFixCSS=new Set();
  fixedCSS= new Set();

  fixUnprocessedCSSinterval() {  
    console.log(this.toFixCSS, "Unprocessed CSS", this.toFixCSS.size);
    let launch = z=>{
      [...document.styleSheets].filter(x=>x.href && x.ownerNode && !this.fixedCSS.has(x) && !this.toFixCSS.has(x)).forEach(css=>{
        this.toFixCSS.add(css);
      });
      this.fixUnprocessedCSS();
    } 
    launch()
    let CSSFixInterval = setInterval(launch,50);
    setTimeout(() => {
      clearInterval(CSSFixInterval);
      console.log("Stopping unprocessed CSS fix interval", this.toFixCSS.size, "unprocessed CSS left");
    }, 5000);
  }
  fixUnprocessedCSS() {   
    uDark.toFixCSS.forEach(css=>{
      let rule0=css.cssRules[0];
      let testResult = rule0?.href?.endsWith("/ultimaDark.css");
      if(testResult)
      {
        this.toFixCSS.delete(css); // Remove the CSS from the set it works
      }
      if(rule0 && !testResult){
      document.body.style.color = "lime";
          let imageURLObject = new URL(css.href);
          imageURLObject.searchParams.set("uDark-reload", Math.random());
          css.ownerNode.href=imageURLObject.href
          uDark.log("Fixed unprocessed CSS",css,rule0);
          this.toFixCSS.delete(css);
          this.fixedCSS.add(css);
       }
       
      });
    }    
    linkIntegrityErrorEvent = function(elem) {
      // This fix is needed for some websites that use link integrity, i don't know why but sometime even removing the integrity earlier in the code does not work
      uDark.info("Link integrity error", elem,  "lead to a reload of this script");
      let href = elem.getAttribute("href");
      href && elem.setAttribute("href",uDark.addNocacheToStrLink(href) );
      elem.removeAttribute("onerror");
      
    }
    override_website = function() {
      // Note : We dont support document.write() yet. Shoudl we find a way to monitor document.close?
      /*
      I need to check if i can catch the automatic or explicit document.close
      or use an event
      window.addEventListener("DOMContentLoaded", () => {
        // Code to run after all document.write operations are complete
      });
      or if its safe to frontEdit HTML the document.write args
      
      
      { // Quick try
      const originalClose = Document.prototype.close;
      window.addEventListener("DOMContentLoaded", () => {
        console.log('UtimaDark',"DOMContentLoaded")
      // Code to run after all document.write operations are complete
      });
      // Override document.close
      Document.prototype.close = function() {
      console.log("Intercepted document.close");
      // Place any additional actions here that should happen after the last document.write
      // Call the original close to ensure the document is properly closed
      originalClose.call(this);
      };
      }
      */
      try {
        typeof localStorage;
        uDark.localStorageAvailable = true;
      } catch (e) {
        // uDark.log("UltimaDark", "Local storage is not available", e,document.location.href);
      }
      
      let start = performance.now();
      
      uDark.info( "Content script override website", window);
      
      
      
      uDark.website_context = true; // Tell ultimadark we are in a website context and is_color_var is available
      window.userSettingsReadyAction = function() {
        uDark.success("User settings ready", window.userSettings);
        if (!uDark.userSettings.keep_service_workers && window.navigator.serviceWorker) {
          if (uDark.localStorageAvailable) {
            // Insecure operations have in common a non available localStorage
            window.navigator.serviceWorker.getRegistrations().then(rs => rs.map(x => x.unregister()))
          }
          delete Navigator.prototype.serviceWorker;
        }
      }
      if (uDark.direct_window_export) {
        uDark.direct_window_context = true;
        document.wrappedJSObject = document;
        // Avoid infinite loops 
        if (window.uDark && window.uDark.installed) {
          return; // Already fully installed. Do not reinstall if somehow another uDark object gets injected in the page
        } else {
          uDark.installed = true;
        }
        
        
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
      
      
      
      
      
      
      
      uDark.info("Websites overrides install", window);
      uDark.functionPrototypeEditor(HTMLObjectElement,HTMLObjectElement.prototype.checkValidity, (elem, args) => {
        return args;
      })
      
      uDark.functionPrototypeEditor(CSSStyleDeclaration, CSSStyleDeclaration.prototype.setProperty, (elem, args) => {
        let edited = uDark.edit_str_nochunk(args[0] + ":" + args[1])
        .protect_simple(uDark.shortHandRegex, "--ud-setProperty-ptd-$1:");
        let cssParser = new CSSStyleSheet()
        cssParser.o_ud_replaceSync (`z{${edited }`);
        let cssStyle = cssParser.cssRules[0].style 
        let keys= Object.values(cssParser.cssRules[0].style)
        let firstKey = keys.shift();
        // We dont need to unprotect since we know the first key from args[0], and there will be no addional keys in the css if a shorthand is used
        args[1] = cssStyle.getPropertyValue(firstKey);
        
        for (let key of /*remaining*/keys ) {
          elem.o_ud_setProperty(key, cssStyle.getPropertyValue(key));
        }
        
        return args
      })
      
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
        }, (attribute, value ) => attribute.toLowerCase() == "style")
        
        uDark.valuePrototypeEditor(HTMLImageElement, "src", (image, value) => {
          let res = uDark.image_element_prepare_href(image, document, value);
          return res;
        },
        false, // Condition: Inconditional
        //Aftermath: none
        false,
        (image, value) => { // Edited getter, to trick websites that are checking src integrity after setting it
          let returnVal = value.split(new RegExp("#?"+uDark.imageSrcInfoMarker))[0];
          if(returnVal.startsWith("https://data-image/?base64IMG=")) {
            returnVal = returnVal.slice(30);
          }
          return returnVal;
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
      // uDark.valuePrototypeEditor([HTMLLinkElement,HTMLScriptElement], "integrity", (elem, value) => {
        //     console.log("CSS integrity set", elem, value);
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
      
      uDark.functionPrototypeEditor(DOMParser,   DOMParser.prototype.parseFromString, (elem, args) => {
        // Catching the parsing of the document, to edit it before it's inserted in the DOM, is in the philosophy of UltimaDark of doing things at key moments.
        // parseFromString is a key moment, as it manipulates strings. insertBefore, used with an instanciated element for instance is not a key moment, as we could have edited the element before.
        args[0]=uDark.frontEditHTML("ANY_ELEMENT",args[0])
        return args
      }, (text,type) => type == "text/html")
      
      
      
      uDark.functionPrototypeEditor(Node, [ // So far we assume the CSS inserted in HTMStyleElements via appendChild or insertBefore are valid. This migh not always be the case, this is to keep in mind.
        Node.prototype.appendChild,
        Node.prototype.insertBefore
      ], (elem, args) => {
        (args[0].o_ud_textContent = uDark.edit_str(args[0].textContent));
        return args
      }, function(){ return this instanceof HTMLStyleElement})
      
      
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
      
      
      uDark.valuePrototypeEditor(CSS2Properties, "fill", (elem, value) => {
        if(!console.warn("Fill not reimplented", elem, value))
          {return value};
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
      
      let bg_websiteEditFn = (elem, value) => {
        let edited =   uDark.edit_all_cssRule_colors_cb({
          style:elem
        }, "background", value, {}, {
          l_var:"--uDark_transform_darken",
          prefix_vars: "bg",
          raw_text: true,
          no_edit: true
        }) 
        return edited;
        
        
      }
      
      uDark.valuePrototypeEditor(CSS2Properties, "background", bg_websiteEditFn)
      
      uDark.valuePrototypeEditor(CSS2Properties, "backgroundColor",  bg_websiteEditFn   )
      uDark.valuePrototypeEditor(CSS2Properties, "background-color",  bg_websiteEditFn  )
      
      
      
      uDark.valuePrototypeEditor(CSS2Properties, "color", (elem, value) => {
        
        let edited =   uDark.edit_all_cssRule_colors_cb({
          style:elem
        }, "color", value, {},  {
          l_var: "--uDark_transform_lighten",
          h_var: "--uDark_transform_text_hue",
          fastValue0:true,
          no_edit: true
        }) 
        return edited;
      })
      uDark.valuePrototypeEditor([HTMLElement, SVGElement], "style", (elem, value) => uDark.edit_str_nochunk(value)) // Care with "style and eget, this cause recursions"
      // TODO: Support CSS url(data-image) in all image relevant CSS properties like background-image etc
      
      uDark.valuePrototypeEditor(HTMLElement, "innerText", (elem, value) => {
        return uDark.edit_str(value)
      }, (elem, value) => value && (elem instanceof HTMLStyleElement)) // No innerText for SVGStyleElement, it's an HTMLElement feature
      
      console.info("UltimaDark", "Websites overrides ready", window, "elapsed:", performance.now() - start);
      
    }
  }