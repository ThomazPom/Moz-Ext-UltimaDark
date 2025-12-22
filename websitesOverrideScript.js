class WebsitesOverrideScript {
    static override_website = function () {

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

        uDark.info("Content script override website", window);
        
        uDark.ensureBestRGBAFuncRef();
        if (!uDark.userSettings.serviceWorkersEnabled && window.navigator.serviceWorker) {
            if (uDark.localStorageAvailable) {
                // Insecure operations have in common a non available localStorage
                window.navigator.serviceWorker.getRegistrations().then(rs => rs.map(x => x.unregister()))
            }
            delete Navigator.prototype.serviceWorker;
        }

        // Avoid infinite loops 
        if (window.uDark && window.uDark.installed) {
            return; // Already fully installed. Do not reinstall if somehow another uDark object gets injected in the page
        } else {
            uDark.installed = true;
        }
        {
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

        uDark.checkDomEdit = false;
        if (uDark.checkDomEdit) {


            uDark.functionPrototypeEditor(HTMLSourceElement, HTMLSourceElement.prototype.setAttribute, (elem, args) => {
                console.log("Debug Node mutation (setAttribute)", elem, args);
                return args;
            });
            uDark.functionPrototypeEditor(Node, [Node.prototype.insertBefore, Node.prototype.appendChild], (elem, args) => {
                console.error("Debug Node mutation (insertBefore, Node.prototype.appendChild)", elem, args, new Error().stack);
                return args;
            })
            uDark.functionPrototypeEditor(Node, Node.prototype.appendChild, (elem, args) => {
                console.log("Debug Node mutation (appendChild)", elem, args);
                return args;
            })
            uDark.functionPrototypeEditor(Element, Element.prototype.after, (elem, args) => {
                console.log("Debug Node mutation (after)", elem, args);
                return args;
            })
            uDark.functionPrototypeEditor(Document, Document.prototype.createElement, (elem, args) => {
                console.log("Debug Node mutation", elem, args);
                return args;
            })
            return;
        }





        uDark.info("Websites overrides install", window);
        // uDark.functionPrototypeEditor(HTMLObjectElement, HTMLObjectElement.prototype.checkValidity, (elem, args) => {
        //   return args;
        // })


        uDark.functionPrototypeEditor(CSSStyleDeclaration, CSSStyleDeclaration.prototype.setProperty, (elem, args) => {
            let edited = uDark.edit_str_nochunk(args[0] + ":" + args[1])
                .protect_simple(uDark.shortHandRegex, "--ud-setProperty-ptd-$1:");
            let cssParser = new CSSStyleSheet()
            cssParser.o_ud_replaceSync(`z{${edited}`);
            let cssStyle = cssParser.cssRules[0].style
            let keys = Object.values(cssParser.cssRules[0].style)
            let firstKey = keys.shift();
            // We dont need to unprotect since we know the first key from args[0], and there will be no addional keys in the css if a shorthand is used
            args[1] = cssStyle.getPropertyValue(firstKey);

            for (let key of /*remaining*/keys) {
                elem.o_ud_setProperty(key, cssStyle.getPropertyValue(key));
            }

            return args
        });
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
            uDark.valuePrototypeEditor([HTMLIFrameElement, HTMLEmbedElement], "src", uDark.frontEditHTMLPossibleDataURL);
            uDark.valuePrototypeEditor([HTMLObjectElement], "data", uDark.frontEditHTMLPossibleDataURL);
            uDark.valuePrototypeEditor([HTMLIFrameElement], "srcdoc", uDark.frontEditHTML);
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
        }, (attribute, value) => attribute.toLowerCase() == "style")

        uDark.valuePrototypeEditor(HTMLImageElement, "src", (image, value) => {
            // return value;
            let res = uDark.image_element_prepare_href(image, value);
            if (value.startsWith("data:")) {
                // image.o_ud_src = value;
                setTimeout(() => {
                    image.o_ud_src = res;
                }, 1);  // IDK how but web.whatsapp.com managed to go error when image.src is a data: URL and i edited it for a http url
                //So : return value; && wait a bit before setting the edited src. Not a clean solution but works for now.
                // Not a big deal since data: URLs set by JS are usually small does not impact performance significantly (No network request)
                return value;
            }
            return res;
        },
            false, // Condition: Inconditional
            //Aftermath: none
            false,
            (image, value) => { // Edited getter, to trick websites that are checking src integrity after setting it
                let returnVal = value.split(new RegExp("#?" + uDark.imageSrcInfoMarker))[0];
                if (returnVal.startsWith("https://data-image/?base64IMG=")) {
                    returnVal = returnVal.slice(30);
                }
                return returnVal;
            }

        );
        // (function () {
        //   const orig = HTMLImageElement.prototype.getAttribute;

        //   HTMLImageElement.prototype.getAttribute = function (name) {

        //     let res =   orig.call(this, name);

        //     if(name.toLowerCase()==="src")
        //     {
        //       console.log("Intercepted getAttribute src on",this);
        //       return this.src; // Use the edited src getter
        //     }
        //     else
        //     {
        //       console.log("getAttribute",name,"on",this,"returning",res);
        //     }
        //     // comportement original
        //     return res
        //   };
        // })();
        uDark.valuePrototypeEditor([HTMLSourceElement, HTMLImageElement], "srcset", (image, value) => {
            console.log("Editing srcset", image, value);
            let srcSourceArray = uDark.processSRCset(value).map(
                ([srcSource, descriptor]) => uDark.image_element_prepare_href(image, srcSource) + " " + descriptor
            );
            return srcSourceArray.join(", ");

        },
            // false, // Condition: Inconditional
            // //Aftermath: none
            // false,
            // (image, value) => { // Edited getter, to trick websites that are checking src integrity after setting it
            //   let srcSourceArray = uDark.processSRCset(image.getAttribute("srcset")).map(
            //     ([srcSource, descriptor]) => {
            //       let returnVal = value.split(new RegExp("#?" + uDark.imageSrcInfoMarker))[0];
            //       if (returnVal.startsWith("https://data-image/?base64IMG=")) {
            //         returnVal = returnVal.slice(30) + " " + descriptor;
            //       }
            //       return returnVal;
            //     }
            //   );
            //   return srcSourceArray.join(", ");

            // }

        );

        // function makeSmartElement(tag) {
        //   const el = document.createElement(tag);
        //   return new Proxy(el, {
        //     get(target, prop) {

        //       console.log(`[${tag}] Getting ${prop}`);
        //       const value = Reflect.get(target, prop, target);
        //       return typeof value === "function" ? value.bind(target) : value;
        //     },
        //     set(target, prop, value) {
        //       console.log(`[${tag}] Setting ${prop} =`, value);
        //       return Reflect.set(target, prop, value, target);
        //     }
        //   });
        // }

        // // Exemple
        // const source = makeSmartElement("source");
        // source.src = "bar.mp4"; // log OK
        // source.src

        uDark.valuePrototypeEditor(SVGImageElement, "href", (image, value) => { // the <image> tag inside an SVG, no an <img> tag !
            return uDark.image_element_prepare_href(image, value);
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
        uDark.valuePrototypeEditor([HTMLLinkElement, HTMLScriptElement], "integrity", (elem, value) => {
            console.log("CSS integrity set", elem, value);
            // elem.addEventListener("error", z => linkIntegrityErrorEvent(elem), { once: true, capture: true });
            elem.origIntegrity = value;
            return value;
        }, false, (elem, value) => {
            elem.removeAttribute("integrity");
        },
            (elem, value) => { // Edited getter, to trick websites that are checking integrity after setting it
                console.log("CSS integrity get", elem, value);
                return elem.origIntegrity;
            }
        )

        uDark.functionWrapper(SVGSVGElement, SVGSVGElement.prototype.setAttribute, "setAttribute", function (elem, args) {
            elem.addEventListener("js_svg_loaded", z => uDark.frontEditSVG(elem));
            setTimeout(() => elem.dispatchEvent(new Event("js_svg_loaded")), 50);
            return [elem, args]
        },
            (elem, args) => args[0] == "viewBox")

        uDark.functionWrapper(HTMLUnknownElement, HTMLUnknownElement.prototype.setAttribute, "setAttribute", function (elem, args) {
            elem.addEventListener("js_svg_loaded", z => uDark.frontEditSVG(elem));
            setTimeout(() => elem.dispatchEvent(new Event("js_svg_loaded")), 50);
            return [elem, args]
        },
            (elem, args) => args[0] == "viewBox" && elem.tagName == "SVG")

        // uDark.valuePrototypeEditor(SVGSVGElement, "viewBox", (elem, value) => {
        //   console.log("Viewbox set on",elem,value);
        //   return value;
        // })



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

        uDark.functionPrototypeEditor(DOMParser, DOMParser.prototype.parseFromString, (elem, args) => {
            // Catching the parsing of the document, to edit it before it's inserted in the DOM, is in the philosophy of UltimaDark of doing things at key moments.
            // parseFromString is a key moment, as it manipulates strings. insertBefore, used with an instanciated element for instance is not a key moment, as we could have edited the element before.
            let strict_xml_val = args[1] && args[1].includes("xml") ? args[1] : false;
            args[0] = uDark.frontEditHTML("ANY_ELEMENT", args[0], undefined, { STRICT_XML: strict_xml_val })
            // console.log(args)
            return args
        }, (text, type) => ["text/html", "application/xhtml+xml"].includes(type))




        uDark.functionPrototypeEditor(Node, [ // So far we assume the CSS inserted in HTMStyleElements via appendChild or insertBefore are valid. This migh not always be the case, this is to keep in mind.
            Node.prototype.appendChild,
            Node.prototype.insertBefore
        ], (elem, args) => {
            (args[0].o_ud_textContent = uDark.edit_str(args[0].textContent));
            return args
        }, function () { return this instanceof HTMLStyleElement });
        // Canvas 2D full tracer (methods + properties) — ES2020
        if (0) {
            (() => {
                const P = CanvasRenderingContext2D.prototype;

                // Sauvegardes pour un unpatch propre
                const Originals = new Map(); // key: name, value: { type: 'method'|'prop', desc|fn }

                // 1) Wrap des méthodes
                for (const name of Object.getOwnPropertyNames(P)) {
                    const desc = Object.getOwnPropertyDescriptor(P, name);
                    if (!desc) continue;

                    if (typeof desc.value === "function") {
                        const origFn = desc.value;
                        // Évite de re-wrapper si déjà fait
                        if (Originals.has(name)) continue;

                        function wrapped(...args) {
                            try { console.log("[Canvas2D call]", name, args); } catch { }
                            // Important : conserver le this natif
                            return origFn.apply(this, args);
                        }

                        // Préserver toString pour éviter les détections grossières
                        try {
                            Object.defineProperty(wrapped, "toString", {
                                configurable: true,
                                value: Function.prototype.toString.bind(origFn)
                            });
                        } catch { }

                        Originals.set(name, { type: "method", fn: origFn });

                        // Redéfinir en conservant les attributs
                        Object.defineProperty(P, name, {
                            ...desc,
                            value: wrapped
                        });
                    }
                }

                // 2) Wrap des propriétés (get/set) — ex: fillStyle, font, globalAlpha…
                const protoDescs = Object.getOwnPropertyDescriptors(P);
                for (const [name, desc] of Object.entries(protoDescs)) {
                    const hasGetter = typeof desc.get === "function";
                    const hasSetter = typeof desc.set === "function";
                    if (!hasGetter && !hasSetter) continue;

                    // Sauvegarder une seule fois
                    if (!Originals.has(name)) Originals.set(name, { type: "prop", desc });

                    // Créer des wrappers qui délèguent aux accesseurs d’origine
                    const wrappedDesc = { ...desc };
                    if (hasGetter) {
                        const g = desc.get;
                        wrappedDesc.get = function () {
                            const v = g.call(this);
                            // Optionnel: log lecture (verbeux)
                            // try { console.log("[Canvas2D get]", name, v); } catch {}
                            return v;
                        };
                        try {
                            Object.defineProperty(wrappedDesc.get, "toString", {
                                configurable: true,
                                value: Function.prototype.toString.bind(g)
                            });
                        } catch { }
                    }
                    if (hasSetter) {
                        const s = desc.set;
                        wrappedDesc.set = function (v) {
                            const before = hasGetter ? desc.get.call(this) : undefined;
                            try { console.log("[Canvas2D set]", name, { from: before, to: v }); } catch { }
                            if (name == "fillStyle") {
                                v = `hsl(${360 * Math.random()}deg,100%,75%)`;
                            }
                            if (name == "strokeStyle") {
                                v = `hsl(${360 * Math.random()}deg,100%,75%)`;
                            }
                            return s.call(this, v);
                        };
                        try {
                            Object.defineProperty(wrappedDesc.set, "toString", {
                                configurable: true,
                                value: Function.prototype.toString.bind(s)
                            });
                        } catch { }
                    }

                    try {
                        Object.defineProperty(P, name, wrappedDesc);
                    } catch {
                        // Certains moteurs refusent la redéfinition : ignorer proprement
                    }
                }

                // 3) Unpatch optionnel
                window.__unpatchCanvas2DPrototypeTracer = function () {
                    for (const [name, rec] of Originals.entries()) {
                        if (rec.type === "method") {
                            const desc = Object.getOwnPropertyDescriptor(P, name);
                            if (desc && typeof desc.value === "function") {
                                Object.defineProperty(P, name, { ...desc, value: rec.fn });
                            }
                        } else if (rec.type === "prop") {
                            try { Object.defineProperty(P, name, rec.desc); } catch { }
                        }
                    }
                    Originals.clear();
                };
            })();

        }
        else if (1) {
            {
                uDark.functionPrototypeEditor(CanvasRenderingContext2D, [
                    CanvasRenderingContext2D.prototype.createLinearGradient,
                    CanvasRenderingContext2D.prototype.createRadialGradient,
                    CanvasRenderingContext2D.prototype.createConicGradient
                ], (elem, args) => args, true,
                    (result, context2D, watcher_result, args, originalFunction) => {
                        console.log("Gradient created", result, context2D, args, originalFunction);
                        result.lightGradient = originalFunction.apply(context2D, args);
                        return result;
                    }
                );
                uDark.functionPrototypeEditor(CanvasGradient, CanvasGradient.prototype.addColorStop, (elem, args) => {
                    let light = uDark.eget_color(args[1], uDark.revert_rgba);
                    let dark = uDark.eget_color(args[1], uDark.rgba);
                    console.log("Gradient color stop", elem, args, light, dark);
                    elem.lightGradient.o_ud_addColorStop(args[0], light);
                    args[1] = dark;
                    return args;
                });
            }

            let gradientCompat = (light, elem) => {
                if (elem.fillStyle.lightGradient) {
                    if (light) {
                        elem.fillStyle = elem.fillStyle.lightGradient;
                    }
                    return true;
                }

            }
            let patternCompat = (elem) => {
                return elem.fillStyle instanceof CanvasPattern;
            }


            let darken_canvas = (elem, args) => {

                if (gradientCompat(false, elem) || patternCompat(elem)) {
                    return args;
                }

                elem.currentFillStyle = elem.fillStyle;
                elem.fillStyle = uDark.eget_color(elem.fillStyle, uDark.rgba);
                // // elem.fillStyle = "lime";
                return args
            }
            let lighten_canvas = (elem, args) => {

                if (gradientCompat(true, elem) || patternCompat(elem)) {
                    return args;
                }
                elem.currentFillStyle = elem.fillStyle;
                elem.fillStyle = uDark.eget_color(elem.fillStyle, uDark.revert_rgba);
                return args
            }
            let darken_canvas_stroke = (elem, args) => {

                if (gradientCompat(false, elem) || patternCompat(elem)) {
                    return args;
                }
                elem.currentStrokeStyle = elem.strokeStyle;
                elem.strokeStyle = uDark.eget_color(elem.strokeStyle, uDark.rgba);
                return args
            }
            let lighten_canvas_stroke = (elem, args) => {

                if (gradientCompat(true, elem) || patternCompat(elem)) {
                    return args;
                }
                elem.currentStrokeStyle = elem.strokeStyle;
                elem.strokeStyle = uDark.eget_color(elem.strokeStyle, uDark.revert_rgba);
                return args
            }
            // uDark.valuePrototypeEditor(CanvasRenderingContext2D, "fillStyle", (elem, value) => {
            //   elem.refilled=true
            //   return value; // uDark.edit_str(value)
            // })
            //  uDark.valuePrototypeEditor(CanvasRenderingContext2D, "strokeStyle", (elem, value) => {
            //   elem.restroked=true
            //     // return "lime"
            //   if(value == "#c0c0c0" || value == "rgba(192,192,192,1)")
            //     {
            //       console.warn("Stroke style set to silver, changing to lime");
            //     return "lime"
            //   }
            //   if(value == "rgba(196,199,197,1)")
            //   {
            //     //red
            //     console.warn("Stroke style set to red, changing to red");
            //     return "red";
            //   }
            //   if(value == "rgba(31,31,31,0.133)")
            //   {
            //     console.warn("Stroke style set to dark gray, changing to blue");
            //     return "blue";
            //   }
            //   console.log("Stroke style set to", value);
            //   return value; // uDark.edit_str(value)

            // })
            // uDark.functionPrototypeEditor(HTMLCanvasElement , HTMLCanvasElement.prototype.getContext, (elem, args) => {
            //   elem.fillStyle = "red";
            //   elem.strokeStyle = "red";
            //   return args;
            // })

            // uDark.functionPrototypeEditor(CanvasRenderingContext2D, CanvasRenderingContext2D.prototype.stroke, (elem, args  ) => {
            //   console.log("CanvasRenderingContext2D.prototype.stroke", elem, args,elem.strokeStyle);
            //   // elem.o_ud_strokeStyle = "yellow";
            //   elem.o_ud_strokeStyle = uDark.eget_color(elem.strokeStyle, uDark.revert_rgba);
            //   return args;
            // })
            uDark.functionPrototypeEditor(CanvasRenderingContext2D, CanvasRenderingContext2D.prototype.fillRect, darken_canvas)
            uDark.functionPrototypeEditor(CanvasRenderingContext2D, CanvasRenderingContext2D.prototype.fill, darken_canvas)
            uDark.functionPrototypeEditor(CanvasRenderingContext2D, CanvasRenderingContext2D.prototype.fillText, lighten_canvas)
            uDark.functionPrototypeEditor(CanvasRenderingContext2D, CanvasRenderingContext2D.prototype.stroke, lighten_canvas_stroke)
            uDark.functionPrototypeEditor(CanvasRenderingContext2D, CanvasRenderingContext2D.prototype.strokeText, darken_canvas_stroke)
            uDark.functionPrototypeEditor(CanvasRenderingContext2D, CanvasRenderingContext2D.prototype.strokeRect, darken_canvas_stroke)
        }
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
            if (!console.warn("Fill not reimplented", elem, value)) { return value };
            let randIdentifier = Math.random().toString().slice(2)
            elem.floodColor = `var(--${randIdentifier})`
            return uDark.get_fill_for_svg_elem(elem.getRootNode().querySelector(`[style*='${randIdentifier}]`) ||
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
            let edited = uDark.edit_all_cssRule_colors_cb({
                style: elem
            }, "background", value, {}, {
                l_var: "--uDark_transform_darken",
                prefix_vars: "bg",
                raw_text: true,
                no_edit: true,
                js_static_transform: uDark.rgba
            });
            return edited;


        }

        uDark.valuePrototypeEditor(CSS2Properties, "background", bg_websiteEditFn)

        uDark.valuePrototypeEditor(CSS2Properties, "backgroundColor", bg_websiteEditFn)
        uDark.valuePrototypeEditor(CSS2Properties, "background-color", bg_websiteEditFn)



        uDark.valuePrototypeEditor(CSS2Properties, "color", (elem, value) => {

            let edited = uDark.edit_all_cssRule_colors_cb({
                style: elem
            }, "color", value, {}, {
                l_var: "--uDark_transform_lighten",
                h_var: "--uDark_transform_text_hue",
                fastValue0: true,
                no_edit: true,
                js_static_transform: uDark.revert_rgba
            });
            elem.columnRuleColor = value;
            elem.o_ud_setProperty("--stealthColor", elem.columnRuleColor)
            return edited;
        }, false, false,
            elem => elem.getPropertyValue("--stealthColor") || elem.o_ud_color // Bein steath sometime is mandatory, like for https://www.startpage.com/
        );
        uDark.valuePrototypeEditor([HTMLElement, SVGElement], "style", (elem, value) => uDark.edit_str_nochunk(value)) // Care with "style and eget, this cause recursions"
        // TODO: Support CSS url(data-image) in all image relevant CSS properties like background-image etc

        uDark.valuePrototypeEditor(HTMLElement, "innerText", (elem, value) => {
            return uDark.edit_str(value)
        }, (elem, value) => value && (elem instanceof HTMLStyleElement)) // No innerText for SVGStyleElement, it's an HTMLElement feature

        console.info("UltimaDark", "Websites overrides ready", window, "elapsed:", performance.now() - start);

    }
}