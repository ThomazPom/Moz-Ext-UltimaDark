const dark_object = {
  
  all_levels: {
    install: function() {
      { // Any level protected proptotypes
        CSS2Properties.prototype.p_ud_setProperty = CSS2Properties.prototype.setProperty;
      } {
        // Very special functions
        String.prototype.hashCode = function(under = 100, over = 0) {
          var hash = 0,
          i, chr;
          if (this.length === 0) return hash;
          for (i = 0; i < this.length; i++) {
            chr = this.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
          }
          hash += 2147483647 + 1;
          hash %= under;
          if (hash <= over) {
            hash = (this + "z").hashCode(under, over)
          }
          return hash;
        };
      }
      
      const CSS_COLOR_NAMES = ["AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "DarkOrange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray", "Grey", "Green", "GreenYellow", "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "RebeccaPurple", "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen"]
      window.uDark = {
        rgb_a_colorsRegex: /rgba?\([%0-9., \/a-z_+*-]+\)/gmi, // rgba vals with variables names and calcs involved NOTE: #rgba(255 255 255 / 0.1) is valid color rgba(255,255,255,30%) is valid color too
        hsl_a_colorsRegex: /hsla?\(([%0-9., \/=a-z_+*-]|deg|turn|tetha)+\)/gmi, // hsla vals  with variables names and calcs involved  #rgba(255 255 255 / 0.1)
        direct_window_export: true,
        enable_idk_mode: true,
        general_cache: {},
        userSettings: {},
        imageSrcInfoMarker:"_uDark",
        imageWorkerJsFile: "imageWorker.js",
        regex_search_for_url: /url\("(.+?)(?<!\\)("\))/g,
        background_match: /background|sprite|(?<![a-z])(bg|box|panel|fond|fundo|bck)(?![a-z])/i,
        logo_match: /nav|avatar|logo|icon|alert|notif|cart|menu|tooltip|dropdown|control/i,
        chunk_stylesheets_idk_only_cors: false,
        namedColorsRegex: (new RegExp(`(?<![_a-z0-9-])(${CSS_COLOR_NAMES.join("|")})(?![_a-z0-9-])`, "gmi")),
        min_bright_fg: 0.65, // Text with luminance  under this value will be brightened
        max_bright_fg: 1, // Text over this value will be darkened
        brightness_peak_editor_fg: 0.5, // Reduce the brightness of texts with intermediate luminace, tying to achieve better saturation
        hueShiftfg: 0, // Hue shift for text, 0 is fno shift, 360 is full shift
        min_bright_bg_trigger: 0.2, // backgrounds with luminace under this value will remain as is
        min_bright_bg: 0.1, // background with value over min_bright_bg_trigger will be darkened from this value up to max_bright_bg
        max_bright_bg: 0.4, // background with value over min_bright_bg_trigger will be darkened from min_bright_bg up to this value
        
        str_protect: function(str, regexSearch, protectWith) {
          // sore values into an array:
          var values = str.match(regexSearch);
          if (values) {
            str = str.replace(regexSearch, protectWith);
          }
          return {
            str,
            values,
            protectWith
          };
        },
        
        str_unprotect: function(str, protection) {
          if (protection.values) {
            protection.values.forEach((value, index) => {
              // I've learnt the hard way tto care about some $' or $1 the protected value:
              // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement
              // This is why we use a function to replace the protected value
              // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_function_as_the_replacement
              str = str.replace(protection.protectWith, ()=>value);
            })
          }
          return str;
        },
        str_protect_numbered: function(str, regexSearch, protectWith, condition = true) {
          // sore values into an array:
          if (!condition) {
            return false;
          }
          var values = str.match(regexSearch);
          if (values) {
            let index = 0;
            str = str.replace(regexSearch, function(match, g1) {
              return protectWith.replace("{index}", index++);
            });
          }
          return {
            str,
            values,
            protectWith
          };
        },
        str_unprotect_numbered: function(str, protection, condition = true) {
          if (protection.values && condition) {
            protection.values.forEach((value, index) => {
              // I've learnt the hard way tto care about some $' or $1 the protected value:
              // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement
              // This is why we use a function to replace the protected value
              // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_function_as_the_replacement
              
              str = str.replace(protection.protectWith.replace("{index}", index), ()=>value);
            })
          }
          return str;
        },
        
        sRGBtoLin: (colorChannel) => {
          // Send this function a decimal sRGB gamma encoded color value
          // between 0.0 and 1.0, and it returns a linearized value.
          
          if (colorChannel <= 0.04045) {
            return colorChannel / 12.92;
          } else {
            return Math.pow(((colorChannel + 0.055) / 1.055), 2.4);
          }
        },
        getLuminance: (r, g, b) => {
          return (0.2126 * uDark.sRGBtoLin(r / 255) + 0.7152 * uDark.sRGBtoLin(g / 255) + 0.0722 * uDark.sRGBtoLin(b / 255));
        },
        getPerceivedLigtness: (r, g, b) => {
          return uDark.YtoLstar(uDark.getLuminance(r, g, b));
        },
        YtoLstar: (Y) => {
          // Send this function a luminance value between 0.0 and 1.0,
          // and it returns L* which is "perceptual lightness"
          
          if (Y <= (216 / 24389)) { // The CIE standard states 0.008856 but 216/24389 is the intent for 0.008856451679036
            return Y * (24389 / 27); // The CIE standard states 903.3, but 24389/27 is the intent, making 903.296296296296296
          } else {
            return Math.pow(Y, (1 / 3)) * 116 - 16;
          }
        },
        do_idk_mode_timed: function(duration, interval) {
          if (!uDark.enable_idk_mode) {
            return;
          }
          // Repeat IDK mode every n ms for a certain time
          duration = duration || uDark.idk_mode_duration || 5000;
          interval = interval || uDark.idk_mode_interval || 50;
          clearInterval(uDark.do_idk_mode_interval)
          let interval_id = setInterval(function() {
            // console.log("IDK mode launched")
            uDark.do_idk_mode();
          }, interval)
          uDark.do_idk_mode_interval = interval_id;
          setTimeout(function() {
            // console.log("IDK mode stopped after" ,duration,"ms and",  (duration/interval)+" execs");
            clearInterval(interval_id) // Use interval_id to avoid next intervals. If we use uDark.do_idk_mode_interval, it may clear the new interval_id we just created and stored in uDark.do_idk_mode_interval
          }, duration)
          return interval_id;
        },
        
        do_idk_mode: function() {
          let editableStyleSheets = [...document.wrappedJSObject.styleSheets].filter(styleSheet => {
            if (styleSheet.idk_mode_ok) {
              return false; // This one is still OK
            }
            styleSheet.idk_mode_ok = true; // This attribute is lost if the stylesheet is edited, so we can ignore this CSS.
            
            if (styleSheet.ownerNode.id == "UltimaDarkTempVariablesStyle") {
              return false; // Created on the document of the content script and becomes a cors stylesheet. It's already IDK resolved
            }
            if (styleSheet.href) {
              
              let styleSheetHref = (new URL(styleSheet.href))
              let is_cross_domain = styleSheetHref.origin != document.location.origin;
              
              return !is_cross_domain && !uDark.chunk_stylesheets_idk_only_cors; // If it is cross domain, we will do it via a message to the background script
              
            } else if (styleSheet.ownerNode.classList.contains("ud-idk-vars")) {
              return true;
            }
            return false; // Stylesheet has no href, it is a style element, and is not declared by background as needing IDK intervention.
          });
          editableStyleSheets.forEach(styleSheet => {
            // console.log("Will edit",styleSheet)
            uDark.edit_cssRules(styleSheet.cssRules, true);
          });
        },
        search_container_logo: function(element, notableInfos) {
          
          let parent = (element.parentNode || element)
          parent = (parent.parentNode || parent)
          return uDark.logo_match.test(parent.outerHTML + notableInfos.uDark_cssClass)
        },
        search_clickable_parent(documentElement, selectorText) {
          return documentElement.querySelector(`a ${selectorText},button ${selectorText}`);
        },
        image_element_prepare_href: function(image, documentElement, src_override,options={}) // Adds notable infos to the image element href, used by the image edition feature
        {
          // Do not parse url preventing adding context to it or interpreting it as a relative url or correcting its content by any way
          let imageTrueSrc = src_override || image.getAttribute("src")
          
          if (uDark.userSettings.disable_image_edition || !imageTrueSrc) {
            
            return imageTrueSrc;
          }
          
          if (!image.hasAttribute("data-ud-selector")) {
            image.setAttribute("data-ud-selector", Math.random());
          }
          let selectorText = image.tagName+`[data-ud-selector='${image.getAttribute("data-ud-selector")}']`;
          let notableInfos = {};
          for (const attribute of image.attributes) {
            if (attribute.value.length > 0 && !(/[.\/]/i).test(attribute.value) && !(["src","data", "data-ud-selector"]).includes(attribute.name)) {
              notableInfos[attribute.name] = attribute.value;
            }
          }
          if (imageTrueSrc.includes(uDark.imageSrcInfoMarker)) {
            return imageTrueSrc;
          }
          if (uDark.search_clickable_parent(documentElement, selectorText)) {
            notableInfos.inside_clickable = true;
          }
          if (uDark.search_container_logo(image, notableInfos)) {
            notableInfos.logo_match = true;
          }
          let usedChar = uDark.imageSrcInfoMarker;
          if (!imageTrueSrc.includes("#")) {
            usedChar = "#"+usedChar;
          }
          imageTrueSrc = uDark.send_data_image_to_parser(imageTrueSrc, false, {...options, notableInfos, image});
          
          return imageTrueSrc + usedChar + new URLSearchParams(notableInfos).toString();
        },
        valuePrototypeEditor: function(leType, atName, setter = x => x, conditon = false, aftermath = false,getter=false) {
          //   console.log(leType,atName)
          // if (conditon) {
          //   console.log("VAdding condtition to", leType, leType.name, conditon, conditon.toString())
          // }
          if (leType.concat) {
            return leType.forEach(aType => uDark.valuePrototypeEditor(aType, atName, setter, conditon, aftermath, getter))
          }
          
          if (leType.wrappedJSObject) { // Cross compatibilty with content script
            leType = leType.wrappedJSObject;
          }
          
          var originalSet = Object.getOwnPropertyDescriptor(leType.prototype, atName);
          if (!originalSet) {
            console.log("No setter for '", atName, "'", leType, leType.name, leType.prototype)
          }
          Object.defineProperty(leType.prototype, "o_ud_set_" + atName, {
            set: originalSet.set
          });
          let override_get_set = {};
          if(setter){
            override_get_set.set = globalThis.exportFunction(function(value) { // getters must be exported like regular functions
              var new_value = (!conditon || conditon(this, value)===true) ? setter(this, value) : value;
              let call_result = originalSet.set.call(this, new_value || value);
              aftermath && aftermath(this, value, new_value);
              return call_result;
            }, window);
          }
          if(getter){
            let originalGet = Object.getOwnPropertyDescriptor(leType.prototype, atName);
            if (!originalGet) {
              console.log("No getter for '", atName, "'", leType, leType.name, leType.prototype)
            }
            Object.defineProperty(leType.prototype, "o_ud_get_" + atName, {
              get: originalGet.get
            });
            override_get_set.get = globalThis.exportFunction(function() { // getters must be exported like regular functions
              // console.log("Getting", this, atName)
              let call_result = originalGet.get.call(this);
              return getter(this, call_result);
            }, window);
          }
          
          // uDark.general_cache["o_ud_set_"+atName]=originalSet
          Object.defineProperty(leType.prototype, atName, override_get_set);
        },
        functionWrapper: function(leType, laFonction, fName, watcher = x => x, conditon = true, result_editor = x => x) {
          let originalFunction = leType.prototype["o_ud_wrap_" + fName] = laFonction;
          leType.prototype[fName] = function(...args) {
            if (conditon===true || conditon(this, arguments) === true) {
              let watcher_result = watcher(this, arguments);
              let result = originalFunction.apply(...watcher_result)
              return result_editor(result, this, watcher_result);
            } else {
              return (originalFunction.apply(this, arguments));
            }
          }
        },
        functionPrototypeEditor: function(leType, laFonction, watcher = x => x, conditon = x => x, result_editor = x => x,getter) {
          //  console.log(leType,leType.name,leType.prototype,laFonction,laFonction.name)
          if (laFonction.concat) {
            return laFonction.forEach(aFonction => {
              uDark.functionPrototypeEditor(leType, aFonction, watcher, conditon, result_editor)
            })
          }
          if (leType.wrappedJSObject) { // Cross compatibilty with content script
            leType = leType.wrappedJSObject;
          }
          // if (conditon) {
          //   console.log("Adding condtition to", leType, leType.name, laFonction, conditon, conditon.toString())
          // }
          leType.prototype.count=(leType.prototype.count||0)+1;
          if(!Object.getOwnPropertyDescriptor(leType.prototype, laFonction.name))
            {
            console.log("No getter for '", leType,laFonction,new Error(),leType.prototype.count,document.location.href)
            return;
          }
          let originalFunctionKey = "o_ud_" + laFonction.name
          var originalFunction = globalThis.exportFunction(Object.getOwnPropertyDescriptor(leType.prototype, laFonction.name).value, window);
          Object.defineProperty(leType.prototype, originalFunctionKey, {
            value: originalFunction,
            writable: true
          });
          Object.defineProperty(leType.prototype, laFonction.name, {
            value: {
              [laFonction.name]: globalThis.exportFunction(function() {
                if (conditon===true || conditon(this, arguments)) {
                  // console.log("Setting",leType,laFonction,this,arguments[0],watcher(this, arguments)[0])
                  let watcher_result = watcher(this, arguments);
                  // console.log("watcher_result", this,originalFunction,watcher_result,originalFunctionKey,leType.prototype[originalFunctionKey],this[originalFunctionKey],this.getP);
                  let result = originalFunction.apply(this, watcher_result)
                  return result_editor(result, this, arguments, watcher_result);
                } else {
                  return (originalFunction.apply(this, arguments));
                }
              }, window)
            } [laFonction.name]
          });
        },
        
        // At-rules : https://developer.mozilla.org/fr/docs/Web/CSS/At-rule
        // @charset, @import or @namespace, followed by some space or \n, followed by some content, followed by ; or end of STRING
        // Surpisingly and fortunately end of LINE does not delimits the end of the at-rule and forces devs & minifers either to add a ; or end of STRING 
        // which and fortunately simplifies a LOT the handling 
        // 'm' flag is not set on purpose to avoid matching $ as a line end, and keeping it at end of STRING
        // Content must not be interupted while between quotes or parenthesis.
        // It wont break on string ("te\"st") or this one('te\'st') or @import ('abc\)d;s'); thanks to
        // priority matches (\\\)) and (\\') and (\\")  
        //-------------------v-Rule name----space or-CR--v-----v--Protected values-v----v-the content dot
        cssAtRulesRegex: /@(charset|import|namespace)(\n|\s)+((\((\\\)|.)+?\))|("(\\"|.)+?")|('(\\'|.)+?')|.)+?(;|$)/gs,
        
        edit_str_restore_imports_all_way: function(str, rules) {
          // This regexp seems a bit complex
          // because @import url("") can includes ";" which is also the css instruction separator like in following example
          // @charset "UTF-8";@import url("https://use.typekit.net/lls1fmf.css");
          // @import url("https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap");
          // .primary-1{ color: rgb(133, 175, 255); }
          
          // This code is sensible to some edge cases, like @rules put in a comment, or in a string, and this is why i now use the protect system
          // It was breaking https://www.pascalgamedevelopment.com/content.php .
          // It would be possible to fix this by adding a condition to the regex to avoid matching @rules in comments or strings, but it would be a bit more complex
          // Or even protecting the @rules individually wit a numbered css class, but it would be a bit more complex too regarding the occurences of the @rules in strings or comments
          
          let imports = str.match(uDark.cssAtRulesRegex) || [];
          rules.unshift(...imports);
          
        },
        send_data_image_to_parser: function(str, details, options) {
          
          // uDark..disable_data_image_edition=true;
          if (str.trim().toLowerCase().startsWith('data:') && !uDark.userSettings.disable_image_edition && !uDark.disable_data_image_edition) {
            let {b64,dataHeader,data,failure} = options.cut || uDark.decodeBase64DataURIifIsDataURI(str);
            let imageData = data;
            options.changed = true;
            
            if (!failure && dataHeader.includes('svg')) // Synchronous edit for data SVGs images, we have some nice context and functions to work with
            { // This avoids loosing svg data including the size of the image, and the tags in the image
              uDark.disable_svg_data_url_edition = false;
              options.svgImage = true;
              options.svgDataImage = true;
              if (uDark.disable_svg_data_url_edition) {
                return str;
              }
              options.get_document=true;
              
              if(!b64){
                
                // This replaces searches for unencoded % in image data, and replaces them by the equivalent %25.
                // Some websites uses % in their svg data eg for percentage value, while not encoding them.
                // This results in a probalby broken image, since we are in a dataURL image.
                // UltimaDark team dont care too much about this,but it can lead to decodeURI errors. and therefore to a broken page. 
                imageData=imageData.replace(/%(?![0-9a-z]{2})/gi,"%25")  
                imageData=decodeURIComponent(imageData);
              }
              
              imageData = uDark.frontEditHTML(false, imageData, details, options).body.innerHTML;
              
              let encoded=undefined;
              // uDark.disable_reencode_data_svg_to_base64=true;
              if (uDark.disable_reencode_data_svg_to_base64) {
                if(b64){
                  dataHeader=dataHeader.replace("base64","")
                };
                encoded = dataHeader + encodeURIComponent(imageData)
              } else if(uDark.respect_site_svgs_dataurls){
                if(!b64){
                  imageData=encodeURIComponent(imageData);
                }
                let encoded = uDark.rencodeToURI(imageData, dataHeader, b64);
                if(encoded.message){
                  console.warn(encoded)
                  encoded=encodeURIComponent(imageData);
                }
                str=encoded;
              }
              else{
                if(!b64){
                  encoded=uDark.rencodeToURI(imageData, dataHeader.split(",").join(";base64,"), true);
                }
                else{
                  encoded=uDark.rencodeToURI(imageData, dataHeader, true);
                }
                if(encoded.message){
                  console.warn(encoded)
                  encoded=encodeURIComponent(imageData);
                  encoded=rencodeToURI(encoded, dataHeader.replace("base64",""), false);
                }
                
                
              }
              
              str=encoded;
            } else {
              
              str = "https://data-image?base64IMG=" + str; // Sending other images to the parser via the worker,
              if (options.image) {
                options.image.removeAttribute("crossorigin"); // data images are not CORS with this domain, so we remove the attribute to avoid CORS errors
              }
            }
          }
          return str;
        },
        get_fill_for_svg_elem: function(fillElem, override_value = false, options = {}, class_name = "udark-fill", transform = true) {
          let fillValue = override_value || fillElem.getAttribute("fill");
          if (override_value == "none" || !uDark.is_color(fillValue)) {
            fillValue = "#000000";
          }
          if (["animate"].includes(fillElem.tagName)) {
            return fillValue
          } // fill has another meaning for animate
          let is_text = options.notableInfos.guessed_type == "logo" || ["text", "tspan"].includes(fillElem.tagName);
          
          if (!is_text && ["path"].includes(fillElem.tagName)) {
            let draw_path = fillElem.getAttribute("d");
            // Lot of stop path in in path, it's probably a text
            is_text = draw_path && ([...draw_path.matchAll(/Z/ig)].length >= 2 || draw_path.length > 170)
            
          }
          fillElem.setAttribute("udark-edit", true);
          fillElem.setAttribute(class_name, `${options.notableInfos.guessed_type}${is_text?"-text":""}`);
          if (transform) {
            let edit_result = uDark.transform_color(fillValue, {
              prefix_fg_vars: is_text
            }, is_text ? uDark.revert_rgba_rgb_raw : uDark.rgba_rgb_raw)
            return edit_result.new_value;
          }
          return is_text
        },
        frontEditSVG: function(svg, documentElement, details, options = {}) {
          if (uDark.userSettings.disable_image_edition) {
            return;
          }
          uDark.edit_styles_attributes(svg, details, options);
          uDark.edit_styles_elements(svg, details, "ud-edited-background", options);
          options = {
            ...options, // Do not edit the original object, it may be used by other functions by reference
            notableInfos: options.notableInfos || {},
            lighten: uDark.revert_rgba_rgb_raw,
            darken: uDark.rgba_rgb_raw,
          }
          svg.setAttribute("udark-fill", true);
          svg.setAttribute("udark-id", Math.random());
          let svgUdarkId = svg.getAttribute("udark-id");
          if (!options.notableInfos.inside_clickable) {
            if (uDark.search_clickable_parent(documentElement, `svg[udark-id='${svgUdarkId}']`)) {
              options.notableInfos.inside_clickable = true;
            }
          }
          
          if (!options.notableInfos.logo_match) {
            if (uDark.search_container_logo(svg, options.notableInfos)) {
              options.notableInfos.logo_match = true;
            }
          }
          if (options.notableInfos.logo_match || options.notableInfos.inside_clickable) {
            options.notableInfos.guessed_type = "logo";
          }
          
          if (options.notableInfos.guessed_type == "logo") {
            
            svg.setAttribute("fill", "white");
            // svg.removeAttribute("fill");
            // svg.setAttribute("fill", "currentColor");
            
            if (options.remoteSVG || options.svgDataImage) // If there is no style element, we don't need to create one
            {
              let styleElem = document.createElement("style");
              styleElem.id = "udark-styled";
              styleElem.append(document.createTextNode(uDark.inject_css_override))
              styleElem.append(document.createTextNode("svg{color:white}")) // Allows "currentColor" to take effect
              
              svg.append(styleElem);
            }
            
          }
          svg.querySelectorAll("[fill]:not([udark-fill])").forEach(fillElem => {
            fillElem.setAttribute("fill", uDark.get_fill_for_svg_elem(fillElem, false, options))
          })
          svg.querySelectorAll("[stroke]:not([udark-stroke])").forEach(fillElem => {
            fillElem.setAttribute("stroke", uDark.get_fill_for_svg_elem(fillElem, fillElem.getAttribute("stroke"), options).replace(/currentColor/i, "white"), "udark-stroke")
          })
          // svg.querySelectorAll("circle").forEach(fillElem => {
            //   fillElem.setAttribute("ud-brightness-"+fillElem.outerHTML.hashCode(60,35), true);
          
          //    fillElem.setAttribute("fill", "black");
          // })
          
          // let all_svg_elems=svg.querySelectorAll(":not(udark-edit)");
          // all_svg_elems.forEach((fillElem,index) => {
            //   if(fillElem.hasAttribute("fill")){
          //     return;
          //   }
          //   let is_text=uDark.get_fill_for_svg_elem(fillElem, false,{notableInfos:{}},class_name="udark-gradient",transform=false)
          //   if(!is_text){
          //      fillElem.setAttribute("ud-brightness-"+Math.floor((uDark.min_bright_bg+(index/all_svg_elems.length))*100), true);
          //   }
          
          // });
          
          svg.setAttribute("udark-guess", options.notableInfos.guessed_type);
          svg.setAttribute("udark-infos", new URLSearchParams(options.notableInfos).toString());
          
        },
        edit_styles_attributes: function(parentElement, details, options = {}) {
          parentElement.querySelectorAll("[style]").forEach(astyle => {
            // console.log(details,astyle,astyle.innerHTML,astyle.innerHTML.includes(`button,[type="reset"],[type="button"],button:hover,[type="button"],[type="submit"],button:active:hover,[type="button"],[type="submi`))
            astyle.setAttribute("style", uDark.edit_str(astyle.getAttribute("style"), false, false, details, false, options));
          });
          
        },
        edit_styles_elements: function(parentElement, details, add_class = "ud-edited-background", options = {}) {
          parentElement.querySelectorAll(`style:not(.${add_class})`).forEach(astyle => {
            astyle.innerHTML = uDark.edit_str(astyle.innerHTML, false, false, details, false, options);
            // astyle.innerHTML='*{fill:red!important;}'
            // According to https://stackoverflow.com/questions/55895361/how-do-i-change-the-innerhtml-of-a-global-style-element-with-cssrule ,
            // it is not possible to edit a style element innerHTML with its cssStyleSheet alone
            // As long as we are returing a STR, we have to edit the style element innerHTML;
            // astyle.innerHTML=uDark.edit_css(astyle.innerHTML,astyle.sheet);
            if (options.hasUnresolvedVars_idk_vars) {
              astyle.classList.add("ud-idk-vars"); // Allows IDK mode to edit this eligible style element
            }
            astyle.classList.add(add_class)
          });
        },
        frontEditHTML: function(elem, strO, details, options = {}) {
          // 1. Ignore <script> elements to prevent unintended modifications to JavaScript
          let value = strO;
          if (elem instanceof HTMLScriptElement) {
            return value;
          }
          
          // 2. Special handling for <style> and <svg> style elements (returns edited value directly)
          if (elem instanceof HTMLStyleElement || elem instanceof SVGStyleElement) {
            return uDark.edit_str(value, false, false, undefined, false, options);
          }
          
          if (!value.includes("body")) {
            // 3. Ensure the HTML is encapsulated within a <body> tag, especially for non-encapsulated HTML
            value = "<body>" + value + "</body>";
          }
          
          // 4. Replace <noscript> tags with <template> to bypass restrictions
          // The issue isn't with <noscript> itself, but with any disallowed tag inside the <head>, including those within <noscript>. Many sites make this mistake.
          // The allowed tags in the <head> are: <base>, <link>, <meta>, <style>, <title>, <script>, <noscript>, and <template>.
          // The <noscript> tag has restricted child elements when placed in the <head>; it only allows <link>, <style>, and <meta>.
          // The <template> tag, on the other hand, has no such restrictions and can contain any type of child elements, even in the <head>.
          // The <script> tag is also somewhat unrestricted as it allows raw text content.
          value = value.replaceAll(/<(\/)?noscript/g, "<$1template secnoscript");
          
          // 5. Parse the HTML string into a DOM document
          const aHtmlDocument = uDark.createDocumentFromHtml(value);
          const documentElement = aHtmlDocument.documentElement;
          
          // 16. Restore <noscript> elements that were converted to <template>
          uDark.restoreTemplateElements(documentElement);
          
          // 17. Remove the integrity attribute from elements and replace it with a custom attribute
          uDark.restoreIntegrityAttributes(documentElement);
          
          // 6. Process meta tags to ensure proper charset handling
          uDark.processMetaTags(documentElement);
          
          
          // 7. Restore or set the color-scheme meta tag for dark mode handling this is not usefull since we do all with css color-scheme attribute wich is prevalent
          // <meta name="color-scheme" content="dark light"> Telling broswer order preference for colors 
          // Makes input type checkboxes and radio buttons to be darkened
          // documentElement.querySelectorAll("meta[name='color-scheme']").forEach(udMetaDark => {
            //   udMetaDark.id = "ud-meta-dark";
          //   udMetaDark.name = "color-scheme";
          //   udMetaDark.content = "dark";
          // });
          
          // 8. Temporarily replace all SVG elements to avoid accidental style modifications
          const svgElements = uDark.processSvgElements(documentElement, details);
          
          // 9. Edit styles and attributes inline for foreground elements
          uDark.edit_styles_attributes(documentElement, details);
          uDark.edit_styles_elements(documentElement, details, "ud-edited-background");
          
          // 10. Modify inline styles found in the document
          uDark.processInlineStyles(documentElement);
          
          // 11. Add a custom identifier to favicon links to manage cache
          uDark.processLinks(documentElement);
          
          // 12. Process image sources and prepare them for custom modifications
          uDark.processImages(documentElement);
          
          // 13. Recursively process iframes using the "srcdoc" attribute by applying the same editing logic
          uDark.processIframes(documentElement, details, options);
          
          // 14. Handle elements with color attributes (color, bgcolor) and ensure proper color handling
          uDark.processColoredItems(documentElement);
          
          // 15. Restore the original SVG elements that were temporarily replaced
          uDark.restoreSvgElements(svgElements);
          
          
          // 18. After all the edits, return the final HTML output
          
          if(options.get_document){
            return aHtmlDocument;
          }
          
          let resultEdited = value.includes("body") && !options.no_body ? documentElement.outerHTML : aHtmlDocument.body.innerHTML;
          
          return resultEdited;
        },
        
        createDocumentFromHtml: function(html) {
          // Use DOMParser to convert the HTML string into a DOM document
          const parser = new DOMParser();
          return parser.parseFromString(html, "text/html");
        },
        
        processSvgElements: function(documentElement, details) {
          let svgElements = [];
          // Temporarily replace all SVG elements to avoid accidental style modifications
          documentElement.querySelectorAll("svg").forEach(svg => {
            const tempReplace = document.createElement("svg_secured");
            svgElements.push([svg, tempReplace]);
            svg.replaceWith(tempReplace);
            // Edit SVG styles separately, before main style editing
            uDark.frontEditSVG(svg, documentElement, details);
          });
          return svgElements;
        },
        
        processMetaTags: function(documentElement) {
          // Ensure that content-type meta tags are properly set to avoid charset issues
          documentElement.querySelectorAll("meta[http-equiv]").forEach(m => {
            if (m.httpEquiv && m.httpEquiv.toLowerCase().trim() === "content-type" && m.content.includes("charset")) {
              m.content = "text/html; charset=utf-8";
            }
          });
        },
        
        processInlineStyles: function(documentElement) {
          // Modify inline styles by adjusting the style attribute of elements
          documentElement.querySelectorAll("[style]").forEach(astyle => {
            astyle.setAttribute("style", uDark.edit_str(astyle.getAttribute("style")));
          });
        },
        
        processLinks: function(documentElement) {
          // Append a custom identifier to favicon links to manage cache more effectively
          documentElement.querySelectorAll("link[rel*='icon' i][href]").forEach(link => {
            link.setAttribute("href", link.getAttribute("href") + "#ud_favicon");
          });
        },
        decodeBase64DataURIifIsDataURI: function(maybeBase64DataURI) {
          maybeBase64DataURI=maybeBase64DataURI.trim();
          if(!maybeBase64DataURI.startsWith("data:")){
            return {b64:false,dataHeader:false,data:maybeBase64DataURI};
          }
          let commaIndex = maybeBase64DataURI.indexOf(","); // String.splt is broken: It limits the number of elems in returned array instead of limiting the number of splits
          let [dataHeader, data] = [maybeBase64DataURI.substring(0, commaIndex+1).toLowerCase().trim(), maybeBase64DataURI.substring(commaIndex + 1)]
          if(!dataHeader.includes("base64")){
            return {b64:false,dataHeader,data}
          }
          try{
            return {b64:true,dataHeader,data:atob(data)}
          }
          catch{
            console.warn("Error decoding base64 data URI",maybeBase64DataURI)
            return {b64:true,dataHeader:false,data:false,failure:true}
          }
        },
        rencodeToURI(data,dataHeader,base64=false){
          if(!dataHeader)
            {
            return data;
          }
          if(base64){
            try{
              return dataHeader+ btoa(data);
            }
            catch{
              return new Error("Error encoding base64 data URI",data)
            }
          }
          return dataHeader+data;
        },
        processImages: function(documentElement) {
          // Process image sources to prepare them for custom modifications
          documentElement.querySelectorAll("img[src]").forEach(image => {
            
            image.setAttribute("src", uDark.image_element_prepare_href(image, documentElement));
          });
          
        },
        frontEditHTMLPossibleDataURL: function(elem,value,details,options,documentElement) {
          
          let {b64,dataHeader,data,failure}=uDark.decodeBase64DataURIifIsDataURI(value);
          if(!failure && dataHeader){
            if(dataHeader.includes("image")){
              return uDark.image_element_prepare_href(elem,documentElement||document,value,{...options,cut:{b64,dataHeader,data}});
            }
            else if(dataHeader.includes("html")){
              data=uDark.frontEditHTML(elem, data, details, options)
              return uDark.rencodeToURI(data,dataHeader,b64);
            }
          }
          return value;
        },
        processIframes: function(documentElement, details, options) {
          // Recursively process iframes that use the "srcdoc" attribute by applying the same HTML processing function
          documentElement.querySelectorAll("iframe[srcdoc]").forEach(iframe => {
            iframe.setAttribute("srcdoc", uDark.frontEditHTML(false, iframe.srcdoc, details));
          });
          
          
          documentElement.querySelectorAll("object[data],embed[src],iframe[src]").forEach(object => {
            object.setAttribute(object.src?"src":"data", uDark.frontEditHTMLPossibleDataURL(object, object.src||object.data, details,options,documentElement));
          });
        },
        
        processColoredItems: function(documentElement) {
          // Process elements with color or bgcolor attributes and ensure proper color handling
          documentElement.querySelectorAll("[color],[bgcolor]").forEach(coloredItem => {
            for (let [key, afunction] of Object.entries(uDark.attributes_function_map)) {
              if (typeof afunction === "string") {
                afunction = uDark.attributes_function_map[afunction];
              }
              let attributeValue = coloredItem.getAttribute(key);
              if (attributeValue && attributeValue.startsWith("#") && attributeValue.length === 6) {
                attributeValue += "0"; // Ensure colors are properly formatted
              }
              const possibleColor = uDark.is_color(attributeValue, true, true);
              if (possibleColor) {
                let callResult = afunction(...possibleColor, uDark.rgba_val, coloredItem);
                if (callResult) {
                  coloredItem.setAttribute(key, callResult);
                }
              }
            }
          });
        },
        
        injectStylesIfNeeded: function(documentElement, details) {
          // Inject custom CSS and the dark color scheme meta tag if this is the first data load
          if (details.dataCount === 1) {
            
            // Stopped using inject_css_suggested, as it was causing issues with some websites, like react ones that stats with a minimal body
            // const udStyle = document.createElement("style");
            // udStyle.textContent = uDark.inject_css_suggested;
            // udStyle.id = "ud-style";
            // documentElement.head.prepend(udStyle);
            // console.log(documentElement.head,documentElement.documentElement.outerHTML)
            const udMetaDark = documentElement.querySelector("meta[name='color-scheme']") || document.createElement("meta");
            udMetaDark.id = "ud-meta-dark";
            udMetaDark.name = "color-scheme";
            udMetaDark.content = "dark";
            documentElement.head.prepend(udMetaDark);
          }
        },
        
        restoreSvgElements: function(svgElements) {
          // Restore the original SVG elements that were temporarily replaced
          svgElements.forEach(([svg, tempReplace]) => {
            tempReplace.replaceWith(svg);
          });
        },
        
        restoreTemplateElements: function(aDocument) {
          // Restore <noscript> elements that were converted to <template>
          
          // Using replaceWith() instead of innerHTML to avoid issues with nested elements wich were HTMLencoded
          aDocument.querySelectorAll("template[secnoscript]").forEach(template => {
            let noScript=document.createElement("noscript");
            for(let node of template.attributes){
              noScript.setAttribute(node.name,node.value)
            }
            noScript.append(template.content);
            template.replaceWith(noScript);
          });
        },
        
        restoreIntegrityAttributes: function(aDocument) {
          // Remove the integrity attribute from elements and store it as a custom attribute
          aDocument.querySelectorAll("[integrity]").forEach(integrityElem => {
            integrityElem.setAttribute("data-no-integ", integrityElem.getAttribute("integrity"));
            integrityElem.removeAttribute("integrity");
          });
        },
        
        str_protect_simple: function(str, regex, protectWith, condition = true) {
          if (condition) {
            str = str.replaceAll(regex, protectWith)
          }
          return str;
        },
        str_unprotect_simple: function(str, protectedWith, condition = true) {
          if (condition) {
            str = str.replaceAll(protectedWith, "")
          }
          return str;
        },
        
        /* 
        Took comments from w3.org/csswg-drafts/css-syntax-3/#comments
        First part: \/\*[^*]*\*+([^/*][^*]*\*+)*\/ — This matches valid CSS comments.
        Second part: \/\*[^*]*\*+([^/*][^*]*\*+)* — This matches incomplete comments that look like they are improperly closed (badcomment1).
        Third part: \/\*[^*]*(\*+[^/*][^*]*)* — This also matches another form of incomplete comments (badcomment2).
        */
        exactAtRuleProtect: true,
        matchAllCssCommentsRegex: /\/\*[^*]*\*+([^/*][^*]*\*+)*\/|\/\*[^*]*\*+([^/*][^*]*\*+)*|\/\*[^*]*(\*+[^/*][^*]*)*/g,
        edit_str: function(strO, cssStyleSheet, verifyIntegrity = false, details, idk_mode = false, options = {}) {
          
          let str = strO;
          
          if (strO.includes("/*!sc*/")) { // TODO: Fix thins in abetter way; this is a temporary and specific fix; 
            console.log("SCSS detected", uDark.edit_str);
            uDark.edit_str.last_debugged = {
              strO,
              cssStyleSheet,
              verifyIntegrity,
              details,
              idk_mode,
              options
            };
            return strO;
          }
          // Protection of imports
          // Unfortunately, this could lead to a reparation of a broken css if the chunking splits the @import in two parts
          // We might someday encounter this very improbable case, and have to check if the last rule is an unclosed @rule, while having some rules before it and reject the CSS chunk
          // In the end the chunk would eventualy come back contatenated with the next chunk, and then we could edit it properly.
          let import_protection = strO.protect_numbered(uDark.cssAtRulesRegex, "udarkAtRuleProtect{index} { }", uDark.exactAtRuleProtect)
          
          str = import_protection.str;
          str = str.protect_simple(uDark.shortHandRegex, "--ud-ptd-$1:", uDark.is_background);
          
          if (!cssStyleSheet) {
            cssStyleSheet = new CSSStyleSheet()
            let valueReplace = str + (verifyIntegrity ? "\n.integrity_rule{}" : "");
            cssStyleSheet.o_ud_replaceSync ? cssStyleSheet.o_ud_replaceSync(valueReplace) : cssStyleSheet.replaceSync(valueReplace);
          } else if (!cssStyleSheet.rules.length) {
            return strO; // Empty styles from domparser can't be edited as they are not "constructed"
          }
          
          let rejected_str = false;
          
          // Protection of CSS shorthand properties, 
          // let protected_comments=str.protect(uDark.matchAllCssCommentsRegex,"");
          // str=protected_comments.str;
          
          let nochunk = !verifyIntegrity && !cssStyleSheet.cssRules.length // if we want to check integrity, it means we have a chunked css
          
          if (nochunk) {
            // Here if :
            // - We only have properties like background: white; 
            // - We only have @imports, namespace and @charset: well terminated by a ";" but not a single valid rule while not caring about integrity
            if (import_protection.values) {
              return strO;
            }
            str = `z{${str}}`;
            cssStyleSheet.o_ud_replaceSync ? cssStyleSheet.o_ud_replaceSync(str) : cssStyleSheet.replaceSync(str);
            uDark.edit_css(cssStyleSheet, false, details, options);
            str = cssStyleSheet.cssRules[0].cssText.slice(4, -2);
          } else {
            /* This does not exist anymore, as we are repairing import locations in the CSS with the import protection, integrity will allways be verifiable.
            // Exists the rare case where css only do imports, no rules with {} and integrity cant be verified because it does not close the import with a ";"
            let returnAsIs = (!cssStyleSheet.cssRules.length && !strO.includes("{")); // More reliable than checking if it starts with an a @ at it may starts with a comment 
            // let returnAsIs = (!cssStyleSheet.cssRules.length && import_protection.values); // More reliable than checking if it starts with an a @ at it may starts with a comment 
            
            if (returnAsIs) {
            console.log("Returning as is", strO);
            return strO; //don't even try to edit it .
            // Fortunately it is not a common case, easy to detect with zero cssRules, and it mostly are short strings testables with includes
            };
            */
            
            if (verifyIntegrity) {
              let last_rule = cssStyleSheet.cssRules[cssStyleSheet.cssRules.length - 1];
              let is_rejected = !last_rule || last_rule.selectorText != ".integrity_rule";
              if (is_rejected) {
                
                //
                let can_iterate = cssStyleSheet.cssRules.length > 1; // If there is only one rule, and it's rejected, we dont'have to find the previous one
                if (can_iterate && !uDark.disable_live_chunk_repair) // We accept CSS until it breaks, and cut it from there
                {
                  rejected_str = ""; // Pass from false to empty string
                  let max_iterations = 10; // Fix a limit for timing reasons
                  for (let i = 1; i <= max_iterations; i++) {
                    
                    // Lets find the last significant bracket.
                    // If we are in any part of the string we don't care about the last char as it is either not a bracket or not one that will permit us
                    // to fix the CSS. ( As it is in a broken state already)
                    let last_bracket_index = str.lastIndexOf("}", str.length - 2); // Doing what said above 
                    
                    // Reject CSS as a whole if we can't find a bracket for whaterver messed up CSS we have
                    if (last_bracket_index == -1) {
                      return new Error("Rejected integrity rule from live chunk repair")
                    }
                    
                    // Now we have two parts, the one we keep and the one we reject
                    rejected_str = str.substring(last_bracket_index + 1) + rejected_str;
                    
                    str = str.substring(0, last_bracket_index + 1)
                    
                    // Do we have a valid CSS now ? lets add an integrity rule to check it
                    let valueReplace = str + "\n.integrity_rule{}";
                    cssStyleSheet.replaceSync(valueReplace); // Asumig only background script will edit CSS with integrity verification, using replaceSync is ok
                    let last_rule = cssStyleSheet.cssRules[cssStyleSheet.cssRules.length - 1];
                    if (last_rule && last_rule.selectorText == ".integrity_rule") // We found our rule again, no need to iterate more, this means we have a valid CSS in str
                    {
                      break;
                    } else if (i == max_iterations) {
                      return new Error("Rejected integrity rule from live chunk repair, max iterations reached")
                    }
                  }
                } else { // We reject the whole CSS if it broken for any reason.( @media cut in midle of name like @medi.integrity rule), str sarting with a bracket, etc.
                  // Reasons are endless and if Firefox said the CSS is broken, we trust it.
                  //  console.log(can_iterate,cssStyleSheet,details.url,details.dataCount)
                  return new Error("Rejected integrity rule as a whole");
                }
              }
            }
            
            uDark.edit_css(cssStyleSheet, idk_mode, details, options);
            
            let rules = [...cssStyleSheet.cssRules].map(r => r.cssText);
            str = rules.join("\n");
            
            
          }
          str = str.unprotect_simple("--ud-ptd-", uDark.is_background).unprotect_numbered(import_protection, uDark.exactAtRuleProtect)
          if (rejected_str) {
            str = {
              str: str,
              rejected: rejected_str,
            }
          }
          
          return str;
        },
        rgba_val: function(r, g, b, a) {
          a = typeof a == "number" ? a : 1;
          return "rgba(" + (r) + "," + (g) + "," + (b) + "," + (a) + ")";
        }, // https://perf.link : Concatenation is better than foramting
        hsla_val: function(h, s, l, a) {
          a = typeof a == "number" ? a : 1;
          return "hsla(" + (h * 360) + " " + (s * 100) + "% " + (l * 100) + "% / " + (a) + ")";
        },
        hex_val: function(r, g, b, a) {
          a = typeof a == "number" ? a : 1
          return "#" +
          r.toString(16).padStart(2, "0") +
          g.toString(16).padStart(2, "0") +
          b.toString(16).padStart(2, "0") +
          (a == 1 ? "" : (a * 255).toString(16).padStart(2, "0"))
        },
        
        hslToRgb: (h, s, l) => {
          let r, g, b;
          
          if (s === 0) {
            r = g = b = l; // achromatic
          } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = uDark.hueToRgb(p, q, h + 1 / 3);
            g = uDark.hueToRgb(p, q, h);
            b = uDark.hueToRgb(p, q, h - 1 / 3);
          }
          
          return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        },
        
        hueToRgb: (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        },
        rgbToHsl: (r, g, b) => {
          (r /= 255), (g /= 255), (b /= 255);
          const vmax = Math.max(r, g, b),
          vmin = Math.min(r, g, b);
          let h, s, l = (vmax + vmin) / 2;
          
          if (vmax === vmin) {
            return [0, 0, l]; // achromatic
          }
          
          const d = vmax - vmin;
          s = l > 0.5 ? d / (2 - vmax - vmin) : d / (vmax + vmin);
          if (vmax === r) h = (g - b) / d + (g < b ? 6 : 0);
          if (vmax === g) h = (b - r) / d + 2;
          if (vmax === b) h = (r - g) / d + 4;
          h /= 6;
          
          return [h, s, l];
        },
        RGBToLightness_old: (r, g, b) => {
          
          const l = Math.max(r, g, b);
          const s = l - Math.min(r, g, b);
          return (2 * l - s) / 2;
        },
        RGBToLightness: (r, g, b) => {
          return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
        },
        RGBToLightness_fast: (r, g, b) => {
          /**
          * The optimized version is faster because it avoids the overhead of `Math.max` and `Math.min`
          * by using simple conditional comparisons with 3 params. This reduces function call overhead, leading to
          * better performance, especially when executed many times.
          */
          return (r > g ? (r > b ? r : b) : (g > b ? g : b)) +
          (r < g ? (r < b ? r : b) : (g < b ? g : b)) / 2;
        },
        
        eget_color: function(anycolor, editColorF = false, cssRule = false, no_color = false, fill = false) {
          
          if (!anycolor || !(anycolor = anycolor.trim())) { // Trying to trim sometime undefiend values was as source of problem in lot of sites
            return anycolor;
          }
          if (!cssRule) { // Cant have matched these values if we are  in a cssRule edit
            if (["unset", "inherit", "none"].includes(anycolor.toLowerCase())) {
              return anycolor
            }
          }
          let theColor = uDark.is_color(anycolor, true, fill, cssRule)
          if (!theColor) {
            
            // otherwise if it is not a color, we should warn as its a bug in regexpes
            // or frontend does not define a color correctly
            console.info(anycolor, " is not a color (It's ok if frontent does not define a color correctly)",
              // new Error()
            )
            if (no_color) {
              if (no_color === true) return anycolor;
              return no_color;
            }
            return editColorF ? editColorF(...[0, 0, 0, 1]) : [0, 0, 0, 1];
          }
          if (editColorF) {
            // Caller asks us to apply a transformation, probably rgba, hex or revert_rgba
            return editColorF(...theColor)
          }
          return theColor
          
        },
        is_color: function(possiblecolor, as_float = true, fill = false, cssRule, spanp = false) {
          let cache_key = `${possiblecolor}${as_float}${fill}`
          if (!uDark.userSettings.disable_cache && !spanp && uDark.general_cache[cache_key]) { // See https://jsben.ch/aXxCT for cache effect on performance
            return uDark.general_cache[cache_key];
          }
          if (!possiblecolor || possiblecolor === "none") { // none is not a color, and it not usefull to create a style element for it
            return false
          }
          if (uDark.website_context && possiblecolor.includes("var(")) {
            return uDark.is_color_var(possiblecolor, as_float, fill, cssRule, spanp)
          }
          
          let nonColor = "rgba(0, 0, 1, 0.11)"; // Spaces are important, we are looking for an exact match
          uDark.colorWork.canvasContext.fillStyle = nonColor;
          uDark.colorWork.canvasContext.fillStyle = possiblecolor;
          let result = uDark.colorWork.canvasContext.fillStyle;
          if (result == nonColor) {
            return false;
          }
          if (as_float) {
            if (result.startsWith("#")) {
              let hexColor = "0x" + result.slice(1);
              result = [(hexColor >> 16) & 0xFF, (hexColor >> 8) & 0xFF, hexColor & 0xFF]
            } else {
              {
                result = result.match(/[0-9\.]+/g).map(parseFloat)
              }
            }
            
            if (fill) {
              result = result.concat(Array(4 - result.length).fill(1))
            }
            
            if (!uDark.userSettings.disable_cache) {
              uDark.general_cache[cache_key] = result;
            }
            return result;
            
          }
          
        },
        is_color_var: function(possiblecolor, as_float = true, fill = false, cssRule, spanp = false, use_cache = true) {
          // Must restore spanp feature and use it in frontend capture with flood-color css attribute
          // to catch correctly assignments like style.color=rgba(var(--flood-color),0.5) instead of returning [0,0,0,0]
          
          // Helped by is_color_var and regexpes, we should not need this block
          if (!possiblecolor || possiblecolor === "none") { // none is not a color, and it not usefull to create a style element for it
            return false
          }
          
          let cache_key = `${possiblecolor}${as_float}${fill}`
          if (!uDark.userSettings.disable_cache && !spanp && use_cache && uDark.general_cache[cache_key]) {
            return uDark.general_cache[cache_key];
          }
          possiblecolor = possiblecolor.trim().toLowerCase();
          let option = new Option();
          let style = option.style;
          if (cssRule) {
            // apply specific class variables to style
            Object.values(cssRule.style).filter(x => x.startsWith("--")).forEach(x => {
              style.p_ud_setProperty(x, cssRule.style.getPropertyValue(x))
            })
          }
          
          style.floodColor = possiblecolor;
          
          let result = style.floodColor; // Must be done in 2 steps to avoid same value as possiblecolor
          
          if (!style.floodColor) {
            // Impossible color : browser said so
            return false;
          }
          if (possiblecolor.replace(/\)+$/, "") == style.floodColor.replace(/\)+$/, "")) {
            // Browser has a tendancy of repairing colors: var(--flood-color => var(--flood-color)
            // rgb => rgba(0,0,0,1) // rgba => rgba(0,0,0,1)
            // rgb(55,55,55,calc(1*1 => rgba(55,55,55,1)
            // rgb(55,55,55,var(--test, var(--test => rgb(55,55,55,var(--test, var(--test))
            // IDK how much else it can repair colors, but it is a good thing to know
            // Best solution i ffound i to remove the rightiests parenthesis and compare them
            // It does not affects spaces, it only appends parenthesis at the end of the string as far as I know
            // Browser said it is a color but doubt it is a valid one, we need a further check.
            document.head.appendChild(option);
            if ("o_ud_set_backgroundColor" in style) // Only working way to do it so far
            {
              style.o_ud_set_backgroundColor = possiblecolor;
            } else {
              style.backgroundColor = possiblecolor;
            }
            let computedStyle = getComputedStyle(option); // On invalid colors, background will be none here
            result = computedStyle.floodColor || possiblecolor; // Sometimes on frontend, computedStyle is empty, idk why. Looks like a bug in browser 
            
            if (computedStyle.floodColor != computedStyle.backgroundColor) // Probably an invalid color
            { // backgroundColor is the only poperty wich returns rgba(0, 0, 0, 0) an alpha value on unresolved vars/invalid 
              result = false;
            }
            
            option.remove();
          }
          if (result) {
            
            if (as_float) {
              result = result.match(/[0-9\.]+/g).map(parseFloat)
              if (fill) {
                result = result.concat(Array(4 - result.length).fill(1))
              }
            }
            
            if (!uDark.userSettings.disable_cache && use_cache) {
              uDark.general_cache[cache_key] = result;
            }
          }
          return result;
        },
        revert_rgba_rgb_raw(r, g, b, a, render = false) {
          render = (render || uDark.rgba_val)
          // console.log("I HAVE BEEN CALLED","revert_rgba_rgb_raw",[r, g, b, a].join("_"))
          let lightness = uDark.RGBToLightness(r, g, b);
          let lightenUnder = 127;
          let edit_under = 100;
          if (lightness < lightenUnder && lightness < edit_under) {
            let plightness = uDark.getPerceivedLigtness(r, g, b); // Adding perceived lightness for svg:
            // Otherwise [uDark.RGBToLightness(66,82,110)  ,uDark.getPerceivedLigtness(66,82,110) are greater than uDark.getPerceivedLigtness(0,89,146) ,uDark.RGBToLightness(0,89,146)  ]
            let edit_under_perceived = 35;
            if (plightness < edit_under_perceived) {
              [r, g, b] = [r, g, b].map((x) => {
                x = x + Math.pow(
                  // Very important to report lighenUnder here, to get the correct calculation
                  (lightenUnder - lightness) // The less the lightness the more the color is lightened
                  , 1.11); // Increase the lightening effect a bit
                  return x;
                  
                });
              }
            }
            return render(...[r, g, b], a);
          },
          rgba_rgb_raw: function(r, g, b, a, render = false) {
            render = (render || uDark.rgba_val)
            a = typeof a == "number" ? a : 1
            // console.log("I HAVE BEEN CALLED","rgba_rgb_raw",[r, g, b, a].join("_"))
            let lightness = uDark.RGBToLightness(r, g, b);
            let darkenAbove = 127;
            if (lightness > darkenAbove) {
              // [r,g,b]=[r,g,b].map((x)=>x/2);
              [r, g, b] = [r, g, b].map((x) => {
                x = x * Math.pow(
                  255 / (lightness + darkenAbove), // The more the lightness is high, the more the color is darkened
                  lightness / darkenAbove * 2.8 // The more the lightness is high, the more the darkeing is strong
                );
                return x;
              });
            }
            
            return render(...[r, g, b], a);
          },
          rgba: (r, g, b, a, render = false) => {
            // Lets remove any brightness from the color
            render = (render || uDark.rgba_val)
            a = typeof a == "number" ? a : 1
            
            let [h, s, l] = uDark.rgbToHsl(r, g, b);
            // This whole function could be combined in one line
            if (l > uDark.min_bright_bg_trigger) {
              
              let B = uDark.min_bright_bg;
              let A = uDark.max_bright_bg
              
              // // https://www.desmos.com/calculator/2prydrxwbf
              // l=Math.min(2*A*l,A+2*(B-A)*(l-0.5));
              // Same; Use a ternary operator to avoid calc twice the vakue of l line in min for comparison
              l = (l < 0.5) ? (2 * A * l) : (A + 2 * (B - A) * (l - 0.5));
              
              // Old way to do it, but accuracy is not as good as the above one
              // https://www.desmos.com/calculator/oqqi9nzonh
              // if (l > 0.5) {
              //   l = 1 - l; // Invert the lightness for bightest colors
              // }
              // l = Math.min(2 * l, -2 * l + 2) * (A - B) + B;
              
              [r, g, b] = uDark.hslToRgb(h, s, l);
            }
            
            return render(...[r, g, b], a);
          },
          revert_rgba: function(r, g, b, a, render) {
            render = (render || uDark.rgba_val)
            a = typeof a == "number" ? a : 1
            
            let [h, s, l] = uDark.rgbToHsl(r, g, b);
            let A = uDark.min_bright_fg
            let B = uDark.max_bright_fg
            
            //  l=l<0.5 // It would be nice to check if precalulating parts of ternary operator would be faster
            //   ?-0.7*l+1
            //   :0.7*l+0.3;
            // l = Math.min(2 * l, -2 * l + 2) * (A - B) + B;  // Concise but slower than the following one
            l = l < 0.5 // Benched it, it is faster than Math.min
            ?
            2 * l * (A - B) + B :
            2 * l * (B - A) + (2 * A - B);
            // l = Math.sin(Math.PI*l)*(A-B)+B;
            // l = Math.min(2 * l, -2 * l + 2) * (A - B) + B; // Was a good one, but we may boost saturation as folowing lines shows
            // Still not sure about the best way to do it ^ has implicity while indeed a saturation boost might be nice          
            // l = Math.pow(Math.min(2 * l, -2 * l + 2),E) * (A - B) + B;
            
            if (h > 0.66 && h < 0.72 && l > .60) {
              // FIXME: EXPERIMENTAL:
              h += 0.66 - 0.72; // Avoid blueish colors being purple 
            }
            
            // i dont like how saturation boost gives a blue color to some texts like gitlab's ones.
            // s=1-Math.pow(1-s,1/E); // Boost saturation proportionnaly as brightness decrease, but we could have a separate setting for saturation boost
            
            // h=h-(l-ol)/4; // Keep the same hue, but we could have a separate setting for hue shift
            
            [r, g, b] = uDark.hslToRgb(h, s, l);
            
            return render(...[r, g, b], a);
          },
          
          edit_cssRules: (cssRules, idk_mode = false, details, options = {}, callBack = uDark.edit_cssProperties, clean_empty_rules = false) => {
            [...cssRules].forEach(cssRule => {
              if (cssRule.cssRules && cssRule.cssRules.length) {
                uDark.edit_cssRules(cssRule.cssRules, idk_mode, details, options, callBack, clean_empty_rules);
                if (clean_empty_rules) {
                  for (let i = cssRule.cssRules.length - 1; i >= 0; i--) {
                    let cssStyle = cssRule.cssRules[i].style;
                    if (cssStyle && cssStyle.length == 0 || !cssStyle && cssRule.cssRules.length == 0) {
                      
                      // console.log("Deleted empty rule",cssRule.cssRules[i],"from",cssRule,cssStyle,cssStyle.length)
                      cssRule.deleteRule(i);
                    }
                  }
                }
                return;
              } else if (cssRule.style && cssRule.constructor.name != "CSSFontFaceRule") {
                callBack(cssRule, idk_mode, details, options);
                
              }
            })
          },
          
          edit_css_urls: function(cssStyle, cssRule, details, topLevelRule, options, vars) {
            if (uDark.userSettings.disable_image_edition) {
              return;
            }
            
            vars = vars || {};
            vars.property = vars.property || "background-image";
            let value = cssStyle.getPropertyValue(vars.property);
            // Its very neccessary to not edit property if they dont contain a url, as it changes a lot the CSS if there are shorthand properties involved : setting bacground image removes bacground property
            
            // Instead of registering the image as a background, we will encode the selector in the URL 
            // and register the image as a background image only when it is downloaded, in the filter script
            
            options = {
              ...options,
              changed: false
            }; // Do not edit the options object, it is shared between all calls
            
            value = value.replace(uDark.regex_search_for_url, (match, g1) => {
              //changed = true;
              let link = g1.trim();
              
              options.changed = true;
              
              let notableInfos = {
                "uDark_cssClass": encodeURI(cssRule.selectorText),
                "uDark_backgroundRepeat": cssStyle.backgroundRepeat,
              };
              options.notableInfos = notableInfos;
              link = uDark.send_data_image_to_parser(link, false, options);
              if (!options.svgImage) {
                let usedChar = (link.includes("#") ? "" : "#") + uDark.imageSrcInfoMarker
                link += usedChar + new URLSearchParams(notableInfos).toString();
              }
              return 'url("' + link + '")';
            })
            
            if (options.changed) {
              cssStyle.p_ud_setProperty(vars.property, value);
            }
            
          },
          
          css_properties_wording_action: function(cssStyle, keys, details, cssRule, topLevelRule, options) {
            keys.forEach(key => {
              let action = uDark.css_properties_wording_action_dict[key];
              
              if (action) {
                
                if (action.replace) {
                  let value = cssStyle.getPropertyValue(key);
                  cssStyle.p_ud_setProperty(key, value.replaceAll(...action.replace));
                }
                if (action.remove) {
                  cssStyle.removeProperty(key);
                }
                if (action.stickToProperty) {
                  let vars = action.stickToProperty;
                  let value = cssStyle.getPropertyValue(key)
                  let new_value = vars.stick(value, cssStyle, cssRule, details, topLevelRule, options);
                  cssStyle.p_ud_setProperty(vars.rKey, new_value);
                }
                if (action.stickConcatToPropery) {
                  let vars = action.stickConcatToPropery;
                  let value = cssStyle.getPropertyValue(key)
                  let new_value = cssStyle.getPropertyValue(vars.rKey) || ""
                  if (value && value.includes(vars.sValue)) {
                    new_value += " " + vars.stick;
                  } else {
                    new_value = new_value.replaceAll(vars.stick, "");
                  }
                  cssStyle.p_ud_setProperty(vars.rKey, new_value);
                  
                }
                if (action.callBacks) {
                  action.callBacks.forEach(callBack => {
                    callBack(cssStyle, cssRule, details, topLevelRule, options, action.variables);
                  });
                }
              }
              
            });
          },
          ceilBrigthness: function(str) {
            // 9 nested vars or parentheis: if a parethesis is open we expect it to be closed.
            return str.replaceAll(/((?:rgb|hsl)a?\()(\((\((\((\((\((\((\((.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)/g, (match, g1) => {
              let intermediate = match.slice(g1.length, -1);
              let inside = intermediate.split(/[,](?![^(]*\))/);
              if (inside.length >= 3) {
                if (g1.startsWith("rgb")) {
                  for (let i = 0; i < 3; i++) {
                    inside[i] = `min(${inside[i]},180)`
                  }
                } else if (g1.startsWith("hsl")) {
                  inside[2] = `min(${inside[2]},0.5)`
                }
                match = g1 + inside.join(",") + ")";
              }
              return match;
            })
          },
          idk_twice_actions: {
            "background": (cssRule, idk_value) => {
              let result = uDark.ceilBrigthness(idk_value);
              return result;
              // old way:
              // cssRule.style.p_ud_setProperty("background-blend-mode", "darken", "important");
              // return idk_value + " linear-gradient(rgba(168, 168, 168, 1),rgba(168, 168, 168, 1))"; 
            },
            "background-image": (cssRule, idk_value) => {
              return uDark.ceilBrigthness(idk_value);
            },
            "background-color": (cssRule, idk_value) => {
              return uDark.ceilBrigthness(idk_value);
              
              // old way:
              // cssRule.style.p_ud_setProperty("background-blend-mode", "darken", "important");
              // let background_image = cssRule.style.getPropertyValue("background-image");
              // let result = `linear-gradient(${idk_value},${idk_value}), linear-gradient(rgba(168, 168, 168, 1),rgba(168, 168, 168, 1))`;
              // if (background_image) {
              //   result = background_image + "," + result;
              // }
              // cssRule.style.p_ud_setProperty("background-image", result);
              // return "none";
              // return idk_value+", linear-gradient(rgba(168, 168, 168, 1),rgba(168, 168, 168, 1))";
            },
            
            // Use RGB colors to avoid value being edited later
            "color": (cssRule, idk_value) => {
              return "rgb(255,255,255)";
            }
          },
          edit_with_regex: function(idk_mode, key, value, regex, transformation, render, cssRule) {
            return value.replaceAll(regex, (match) => {
              let restored = uDark.restore_idk_vars(idk_mode, match);
              let maybe_array = uDark.eget_color(restored, false, cssRule, uDark.on_idk_missing_twice, true)
              if (maybe_array.push) {
                return transformation(...maybe_array, render);
              }
              // console.log("Fully failed to get '",key,"' from",maybe_array,cssRule,match);
              if (uDark.idk_twice_actions[key]) {
                maybe_array = uDark.idk_twice_actions[key](cssRule, restored);
              }
              return maybe_array;
            });
          },
          
          hexadecimalColorsRegex: /#[0-9a-f]{3,4}(?:[0-9a-f]{2})?(?:[0-9a-f]{2})?/gmi, // hexadecimal colors
          foreground_color_css_properties: ["color"], // css properties that are foreground colors
          // Gradients can be set in background-image
          background_color_css_properties_regex: /color|fill|box-shadow|border|^background(?:-image|-color)?$|^--ud-ptd-background/, // Background images can contain colors // css properties that are background colors
          edit_prefix_fg_vars: function(idk_mode, value, actions) {
            if (!value.includes("var(") && !idk_mode) {
              return value; // No variables to edit;
            }
            return value.replace(/(?<!a-z0-^9-_])--([a-z0-9-_])/gi, "--ud-fg--$1")
          },
          restore_idk_vars: function(idk_mode, value) {
            if (idk_mode) {
              value = value.replaceAll("..1..", "var(").replaceAll("..2..", ")").replaceAll("..3..", "calc(");
              // value = CSS_COLOR_NAMES[Math.floor(Math.random() * CSS_COLOR_NAMES.length)];
            }
            return value;
          },
          transform_color(color, actions = {}, transformation = uDark.revert_rgba, render = uDark.rgba_val) {
            return uDark.edit_all_cssRule_colors_cb(false, {
              style: false
            }, "none", "none", color, transformation, render, {}, false, actions, false)
          },
          edit_all_cssRule_colors_cb: (idk_mode, cssRule, key, key_idk, value, transformation, render, options, key_prefix, actions, topLevelRule) => {
            
            
            
            let url_protected = uDark.str_protect(value, uDark.regex_search_for_url, "url_protected");
            
            // url_protected=value.protect(/DISABLED/,"url_protected");
            let new_value = url_protected.str;
            
            
            let cssStyle = cssRule.style;
            cssRule[key] = "done"; // Used right above to avoid reprocessing, already deleted once by mistake, this is why this comment exists now :), might not serve anymore since shorthands are now protected
            
            if (cssStyle && uDark.is_background && uDark.unResolvableVarsRegex.test(new_value) && new_value.includes("var(")) { // To complicated to write a rgex for this, so we will use a simple test
              
              // In fact, background can guess the color given the cssRule, but must not use cache to avoid leaking variables accross different websites.
              let is_color_var_result = uDark.is_color_var(new_value, false, false, cssRule, false, false); // maybe the background can resolve the color given the cssRule ?
              if (is_color_var_result) {
                new_value = is_color_var_result;
              } else {
                
                let priority = cssStyle.getPropertyPriority(key_idk);
                
                if (!topLevelRule.unresolvableRule) {
                  options.unresolvableStylesheet.insertRule(topLevelRule.cssText, options.unresolvableStylesheet.cssRules.length);
                  topLevelRule.unresolvableRule = true;
                }
                
                // console.log(uDark.is_background,key,new_value,"has unresolvable vars, skipping");
                options.hasUnresolvedVars = options.hasUnresolvedVars || true;
                cssStyle.p_ud_setProperty("--ud-idk_" + key, new_value, priority);
                uDark.on_idk_missing == "remove" && cssStyle.removeProperty(key)
                uDark.on_idk_missing == "fill_black" && cssStyle.p_ud_setProperty(key, transformation(0, 0, 0, 1, render), priority);
                
                uDark.on_idk_missing == "fill_minimum" && cssStyle.p_ud_setProperty(key, transformation(...uDark.hslToRgb(0, 0, uDark.max_bright_bg * uDark.idk_minimum_editor), 1, render), priority);
                uDark.on_idk_missing == "fill_red" && cssStyle.p_ud_setProperty(key, transformation(255, 0, 0, 1, render), priority);
                uDark.on_idk_missing == "fill_green" && cssStyle.p_ud_setProperty(key, transformation(0, 129, 0, 1, render), priority);
                return;
              }
            } else if (idk_mode) {
              {
                if (!uDark.keepIdkProperties) {
                  // console.log(1,"Removing idk property", key_idk, "from", cssRule.cssText);
                  cssStyle.removeProperty(key_idk);
                  // console.log(2,"Removing idk property", key_idk, "from", cssRule.cssText);
                }
                //new_value.match(/(var|calc)\((\((\((\((\((\((\((\((.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)/g) 
                // 9 nested vars or parentheis: keep hsl or RGBA bounds if a parethesis is open we expect it to be closed.
                new_value = new_value.replaceAll(/(var|calc)\((\((\((\((\((\((\((\((.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)/g, match => match.replaceAll("var(", "..1..").replaceAll(")", "..2..").replaceAll("calc(", "..3.."));
                // new_value = new_value.replaceAll(/(var|calc)\([^()]+\)/g, match => match.replaceAll("var(", "..1..").replaceAll(")", "..2..").replaceAll("calc(", "..3.."))
                
              }
            }
            
            if (actions.prefix_fg_vars) {
              new_value = uDark.edit_prefix_fg_vars(idk_mode, new_value, actions);
            }
            
            
            new_value = uDark.edit_with_regex(idk_mode, key, new_value, uDark.rgb_a_colorsRegex, transformation, render, idk_mode ? cssRule : false); // edit_rgb_a_colors
            new_value = uDark.edit_with_regex(idk_mode, key, new_value, uDark.hsl_a_colorsRegex, transformation, render, idk_mode ? cssRule : false); // edit_hsl_a_colors
            new_value = uDark.restore_idk_vars(idk_mode, new_value); // Restore alone vars: color: var(--color_8)
            new_value = uDark.edit_with_regex(false /*The namedColorsRegex is not affected*/ , key, new_value, uDark.namedColorsRegex, transformation, render); // edit_named_colors
            new_value = uDark.edit_with_regex(false /*The hexadecimalColorsRegex is not affected*/ , key, new_value, uDark.hexadecimalColorsRegex, transformation, render); // edit_hex_colors // The browser auto converts hex to rgb, but some times not like in  var(--123,#00ff00) as it cant resolve the var
            
            new_value = uDark.str_unprotect(new_value, url_protected);
            
            
            
            
            if (!cssStyle) {
              return {
                value,
                new_value
              }
            }
            
            if (value != new_value || key_prefix) {
              // Edit the value only if necessary:  setting bacground image removes bacground property for intance
              
              cssStyle.p_ud_setProperty(key_prefix + key, new_value, cssStyle.getPropertyPriority(key_idk)); // Once we had  an infinite loop here when uDark was loaded twice and redefining setProperty.
            }
            // console.log("cssKey Color",cssRule,key,value,priority,cssRule.cssText);
          },
          get_top_level_rule: function(cssRule) {
            let topLevelRule = cssRule;
            while (topLevelRule.parentRule) {
              topLevelRule = topLevelRule.parentRule; // Even media rules can have parentRule: its called Layers
            }
            return topLevelRule;
          },
          edit_all_cssRule_colors: function(idk_mode, cssRule, topLevelRule, keys, transformation, render, options, key_prefix = "", actions = {}, callBack = uDark.edit_all_cssRule_colors_cb) {
            // render = (render||uDark.rgba_val);
            // console.log(idk_mode,cssRule,keys,transformation,render,key_prefix,actions);
            
            keys.forEach(key => {
              let key_idk = ((idk_mode === true) ? "--ud-idk_" : "") + key;
              let value = cssRule.style.getPropertyValue(key_idk) || "";
              
              if (actions.replaces) {
                for (let replace of actions.replaces) {
                  value = value.replaceAll(...replace);
                }
              }
              if (value ) {
                callBack(idk_mode, cssRule, key, key_idk, value, transformation, render, options, key_prefix, actions, topLevelRule);
              }
            });
          },
          
          edit_cssProperties: function(cssRule, idk_mode = false, details, options) {
            let foreground_items = [],
            variables_items = [],
            background_items = [],
            wording_action = [];
            for (let x of cssRule.style) {
              if (idk_mode === true) {
                // Partial idk mode (idk_mode='partial_idk') does not have --ud-idk_ prefix, they are added by cloning the cssRule
                // This is why a strict comparison is used here
                if (x.startsWith("--ud-idk_")) {
                  x = x.slice(9);
                } else {
                  continue;
                }
              }
              
              if (x.startsWith("--")) {
                if (x.startsWith("--ud-fg--")) {
                  continue
                }
                if (!x.startsWith("--ud-ptd-")) { // Now using protection strategy for shorthands, but matching them properly with the regex <3
                  variables_items.push(x);
                  continue; // Eliminate Variables, i don't think its usefull to test them againt regexes
                }
              }
              if (uDark.css_properties_wording_action_dict[x]) {
                wording_action.push(x);
              } // Check if some wording action is needed
              if (uDark.foreground_color_css_properties.includes(x)) {
                foreground_items.push(x);
                continue;
              } // Do foreground items first as its faster to check a list
              if (x.match(uDark.background_color_css_properties_regex)) {
                background_items.push(x);
                continue;
              } // Do background regex match
              
            }
            // NOTE: Once i tried to disable variables_items, on partial idk mode, but it was an error: some variables can be used in background or foreground colors as is (--rgb(var(--ud-fg--color_1),0.5))
            // And must therefore be edited
            options = { // Pass a copy of options, as we will edit it and it is shared between all calls
              ...options,
              ...{
                lighten: options.lighten || uDark.revert_rgba,
                darken: options.darken || uDark.rgba,
                render: options.render || uDark.rgba_val,
                hasUnresolvedVars: false,
              }
            }
            
            // Passed by reference. // request details are shared so we use a new object. We could have emedded it into details though
            let topLevelRule = uDark.get_top_level_rule(cssRule);
            wording_action.length && uDark.css_properties_wording_action(cssRule.style, wording_action, details, cssRule, topLevelRule, options);
            
            background_items.length && uDark.edit_all_cssRule_colors(idk_mode, cssRule, topLevelRule, background_items, options.darken, options.render, options, "", {
              // replaces:[
              //   [/currentcolor/ig,"black"], // Nice for big elems using currentcolor as a background color but not for small ones, which are often icons, therefore almost not visible
              // ] // Problem occured on https://www.google.com/search?client=firefox-b-d&q=cor%C3%A9e+du+sud
            })
            foreground_items.length && uDark.edit_all_cssRule_colors(idk_mode, cssRule, topLevelRule, foreground_items, options.lighten, options.render, options, "", {
              prefix_fg_vars: true
            })
            variables_items.length && uDark.edit_all_cssRule_colors(idk_mode, cssRule, topLevelRule, variables_items, options.lighten, options.render, options,
              idk_mode ? "" : "--ud-fg" // Avoid double prefixing :  we are here in front end, and this has been done in background
              , {
                prefix_fg_vars: true
              })
              variables_items.length && uDark.edit_all_cssRule_colors(idk_mode, cssRule, topLevelRule, variables_items, options.darken, options.render, options);
              
              if (details && options.hasUnresolvedVars) {
                
                details.unresolvableChunks = details.unresolvableChunks || [];
                details.unresolvableChunks[details.dataCount] = true;
              }
              
            },
            edit_css: function(cssStyleSheet, idk_mode, details, options = {}) {
              
              let unresolvableStylesheet = new CSSStyleSheet();
              
              options.cssStyleSheet = cssStyleSheet;
              options.unresolvableStylesheet = unresolvableStylesheet;
              
              uDark.edit_cssRules(cssStyleSheet.cssRules, idk_mode, details, options);
              
              // console.log("BEFORE",unresolvableStylesheet.cssRules)
              options.hasUnresolvedVars_idk_vars = unresolvableStylesheet.cssRules.length > 0;
              uDark.edit_cssRules(unresolvableStylesheet.cssRules, false, details, {}, function(rule) {
                uDark.edit_all_cssRule_colors(false, rule, uDark.get_top_level_rule(rule), Object.values(rule.style), false, false, false, "", {},
                function(idk_mode, cssRule, key, key_idk, value, transformation, render, options, key_prefix, actions, topLevelRule) {
                  if (!uDark.unResolvableVarsRegex.test(value) || !value.includes("var(")) {
                    cssRule.style.removeProperty(key);
                  }
                }
              );
            }, true // Clean empty rules
          )
          // console.log("Unresolvable rules",unresolvableStylesheet,unresolvableStylesheet.cssRules.length);
        },
        
      };
      uDark.colorWork = {
        canvasWidth: 5,
        canvasHeight: 3,
        indexes: Array(3).fill(0),
      }
      uDark.colorWork.canvas = document.createElement('canvas');
      uDark.colorWork.canvas.width = uDark.colorWork.canvasWidth;
      uDark.colorWork.canvas.height = uDark.colorWork.canvasHeight;
      uDark.colorWork.canvasContext = uDark.colorWork.canvas.getContext('2d');
      window.uDark.css_properties_wording_action_dict = {
        "mix-blend-mode": {
          replace: ["multiply", "normal"]
        },
        "scrollbar-color": {
          remove: 1
        },
        "color-scheme": {
          replace: ["light", "dark"]
        },
        
        "fill": {
          callBacks: [(cssStyle, cssRule, details, topLevelRule, options) => {
            let value = cssStyle.getPropertyValue("fill");
            uDark.edit_all_cssRule_colors_cb(false, cssRule, "color", "color", value, options.lighten, options.render, options, "--ud-fg--fill-", {
              prefix_fg_vars: true
            }, topLevelRule)
            
          }]
        },
        "mask-image": {
          stickConcatToPropery: {
            sValue: "url(",
            rKey: "filter",
            stick: "brightness(10)"
          }
        },
        "background-image": {
          callBacks: [uDark.edit_css_urls]
        },
        "background": {
          callBacks: [uDark.edit_css_urls]
        },
        
        // Not good for wayback machine time selector
        // "color":{ stickConcatToPropery: {sValue:"(",rKey:"mix-blend-mode", stick:"difference"}}, // Not good for wayback machine time selector
        // "position":{ stickConcatToPropery: {sValue:"fixed",rKey:"filter", stick:"contrast(110%)"}}, // Not good for wayback machine time selector
      };
      
      String.prototype.protect = function(regexSearch, protectWith) {
        return uDark.str_protect(String(this).valueOf(), regexSearch, protectWith)
      };
      String.prototype.unprotect = function(protectWith) {
        return uDark.str_unprotect(String(this), protectWith)
      };
      String.prototype.protect_numbered = function(regexSearch, protectWith, condition = true) {
        return uDark.str_protect_numbered(String(this), regexSearch, protectWith, condition)
      };
      String.prototype.unprotect_numbered = function(protectWith, condition = true) {
        return uDark.str_unprotect_numbered(String(this), protectWith, condition)
      };
      String.prototype.protect_simple = function(regexSearch, protectWith, condition = true) {
        return uDark.str_protect_simple(String(this), regexSearch, protectWith, condition)
      };
      String.prototype.unprotect_simple = function(protectedWith, condition = true) {
        return uDark.str_unprotect_simple(String(this), protectedWith, condition)
      };
      
    },
  },
  
  user_content: {
    install: function() {
      console.info("UltimaDark", "User content script install", window);
      window.uDark = {
        ...window.uDark,
        ...{
          getallBgimages: function(adocument, acondition = (elem, url) => true) {
            var url, B = [],
            A = adocument.body.querySelectorAll('*:not([ud-backgrounded])');
            A = B.slice.call(A, 0, A.length);
            while (A.length) {
              var C = A.shift()
              url = uDark.deepCss(C, 'background-image', adocument);
              if (url) url = /url\(['"]?([^")]+)/.exec(url) || [];
              url = url[1];
              if (url && B.indexOf(url) == -1 && acondition(C, url)) B[B.length] = [C, url];
            }
            return B;
          },
          deepCss: function(who, css, adocument) {
            if (!who || !who.style) return '';
            var sty = css.replace(/\-([a-z])/g, function(a, b) {
              return b.toUpperCase();
            });
            var dv = adocument.defaultView || window;
            return who.style[sty] ||
            dv.getComputedStyle(who, "").getPropertyValue(css) || '';
          },
          
        }
      }
      
      window.addEventListener('load', (event) => {
        var bodycolor = getComputedStyle(document.body)["backgroundColor"]
        if (bodycolor != "rgba(0, 0, 0, 0)") { //TODO: I'm not sure if this is still usefull, its almost one of the first thing i did
          // Answer : not, as this install script is not even executed anymore
          document.head.parentNode.style.o_ud_set_backgroundColor = getComputedStyle(document.body)["backgroundColor"]
        }
        // setInterval(function()
        // {
        var docscrollW = document.body.scrollWidth;
        
        // Adds an overlay to big backgrounded elements
        uDark.getallBgimages(
          document, (elem, url) =>
            elem.scrollWidth / docscrollW > .5 // Is a big object
          &&
          !uDark.background_match.test(url) // IS not bacgkgrounded-darken
        ).forEach(x => {
          
          var styleelem = getComputedStyle(x[0]);
          
          if (styleelem["background-size"].includes(styleelem["width"])) {
            // alert("Found a big image")
            var stylebefore = getComputedStyle(x[0], ":before");
            var className = "ud-background-overlay-" +
            (stylebefore.backgroundColor == "rgba(0, 0, 0, 0)" ? "before" : "after")
            x[0].classList.add(className)
            x[0].setAttribute("ud-backgrounded", 2)
          }
        })
      });
      
      //
      if (uDark.break_pages_in_font_edit) {
        
        uDark.valuePrototypeEditor(Element, "className", (elem, value) => {
          console.log(elem, value);
          return "black"
        })
        uDark.valuePrototypeEditor(Element, "classList", (elem, value) => {
          console.log(elem, value);
          return ["black"]
        })
        uDark.valuePrototypeEditor(CSS2Properties, "background-image", (elem, value) => {
          console.log(elem, value);
          return "none"
        })
        /*done*/
        uDark.valuePrototypeEditor(CSS2Properties, "backgroundColor", (elem, value) => {
          console.log(elem, value);
          return "black"
        })
        /*done*/
        uDark.valuePrototypeEditor(CSS2Properties, "background-color", (elem, value) => {
          console.log(elem, value);
          return "black"
        })
        /*must add img bg*/
        uDark.valuePrototypeEditor(CSS2Properties, "background", (elem, value) => {
          console.log(elem, value);
          return "black"
        })
        // uDark.valuePrototypeEditor(Element,"fill",(elem,value)=>{console.log(elem,value);return ["black"]})
        /*done*/
        uDark.valuePrototypeEditor(CSS2Properties, "color", (elem, value) => {
          console.log(elem, value);
          return "lightgreen"
        })
        uDark.functionPrototypeEditor(DOMTokenList, DOMTokenList.prototype.add, (elem, args) => {
          console.log(elem, args);
          return ["yellow"]
        });
        
        /*done*/
        uDark.functionPrototypeEditor(CSSStyleSheet, CSSStyleSheet.prototype.addRule, (elem, args) => {
          console.log(elem, args);
          return [".have-border", "border: 1px solid black;"]
        })
        /*done*/
        uDark.functionPrototypeEditor(CSSStyleSheet, CSSStyleSheet.prototype.insertRule, (elem, args) => {
          console.log(elem, args);
          return [".have-border { border: 1px solid black;}", 0]
        })
        
        // Youtube uses this one
        uDark.functionPrototypeEditor(CSSStyleDeclaration, CSSStyleDeclaration.prototype.p_ud_setProperty, (elem, args) => {
          console.log("CSSStyleDeclaration setProperty", elem, args);
          return args
        })
        
        // should not be usefull
        
        uDark.functionPrototypeEditor(DocumentFragment, DocumentFragment.prototype.append, (elem, args) => {
          console.log(elem, args);
          return ["NOAPPEND"]
        })
        uDark.functionPrototypeEditor(Element, Element.prototype.append, (elem, args) => {
          console.log(elem, args);
          return ["NOAPPEND"]
        })
        uDark.functionPrototypeEditor(Document, Document.prototype.append, (elem, args) => {
          console.log(elem, args);
          return ["NOAPPEND"]
        })
        uDark.functionPrototypeEditor(DocumentFragment, DocumentFragment.prototype.prepend, (elem, args) => {
          console.log(elem, args);
          return ["NOAPPEND"]
        })
        uDark.functionPrototypeEditor(Element, Element.prototype.prepend, (elem, args) => {
          console.log(elem, args);
          return ["NOAPPEND"]
        })
        uDark.functionPrototypeEditor(Document, Document.prototype.prepend, (elem, args) => {
          console.log(elem, args);
          return ["NOAPPEND"]
        })
        
        // Youtube uses this one
        
        uDark.functionPrototypeEditor(Document, Document.prototype.createElement, function(elem, args) {
          // console.log(elem,args,new Error);
          return args
        },
        (elem, args) => args[0] == "style",
        (result) => {
          console.log(result);
          return result
        })
      }
      
    }
    
  },
  
  content_script: {
    
    install() {
      console.info("UltimaDark", "Content script install", window);
      
      window.uDark = {
        ...uDark,
        ...{
          is_content_script: true,
          website_context: true
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
      globalThis.browser.storage.local.get(null, function(res) {
        window.uDark.userSettings = res;
        if (uDark.direct_window_export) {
          window.wrappedJSObject.uDark.userSettings = cloneInto(res, window); // Using eval here has no gain, on browserbench.org it has equal performance
          window.wrappedJSObject.userSettingsReadyAction();
        }
        
      });
      // NOTE: DROPS SIGNIFICANTLY THE PERFORMANCE, prefer use eval
      if (uDark.exportUlimaDarkToForeground) { // Under test but not usefull anymore
        
        window.wrappedJSObject.uDark = cloneInto({ // Export functions the page needs to use
          rgba: uDark.rgba,
          rgba_rgb: uDark.rgba_rgb,
          do_idk_mode: uDark.do_idk_mode,
          revert_rgba: uDark.revert_rgba,
          rgba_val: uDark.rgba_val,
          hsla_val: uDark.hsla_val,
          hex_val: uDark.hex_val,
          edit_cssRules: uDark.edit_cssRules,
          edit_cssRules: uDark.edit_cssRules,
          is_color: (...args) => cloneInto(uDark.is_color(...args), window),
          is_color_no_clone: uDark.is_color,
          is_color_var: (...args) => cloneInto(uDark.is_color_var(...args), window),
          eget_color: (...args) => cloneInto(uDark.eget_color(...args), window),
          edit_str: uDark.edit_str,
        }, window, {
          cloneFunctions: true
        });
        
      }
      
      let myPort = globalThis.browser.runtime.connect({
        name: "port-from-cs"
      });
      
      function registerBackgroundItem(selectorText) {
        // NOTE: TODO: Disable registerBackgroundItem for now, but re-enable it later
        //window.uDark.registerBackgroundItem(false, selectorText, false); // go directly to the edit, the validation is already done
      }
      
      
      console.info("UltimaDark", "Content script ready", window);
    },
    
    website_load: function() {
      
      if (uDark.enable_idk_mode) { // Use of an observer was consuming too much ressources
        
        uDark.do_idk_mode_timed();
      }
    },
    override_website: function() {
      
      try {
        typeof localStorage;
        uDark.localStorageAvailable = true;
      } catch (e) {
        // console.log("UltimaDark", "Local storage is not available", e,document.location.href);
      }
      
      let start = new Date() / 1;
      
      console.log("UltimaDark", "Content script override website", window);
      
      window.userSettingsReadyAction = function() {
        if (!uDark.userSettings.keep_service_workers && window.navigator.serviceWorker) {
          if (uDark.localStorageAvailable) {
            // Insecure operations have in common a non available localStorage
            window.navigator.serviceWorker.getRegistrations().then(rs => rs.map(x => x.unregister()))
          }
          delete Navigator.prototype.serviceWorker;
        }
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
        let parts = uDark.edit_str(args[0] + ":" + args[1]);
        let partsIndex = parts.indexOf("; --ud-fg--");
        let part1 = parts.slice(0, partsIndex);
        let part2 = parts.slice(partsIndex + 2); //+2: Remove the ; and the space
        let subParts1_1 = part1.slice(0, part1.indexOf(":"));
        let subParts1_2 = part1.slice(part1.indexOf(":") + 2); // +2 to remove the : and the space
        let subParts2_1 = part2.slice(0, part2.indexOf(":"));
        let subParts2_2 = part2.slice(part2.indexOf(":") + 2, -1); // +2 to remove the : and the space, -1 to remove the ;
        
        args[0] = subParts1_1
        args[1] = subParts1_2
        
        elem.p_ud_setProperty(subParts2_1, subParts2_2, args[2]);
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
        uDark.valuePrototypeEditor([Element, ShadowRoot], "innerHTML", uDark.frontEditHTML, (elem, value) => value && /style|fill/.test(value) || elem instanceof HTMLStyleElement || elem instanceof SVGStyleElement); // toString : sombe object can redefine tostring to generate thzir inner
        // //geo.fr uses this one
        
        { // Wrap JS editing iframe and this kind of objects SRC's
          uDark.valuePrototypeEditor([HTMLIFrameElement, HTMLEmbedElement], "src", uDark.frontEditHTMLPossibleDataURL ); 
          uDark.valuePrototypeEditor([HTMLObjectElement], "data", uDark.frontEditHTMLPossibleDataURL ); 
          uDark.valuePrototypeEditor([HTMLIFrameElement], "srcdoc", uDark.frontEditHTML ); 
        }
        
        uDark.valuePrototypeEditor(Element, "outerHTML", uDark.frontEditHTML, (elem, value) => value && /style|fill/.test(value) || elem instanceof HTMLStyleElement || elem instanceof SVGStyleElement); // toString : sombe object can redefine tostring to generate thzir inner
        
        // This is the one google uses
        uDark.functionPrototypeEditor(Element, Element.prototype.insertAdjacentHTML, (elem, args) => {
          args[1] = uDark.frontEditHTML("ANY_ELEMENT", args[1]); // frontEditHTML have a diffferent behavior with STYLE elements
          return args;
        }, (elem, args) => args[1].includes("style"))
        
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
      //   aCSS.o_ud_replaceSync(uDark.inject_css_override);
      //   x.adoptedStyleSheets=[aCSS];
      //   return x;
      
      // })
      uDark.functionPrototypeEditor(Node, [
        Node.prototype.appendChild,
        Node.prototype.insertBefore
      ], (elem, args) => {
        (args[0].textContent = uDark.edit_str(args[0].textContent));
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
      uDark.valuePrototypeEditor(CSSStyleDeclaration, "cssText", (elem, value) => uDark.edit_str(value)) // However this one does ( on elements.style.cssText and on cssRules.style.cssText, it keeps the selector as is, but the css is edited: 'color: red')
      
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
      uDark.valuePrototypeEditor(CSS2Properties, "backgroundColor", (elem, value) => uDark.eget_color(value, uDark.rgba))
      
      uDark.valuePrototypeEditor(CSS2Properties, "background-color", (elem, value) => uDark.eget_color(value, uDark.rgba))
      uDark.valuePrototypeEditor(CSS2Properties, "color", (elem, value) => uDark.eget_color(value, uDark.revert_rgba))
      uDark.valuePrototypeEditor([HTMLElement, SVGElement], "style", (elem, value) => uDark.edit_str(value)) // Care with "style and eget, this cause recursions"
      // TODO: Support CSS url(data-image) in all image relevant CSS properties like background-image etc
      
      uDark.valuePrototypeEditor(HTMLElement, "innerText", (elem, value) => {
        return uDark.edit_str(value)
      }, (elem, value) => value && (elem instanceof HTMLStyleElement)) // No innerText for SVGStyleElement, it's an HTMLElement feature
      
      console.info("UltimaDark", "Websites overrides ready", window, "elapsed:", (new Date() / 1) - start);
      
    },
  },
  background: {
    defaultRegexes: {
      white_list: ["<all_urls>", "*://*/*", "https://*.w3schools.com/*"].join('\n'),
      black_list: ["*://example.com/*"].join('\n')
    },
    filterContentScript: function(x) {
      return x.match(/<all_urls>|^(https?|wss?|file|ftp|\*):\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^file:\/\/\/.*$|^resource:\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^about:$/)
    },
    registerCS:(contentScriptRegister)=>{
      let defaultCS = {
        matches: uDark.userSettings.properWhiteList,
        runAt: "document_start",
        matchAboutBlank: true,
        allFrames: true
      };
      if(uDark.browserInfo.Mozilla_Firefox>=128){
        defaultCS.matchOriginAsFallback=true // This crucial feature is only available since FF 128
      }
      if(uDark.userSettings.properBlackList.length){
        defaultCS.excludeMatches = uDark.userSettings.properBlackList;
      }
      let contentScript = {
        ...defaultCS,
        ...contentScriptRegister
      }
      
      globalThis.browser.contentScripts.register(contentScript).then(x=>uDark.regiteredCS.push(x));
      
    },
    setListener: function() {
      globalThis.browser.storage.local.get(null, function(res) {
        uDark.userSettings = res;
        uDark.userSettings.properWhiteList = (res.white_list || dark_object.background.defaultRegexes.white_list).split("\n").filter(dark_object.background.filterContentScript)
        uDark.userSettings.properBlackList = (res.black_list || dark_object.background.defaultRegexes.black_list).split("\n").filter(dark_object.background.filterContentScript)
        uDark.userSettings.exclude_regex = (res.black_list || dark_object.background.defaultRegexes.black_list).split("\n").map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Sanitize regex
        .replace(/(^<all_urls>|\\\*)/g, "(.*?)") // Allow wildcards
        .replace(/^(.*)$/g, "^$1$")).join("|") // User multi match)
        uDark.idk_cache = {};
        uDark.resolvedIDKVars_action_timeout = 400; // edit_str from 2024 january was ok with 210 for both editing and messaging, 250 Should be enough for now
        uDark.fixedRandom = Math.random();
        
        globalThis.browser.webRequest.onSendHeaders.removeListener(dark_object.misc.setEligibleRequestBeforeData);
        globalThis.browser.webRequest.onHeadersReceived.removeListener(dark_object.misc.editBeforeData);
        globalThis.browser.webRequest.onHeadersReceived.removeListener(dark_object.misc.editBeforeData);
        globalThis.browser.webRequest.onHeadersReceived.removeListener(dark_object.misc.editBeforeRequestStyleSheet);
        globalThis.browser.webRequest.onBeforeRequest.removeListener(dark_object.misc.editBeforeRequestImage);
        globalThis.browser.webRequest.onHeadersReceived.removeListener(dark_object.misc.editOnHeadersImage);
        // globalThis.browser.webRequest.onCompleted.removeListener(dark_object.misc.clearCacheForRequest);
        // globalThis.browser.webRequest.onBeforeRequest.removeListener(dark_object.misc.editBeforeServiceWorker);
        /*Experimental*/
        // browser.webRequest.onHeadersReceived.removeListener(dark_object.misc.editHeadersOnHeadersReceived);
        /*end of Experimental*/
        if (uDark.regiteredCS && uDark.regiteredCS.length) {
          while (uDark.regiteredCS.length) {
            uDark.regiteredCS.shift().unregister();
          }
        }
        if (!res.disable_webext && uDark.userSettings.properWhiteList.length) {
          
          globalThis.browser.webRequest.onSendHeaders.addListener(dark_object.misc.setEligibleRequestBeforeData, {
            urls: uDark.userSettings.properWhiteList,
            types: ["main_frame", "sub_frame"]
          }, );
          
          globalThis.browser.webRequest.onHeadersReceived.addListener(dark_object.misc.editBeforeData, {
            urls: uDark.userSettings.properWhiteList,
            types: ["main_frame", "sub_frame"]
          },
          ["blocking", "responseHeaders"]);
          
          globalThis.browser.webRequest.onHeadersReceived.addListener(dark_object.misc.editBeforeRequestStyleSheet, {
            // urls: uDark.userSettings.properWhiteList, // We can't assume the css is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
            urls: ["<all_urls>"],
            types: ["stylesheet"]
          },
          ["blocking", "responseHeaders"]);
          
          // globalThis.browser.webRequest.onBeforeRequest.addListener(dark_object.misc.editBeforeServiceWorker, {
          //   // urls: uDark.userSettings.properWhiteList, // We can't assume the css is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
          //   // urls: ["*://*/*?udarkServiceWorkerIntercept=1"],
          //   // urls: ["<all_urls>"],
          //   types: "beacon,csp_report,font,image,imageset,main_frame,media,object,object_subrequest,ping,script,speculative,stylesheet,sub_frame,web_manifest,websocket,xbl,xml_dtd,xmlhttprequest,xslt,other".split(","),
          
          //   urls: ["*://*/sw.js*",
          //     // "<all_urls>"
          //   ],
          //   // types: ["stylesheet"]
          // },
          // ["blocking"]);
          /*Experimental*/
          // browser.webRequest.onHeadersReceived.addListener(dark_object.misc.editHeadersOnHeadersReceived, {
          //     // urls: uDark.userSettings.properWhiteList, // We can't assume the css is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
          //     urls: ["<all_urls>"],
          //     types: ["stylesheet"]
          //   },
          //   ["blocking"]);
          /*end of Experimental*/
          
          if (!uDark.userSettings.disable_image_edition) {
            globalThis.browser.webRequest.onBeforeRequest.addListener(dark_object.misc.editBeforeRequestImage, {
              urls: ["<all_urls>"],
              // urls: uDark.userSettings.properWhiteList, // We can't assume the image is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
              types: ["image"]
            },
            ["blocking"]);
            globalThis.browser.webRequest.onHeadersReceived.addListener(dark_object.misc.editOnHeadersImage, {
              urls: ["<all_urls>"],
              // urls: uDark.userSettings.properWhiteList, // We can't assume the image is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
              types: ["image"]
            },
            ["blocking", "responseHeaders"]);
            
          }
          
          // globalThis.browser.webRequest.onCompleted.addListener(dark_object.misc.clearCacheForRequest, {
          //   // urls: uDark.userSettings.properWhiteList, // We can't assume the css is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
          //   urls: ["<all_urls>"],
          //   types: ["stylesheet"]
          // });
          
          // browser.webRequest.onHeadersReceived.addListener(details => {
            //   return;
          //   if (["script", "image", "font"].includes(details.type)) {
          //     return;
          //   }
          //   if (details.documentUrl && details.documentUrl.startsWith("moz-extension:")) {
          //     return;
          //   }
          //   if (details.method != "GET") {
          //     return;
          //   }
          //   // if(!details.documentUrl.includes(".js")){return;}
          //   if (details.url.includes(".js")) {
          //     return
          //   }
          //   console.log(details.type, details.method)
          //   if (details.url.match(/\.css$/)) {
          //     console.log("a CSS request", details)
          //   } else {
          //     console.log("Not CSS request", details)
          //   }
          
          // }, {
          //   // urls: uDark.userSettings.properWhiteList, // We can't assume the css is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
          //   urls: ["<all_urls>"],
          // })
          
          let contentScript = {
            js: [
              // {  file: "content_script.js"    },
              {         file: "background.js"},
              // {       file: "MurmurHash3.js"           }
            ], // Forced overrides
            css: [{     code: uDark.inject_css_override     }], // Forced overrides
          };
          dark_object.background.registerCS(contentScript);
          dark_object.background.registerCS({css: [{code: uDark.inject_css_override_top_only}],allFrames:false }); // Register a default content script, to be able to edit the page before the other one is loaded
          
        } else
        console.info("UD Did not load : ", "White list", uDark.userSettings.properWhiteList, "UltimaDark enable state :", !res.disable_webext)
      });
      globalThis.browser.webRequest.handlerBehaviorChanged().then(x => console.info(`In-memory cache flushed`), error => console.error(`Error: ${error}`));
      globalThis.browser.browsingData.removeCache({}).then(x => console.info(`Browser cache flushed`), error => console.error(`Error: ${error}`));
      
    },
    install: function() {
      fetch("manifest.json").then(x=>x.json()).then(x=>{
        uDark.production=x.browser_specific_settings.gecko.id;
        
        if(uDark.production){
          console.log("UltimaDark", "Production mode", uDark.production);
          console.log, console.warn,console.table,console.info = function() {};
          
        }
        
      })
      
      
      let SHORTHANDS = ["all", "animation", "animation-range", "background", "border", "border-block", "border-block-end", "border-block-start", "border-bottom", "border-color", "border-image", "border-inline", "border-inline-end", "border-inline-start", "border-left", "border-radius", "border-right", "border-style", "border-top", "border-width", "column-rule", "columns", "contain-intrinsic-size", "container", "flex", "flex-flow", "font", "font-synthesis", "font-variant", "gap", "grid", "grid-area", "grid-column", "grid-row", "grid-template", "inset", "inset-block", "inset-inline", "list-style", "margin", "margin-block", "margin-inline", "mask", "mask-border", "offset", "outline", "overflow", "overscroll-behavior", "padding", "padding-block", "padding-inline", "place-content", "place-items", "place-self", "position-try", "scroll-margin", "scroll-margin-block", "scroll-margin-inline", "scroll-padding", "scroll-padding-block", "scroll-padding-inline", "scroll-timeline", "text-decoration", "text-emphasis", "text-wrap", "transition"]
      
      uDark.shortHandRegex = new RegExp(`(?<![_a-z0-9-])(${SHORTHANDS.join("|")})([\s\t]*:)`, "gmi"); // The \t is probably not needed, as \s includes it
      
      function connected(connectedPort) {
        
        console.info("Connected", connectedPort.sender.url, connectedPort.sender.contextId,connectedPort.sender);
        uDark.aa=1;
        if (connectedPort.name == "port-from-cs" && connectedPort.sender.tab) {
          // At first, we used exclude_regex here to not register some content scripts, but thent we used it earlier, in the content script registration
          
          let portKey = `port-from-cs-${connectedPort.sender.tab.id}-${connectedPort.sender.frameId}`
          
          uDark.connected_cs_ports[portKey] = connectedPort;
          connectedPort.onDisconnect.addListener(disconnectedPort => {
            let portValue = uDark.connected_cs_ports[portKey]
            
            console.log("Disconnected", disconnectedPort.sender.url, disconnectedPort.sender.contextId);
            if(portValue===disconnectedPort){ // If the port is the same, we can delete it, otherwise, we are on a late disconnection, the port is already replaced either by a new one or by one that will arrive soon
              
              console.log("Deleting",portKey)
              delete uDark.connected_cs_ports[portKey]
            }
          });
          connectedPort.onMessage.addListener(uDark.handleMessageFromCS);
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
              if(portValue===disconnectedPort){
                delete uDark.connected_cs_ports[portKey]
              }
              uDark.connected_options_ports_count--;
            });
          }
          // uDark.userSettings = {...uDark.userSettings,...m.updateSettings}
          connectedPort.onMessage.addListener(function(m) {
            
            if (m.updateSettings) {
              globalThis.browser.storage.local.set(m.updateSettings, dark_object.background.setListener);
            }
          });
        }
      }
      globalThis.browser.runtime.onConnect.addListener(connected);
      // Promises before starting :
      function getInjectCSS(resourcesPaths, actions = {}) {
        if (typeof resourcesPaths == "string") resourcesPaths = [resourcesPaths]
        return Promise.all(resourcesPaths.map(resourcePath =>
          fetch(resourcePath).then(r => r.text()).then(t => {
            let aCSSsrc = new CSSStyleSheet();
            aCSSsrc.replaceSync(t)
            return aCSSsrc;
          }).then(aCSSsrc => {
            uDark.edit_cssRules(aCSSsrc.cssRules, false, false, {}, function(rule) {
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
                    value = uDark.hsla_val(0, 0, uDark.max_bright_bg * uDark.idk_minimum_editor, 1)
                  }
                  let priority = rule.style.getPropertyPriority(key);
                  rule.style.p_ud_setProperty(key, value, priority);
                  
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
        window.uDark = {
          ...uDark,
          ...{
            
            regiteredCS: [],
            is_background: true,
            rgb_a_colorsRegex: /rgba?\([%0-9., \/]+\)/gmi, // rgba vals without variables and calc()involved #! rgba(255 255 255 / 0.1) is valid color and rgba(255,255,255,30%) too
            hsl_a_colorsRegex: /hsla?\(([%0-9., \/=]|deg|turn|tetha)+\)/gmi, // hsla vals without variables and calc() involved
            loggingWorkersActiveLogging: false, // Conider moving this to imageWorker to avoid messages passing for nothing
            
            LoggingWorker: class LoggingWorker extends Worker {
              constructor(...args) {
                super(...args);
                if (uDark.loggingWorkersActiveLogging) {
                  this.addEventListener('message', function(e) {
                    if (e.data.logMessage) {
                      console.log("imageWorker:", ...e.data.logMessage);
                    }
                  });
                }
                
              }
            },
            headersDo: {
              "content-security-policy": (x => {
                x.value = x.value.replace(/script-src/, "script-src *")
                x.value = x.value.replace(/default-src/, "default-src *")
                x.value = x.value.replace(/style-src/, "style-src *")
                return false; // TODO: Review if false is the right value here
              }),
              "content-type": (x => {
                x.value = x.value.replace(/charset=[0-9A-Z-]+/i, "charset=utf-8")
                return true;
              }),
            },
            attributes_function_map: {
              "color": (r, g, b, a, render, elem) => {
                elem.style.p_ud_setProperty("--ud-html4-color", uDark.revert_rgba(r, g, b, a, render));
                elem.setAttribute("ud-html4-support", true);
                elem.removeAttribute("color");
              },
              "text": "color",
              "bgcolor": uDark.rgba
            },
            edit_background_image_urls: function(str) {
              //  var valueblend=["overlay","multiply","color","exclusion"].join(","); 
              return str;
            },
            svgDataURL: function(svg) {
              var svgAsXML = (new XMLSerializer).serializeToString(svg);
              return "data:image/svg+xml," + encodeURIComponent(svgAsXML);
            },
            get_image_base64: function(details) {
              
              return new Promise((resolve, reject) => {
                
                var canvas = document.createElement('canvas');
                var myImage = new Image;
                var normalresolve = x => {
                  
                  canvas.width = myImage.width;
                  canvas.height = myImage.height;
                  var context = canvas.getContext('2d');
                  context.drawImage(myImage, 0, 0);
                  resolve({
                    redirectUrl: canvas.toDataURL()
                  });
                }
                myImage.src = details.url;
                myImage.onload = normalresolve;
                myImage.onerror = x => {
                  resolve({})
                }
                setTimeout(x => resolve({}), 1000);
              });
            },
            magic_a_background(canvasContext, width, height) {
              let theImageData = canvasContext.getImageData(0, 0, width, height),
              colorThreshold = 10,
              blurRadius = 5,
              simplifyTolerant = 5,
              simplifyCount = 300,
              hatchLength = 4,
              hatchOffset = 0,
              imageInfo = null,
              cacheInd = null,
              cacheInds = [],
              downPoint = null,
              mask = null,
              masks = [],
              allowDraw = false,
              currentThreshold = colorThreshold;
              var image = {
                data: theImageData.data,
                width: theImageData.width,
                height: theImageData.height,
                bytes: 4
              };
              // mask = MagicWand.floodFill(image, 0, 0, currentThreshold);
              // mask = MagicWand.gaussBlurOnlyBorder(mask, blurRadius);
              let theImageDataBufferTMP = new ArrayBuffer(theImageData.data.length),
              theImageDataClamped8TMP = new Uint8ClampedArray(theImageDataBufferTMP),
              theImageDataUint32TMP = new Uint32Array(theImageDataBufferTMP),
              n = theImageDataUint32TMP.length;
              theImageDataClamped8TMP.set(theImageData.data);
              imgDataLoop: while (n--) {
                // theImageDataUint32TMP[n]-=0xff000000*mask.data[n]
                var number = theImageDataUint32TMP[n];
                var r = number & 0xff
                var g = (number >> 8) & 0xff
                var b = (number >> 16) & 0xff
                var a = (number >> 24) & 0xff
                // if((r+g+b)/3>200)
                // {
                r = Math.round(r * 0.7)
                g = Math.round(g * 0.7)
                b = Math.round(b * 0.7)
                // }
                var newColor = ((a << 24)) | (b << 16) | (g << 8) | r;
                theImageDataUint32TMP[n] = newColor;
                // seems efficient lol
              }
              
              theImageData.data.set(theImageDataClamped8TMP);
              canvasContext.putImageData(theImageData, 0, 0);
              
            },
            handleMessageFromCS: function(message, sender) {
            },
            parseAndEditHtml3: function(strO, details) {
              let str = strO;
              if (!str || !str.trim().length) {
                return str;
              }
              // 1 : Available slot
              
              // 2. The issue isn't with <noscript> itself, but with any disallowed tag inside the <head>, including those within <noscript>. Many sites make this mistake.
              // The allowed tags in the <head> are: <base>, <link>, <meta>, <style>, <title>, <script>, <noscript>, and <template>.
              // The <noscript> tag has restricted child elements when placed in the <head>; it only allows <link>, <style>, and <meta>.
              // The <template> tag, on the other hand, has no such restrictions and can contain any type of child elements, even in the <head>.
              // The <script> tag is also somewhat unrestricted as it allows raw text content.
              str = str.replaceAll(/<(\/)?noscript/g, "<$1template secnoscript");
              
              // 3. Parse the HTML string into a DOM document
              const aDocument = uDark.createDocumentFromHtml(str);
              // 4. Temporarily replace all SVG elements to avoid accidental style modifications
              const svgElements = uDark.processSvgElements(aDocument, details);
              
              // 5. Edit styles and attributes inline for background elements
              uDark.edit_styles_attributes(aDocument, details);
              uDark.edit_styles_elements(aDocument, details, "ud-edited-background");
              
              // 6. Update meta tags to ensure proper charset is set (avoid issues with content-type)
              uDark.processMetaTags(aDocument);
              
              // 7. Modify inline styles found in the document
              uDark.processInlineStyles(aDocument);
              
              // 8. Add a custom identifier to favicon links to manage cache
              uDark.processLinks(aDocument);
              
              // 9. Process image sources and prepare them for custom modifications
              uDark.processImages(aDocument);
              
              // 10. Recursively process iframes using the "srcdoc" attribute by applying the same editing logic
              uDark.processIframes(aDocument, details, {});
              
              // 11. Handle elements with color attributes (color, bgcolor) and ensure proper color handling
              uDark.processColoredItems(aDocument);
              
              // 12. Inject custom CSS and dark color scheme if required (only for the first data load)
              uDark.injectStylesIfNeeded(aDocument, details); // Only benefit of this ; avoids page being white on uDark refresh
              
              // 13. Restore the original SVG elements that were temporarily replaced
              uDark.restoreSvgElements(svgElements);
              
              // 14. Restore <noscript> elements that were converted to <template>
              uDark.restoreTemplateElements(aDocument);
              
              // 15. Remove the integrity attribute from elements and replace it with a custom attribute
              uDark.restoreIntegrityAttributes(aDocument);
              
              // 16. Return the final edited HTML
              const outerEdited = aDocument.documentElement.outerHTML;
              
              
              return "<!doctype html>" + outerEdited;
            },
          }
        }
        
        Promise.all([
          browser.runtime.getBrowserInfo().then(x=>{
            uDark.browserInfo=x;
            uDark.browserInfo.version=parseInt(x.version.split(".")[0]);
            uDark.browserInfo[[uDark.browserInfo.vendor,uDark.browserInfo.name].join("_")]=uDark.browserInfo.version;
          }),
          // getInjectCSS(["/gre-resources/forms.css", // No  usefull since meta tag and forces links colors to be set at rgba
          // "/gre-resources/ua.css",
          // "/gre-resources/html.css"], actions = {
          //   append: {
          //     inject_css_suggested: uDark
          //   },
          //   edit_css: true,
          //   // unsetMode:"fill_minimum",
          //   detectRareColors: true,
          //   removeNonColors: true
          // }),
          getInjectCSS("/inject_css_suggested.css", {
            append: {
              inject_css_suggested: uDark,
              edit_css: true
            }
          }),
          getInjectCSS("/inject_css_suggested_no_edit.css", {
            append: {
              inject_css_suggested: uDark
            }
          }),
          getInjectCSS("/inject_css_override.css", {
            append: {
              inject_css_override: uDark
            },
            edit_css: true
          }),
          getInjectCSS("/inject_css_override_top_only.css", {
            append: {
              inject_css_override_top_only: uDark
            },
            edit_css: true
          }),
          getInjectCSS("/inject_css_override_no_edit.css", {
            append: {
              inject_css_override: uDark
            }
          })
        ]).then(x => console.info("CSS processed")).then(dark_object.background.setListener)
        
      }
    },
    both: {
      install: function() {
        window.uDark = {
          ...uDark,
          ...{
            on_idk_missing_twice: {
              restore: true,
              fill_black: false,
              fill_color: "red"
            } ["restore"],
            unResolvableVarsRegex: /(?:hsl|rgb)a?\([^)]*\(/, // vars that can't be resolved by the background script
            keepIdkProperties: false,
            // Asking front trough a message to get the css can be costly so we can only do it when it's absolutely necessary: when the cors does not allow us to get the css directly;
            // In the other hand  doing it for all CSS allows to cache only finalised css, so both options are good
            disable_remote_idk_css_edit: false,
            on_idk_missing: "fill_minimum", // "fill_black" or "fill_minimum" or "restore" or "fill_color"
            idk_minimum_editor: 0.2,
            connected_cs_ports: {},
            getPortKey(details){
              return "port-from-cs-" + details.tabId + "-" + details.frameId
            },
            getPort(details){
              return uDark.connected_cs_ports[uDark.getPortKey(details)];
            },
            deletePort(details,moment){
              // console.log("Deleting","port-from-cs-", details.tabId , details.frameId,moment)
              delete uDark.connected_cs_ports[uDark.getPortKey(details)];
            },
            setPort(details,port,moment){
              // console.log("Setting","port-from-cs-", details.tabId , details.frameId,moment)
              uDark.connected_cs_ports[uDark.getPortKey(details)]=port;
            },
            connected_options_ports_count: 0,
            calcMaxPerceiveidLigtness: () => {
              console.info("Processing max perceveid light with actual settings, please wait ...")
              let actualPerceivedLigtness = 0;
              let last_text = "";
              for (var hue = 0; hue <= 360; hue += 1) {
                for (var lum = 0; lum <= 100; lum += 1 / 3) {
                  let rgb_arr1 = uDark.hslToRgb(hue / 360, 1, lum / 100);
                  let rgb_arr = uDark.rgba(...rgb_arr1, 1, (...args) => args);
                  let calcMaxPerceiveidLigtness = uDark.getPerceivedLigtness(...rgb_arr);
                  if (calcMaxPerceiveidLigtness > actualPerceivedLigtness) {
                    last_text = ["hsl", hue, lum, "= rgb", rgb_arr1, ">", rgb_arr, "is brighter than", actualPerceivedLigtness, "with", calcMaxPerceiveidLigtness, "lum"]
                    actualPerceivedLigtness = calcMaxPerceiveidLigtness;
                  }
                }
              }
              console.info(...last_text);
              
              return last_text.filter(x => !x.bold);
            },
            set_the_round_border: function(str) {
              return str.replace(uDark.radiusRegex, "$1;filter:brightness(0.95);box-shadow: 0 0 5px 1px rgba(0,0,0,0)!important;border:1px solid rgba(255,255,255,0.2)!important;$2$7");
            },
            no_repeat_backgrounds: function(str) {
              //    return str.replace(/\/\*(.|\n)*?[^oes][^r][^i]\*\// g,"");
              return str.replace(/(?<![_a-z0-9-])(repeat(-[xy])?)($|["}\n;,)! ])/g, "no-repeat;background-color:rgba(0,0,0,0.5);noprop:$4")
            },
            isInsideSquare(squareTop, squareBottom, squareLeft, squareRight, pointTop, pointLeft) {
              return pointTop >= squareTop && pointTop <= squareBottom && pointLeft >= squareLeft && pointLeft <= squareRight;
              
            },
            restoreTextsOnBackgroundItems() {
              let all_tems = [...document.querySelectorAll("*")];
              let bgItems = [...document.querySelectorAll([...uDark.backgroundItemsSelectors].join(","))]
              .filter(imagedItem => imagedItem.offsetWidth > 50 || imagedItem.offsetHeight > 50)
              .map(imagedItem => {
                let boundingRect = imagedItem.getBoundingClientRect();
                return {
                  item: imagedItem,
                  t1: boundingRect.top + window.scrollY,
                  l1: boundingRect.left + window.scrollX,
                  t2: boundingRect.top + window.scrollY + imagedItem.offsetHeight,
                  l2: boundingRect.left + window.scrollX + imagedItem.offsetWidth,
                }
              });
              let bgColorItem = [...document.querySelectorAll("[style*=background i],[class]")]
              .filter(coloredItem => coloredItem.offsetWidth > 50 || coloredItem.offsetHeight > 50)
              .filter(x => getComputedStyle(x).backgroundColor != "rgba(0, 0, 0, 0)" && !getComputedStyle(x).backgroundImage.includes("url("))
              .map(imagedItem => {
                let boundingRect = imagedItem.getBoundingClientRect();
                return {
                  item: imagedItem,
                  t1: boundingRect.top + window.scrollY,
                  l1: boundingRect.left + window.scrollX,
                  t2: boundingRect.top + window.scrollY + imagedItem.offsetHeight,
                  l2: boundingRect.left + window.scrollX + imagedItem.offsetWidth,
                }
              });
              [...document.querySelectorAll("body *:not(:empty)")].filter(x => getComputedStyle(x).backgroundColor == "rgba(0, 0, 0, 0)").forEach(textItem => {
                let boundingRect = textItem.getBoundingClientRect();
                boundingRect = {
                  t1: boundingRect.top + window.scrollY,
                  l1: boundingRect.left + window.scrollX,
                  t2: boundingRect.top + window.scrollY + textItem.offsetHeight,
                  l2: boundingRect.left + window.scrollX + textItem.offsetWidth,
                }
                bgItems.forEach(bgItem => {
                  if (bgItem.item == window.b1 && textItem == window.f1) {
                    console.log("Found a match", bgItem.item, textItem, bgItem, boundingRect);
                  }
                  textItem.overImage = new Set();
                  if (uDark.isInsideSquare(bgItem.t1, bgItem.t2, bgItem.l1, bgItem.l2, boundingRect.t1, boundingRect.l1)) {
                    textItem.overImage.add("ud_overImage_c1");
                  }
                  if (uDark.isInsideSquare(bgItem.t1, bgItem.t2, bgItem.l1, bgItem.l2, boundingRect.t1, boundingRect.l2)) {
                    textItem.overImage.add("ud_overImage_c2");
                  }
                  if (uDark.isInsideSquare(bgItem.t1, bgItem.t2, bgItem.l1, bgItem.l2, boundingRect.t2, boundingRect.l1)) {
                    textItem.overImage.add("ud_overImage_c3");
                  }
                  if (uDark.isInsideSquare(bgItem.t1, bgItem.t2, bgItem.l1, bgItem.l2, boundingRect.t2, boundingRect.l2)) {
                    textItem.overImage.add("ud_overImage_c4");
                  }
                  
                  if (textItem.overImage.size) {
                    let clone = textItem.cloneNode(true)
                    clone.querySelectorAll("*").forEach(x => x.remove())
                    if (clone.textContent.trim()) {
                      bgColorItem.forEach(bgColorItem => {
                        let zIndexColor = parseInt(getComputedStyle(bgColorItem.item).zIndex) || 0;
                        let zIndexBg = parseInt(getComputedStyle(bgItem.item).zIndex) || 0;
                        if (zIndexBg == zIndexColor) {
                          zIndexColor = all_tems.indexOf(bgColorItem.item);
                          zIndexBg = all_tems.indexOf(bgItem.item);
                        }
                        if (zIndexColor < zIndexBg) {
                          return;
                        }
                        
                        if (uDark.isInsideSquare(bgColorItem.t1, bgColorItem.t2, bgColorItem.l1, bgColorItem.l2, boundingRect.t1, boundingRect.l1)) {
                          textItem.overImage.delete("ud_overImage_c1");
                        }
                        if (uDark.isInsideSquare(bgColorItem.t1, bgColorItem.t2, bgColorItem.l1, bgColorItem.l2, boundingRect.t1, boundingRect.l2)) {
                          textItem.overImage.delete("ud_overImage_c2");
                        }
                        if (uDark.isInsideSquare(bgColorItem.t1, bgColorItem.t2, bgColorItem.l1, bgColorItem.l2, boundingRect.t2, boundingRect.l1)) {
                          textItem.overImage.delete("ud_overImage_c3");
                        }
                        if (uDark.isInsideSquare(bgColorItem.t1, bgColorItem.t2, bgColorItem.l1, bgColorItem.l2, boundingRect.t2, boundingRect.l2)) {
                          textItem.overImage.delete("ud_overImage_c4");
                        }
                      })
                      
                      if (textItem.overImage.size) {
                        textItem.classList.add("ud_overImage", ...textItem.overImage);
                      }
                    }
                  }
                  
                })
                
              })
              
            },
            registerBackgroundItem: function(cssStyle, cssRule, details, timing = 0) {
              if (cssStyle) {
                if ((cssStyle.backgroundImage + " " + cssStyle.background).includes("url(")) {
                  return uDark.registerBackgroundItem(false, cssRule, details); // We validated we will register the background property
                }
                return false; // No Url to register here;
              }
              
              if (uDark.website_context) {
                if (typeof cssRule == "string") {
                  cssRule = {
                    selectorText: cssRule
                  }
                }
                // console.log("Found a class of background image item",cssRule.selectorText);
                uDark.backgroundItemsSelectors = uDark.backgroundItemsSelectors || new Set();
                uDark.backgroundItemsSelectors.add(cssRule.selectorText);
              } else if (uDark.is_background) {
                
                let content_script_port_promise = uDark.get_the_remote_port(details);
                content_script_port_promise.then(content_script_port => {
                  content_script_port.postMessage({
                    registerBackgroundItem: cssRule.selectorText
                  });
                });
              }
            },
          }
        }
        
        
      }
    },
    misc: {
      // editBeforeServiceWorker: async function(details) {
      //   const filter = chrome.webRequest.filterResponseData(details.requestId);
      
      //   const decoder = new TextDecoder("utf-8");
      //   const encoder = new TextEncoder();
      //   details.dataCount=0;
      //   // Stream the data as it is received and modify it
      //   filter.ondata = event => {
        //     details.dataCount++;
      //     // Decode the incoming data chunk
      //     let decodedChunk = decoder.decode(event.data, { stream: true });
      
      //     if(details.dataCount==1){
      //       let code=function(){
      //             setInterval(() => {
        //               console.log("Hello Service Worker!")
      
      //             }, 100);
      
      //       };
      //       console.log("Service worker intercepted",details.url,details);
      //       filter.write(encoder.encode(code.toString().slice(10)+"\n"));
      //     }
      //     // Encode the modified chunk back to binary format and write it to the response stream
      //     filter.write(encoder.encode(decodedChunk));
      //   };
      
      //   // When the response is fully received, close the stream
      //   filter.onstop = () => {
        //     filter.disconnect();
      //   };
      
      //   return {}; // Necessary to indicate a response modification
      
      // },
      
      editBeforeRequestImage: async function(details) {
        if (details.url.startsWith("https://data-image/?base64IMG=")) {
          // console.log(details);
          // console.log("PASSING",(globalThis["passing"+details.url+details.requestId]=(globalThis["passing"+details.url+details.requestId]||0)+1),details);
          const dataUrl = details.url.slice(30);
          // console.log("PASSING",(globalThis["passing"+details.url+details.requestId]=(globalThis["passing"+details.url+details.requestId]||0)+1),details);
          
          const arrayBuffer = await (await fetch(dataUrl)).arrayBuffer();
          const reader = new FileReader() // Faster but ad what cost later ? 
          
          const imageWorker = new uDark.LoggingWorker(uDark.imageWorkerJsFile);
          
          imageWorker.addEventListener("message", event => {
            if (event.data.editionComplete) {
              // console.log("PASSING",(globalThis["passing"+details.url+details.requestId]=(globalThis["passing"+details.url+details.requestId]||0)+1),details);
              
              reader.readAsDataURL(new Blob(event.data.buffers));
            }
          })
          
          imageWorker.postMessage({
            oneImageBuffer: arrayBuffer,
            filterStopped: 1,
            details: details
          }, [arrayBuffer]) // Explicityly transfer the ArrayBuffer to the worker
          
          let to_return = new Promise(resolve => reader.onload = (e) => resolve({
            redirectUrl: reader.result
          }));
          
          to_return.then(x => imageWorker.terminate()); // Very needed : non terminated workers will avoid new workers to reveive messages
          
          // console.log("PASSING",(globalThis["passing"+details.url+details.requestId]=(globalThis["passing"+details.url+details.requestId]||0)+1),details);
          
          return to_return;
        }
      },
      editOnHeadersImage: function(details) {
        // Util 2024 jan 02 we were checking details.documentUrl, or details.url to know if a stylesheet was loaded in a excluded page
        // Since only CS ports that matches blaclist and whitelist are connected, we can simply check if this resource has a corresponding CS port
        if (!uDark.getPort(details)) {
          // console.log("Image","No port found for",details.url,"loaded by webpage:",details.originUrl,"Assuming it is not an eligible webpage, or even blocked by another extension");
          return {}
        }
        
        let imageURLObject = new URL(details.url);
        let n = details.responseHeaders.length;
        details.headersLow = {}
        while (n--) {
          details.headersLow[details.responseHeaders[n].name.toLowerCase()] = details.responseHeaders[n].value;
        }
        
        details.charset = ((details.headersLow["content-type"] || "").match(/charset=([0-9A-Z-]+)/i) || ["", "utf-8"])[1]
        details.isSVGImage = (details.headersLow["content-type"] || "").includes("image/svg")
        
        // Determine if the image deserves to be edited
        if (imageURLObject.pathname.startsWith("/favicon.ico") || imageURLObject.hash.endsWith("#ud_favicon")) {
          return {};
        }
        
        let filter = globalThis.browser.webRequest.filterResponseData(details.requestId); // After this instruction, browser espect us to write data to the filter and close it
        let imageWorker;
        let secureTimeout = setTimeout(() => {
          try {
            filter.disconnect();
            imageWorker && imageWorker.terminate();
          } catch (e) {}
        }, 30000) // Take care of very big images
        details.buffers = details.buffers || [];
        if (details.isSVGImage) {
          let decoder = new TextDecoder(details.charset)
          let encoder = new TextEncoder();
          filter.ondata = event => details.buffers.push(event.data);
          let svgURLObject = new URL(details.url);
          { // Sometimes the website reencodes as html chars the data
            let HTMLDecoderOption = new Option();
            HTMLDecoderOption.innerHTML = svgURLObject.hash;
            svgURLObject.hash = HTMLDecoderOption.textContent;
          }
          let complementIndex = svgURLObject.hash.indexOf(uDark.imageSrcInfoMarker);
          let notableInfos = new URLSearchParams(complementIndex == -1 ? "" : svgURLObject.hash.slice(complementIndex + 6))
          notableInfos = Object.fromEntries(notableInfos.entries());
          notableInfos.remoteSVG = true;
          filter.onstop = event => {
            new Blob(details.buffers).arrayBuffer().then((buffer) => {
              let svgString = decoder.decode(buffer, {
                stream: true
              });
              let svgStringEdited = uDark.frontEditHTML(false, svgString, details, {
                notableInfos,
                svgImage: true,
                remoteSVG: true,
                remoteSVGURL: svgURLObject.href,
                no_body: true,
              });
              filter.write(encoder.encode(svgStringEdited));
              filter.disconnect();
              clearInterval(secureTimeout);
            });
          }
        } else {
          imageWorker = new uDark.LoggingWorker(uDark.imageWorkerJsFile);
          let dataCount = 0;
          imageWorker.addEventListener("message", event => {
            if (event.data.editionComplete) {
              for (let buffer of event.data.buffers) {
                try {
                  filter.write(buffer);
                } catch (e) {
                  console.log("Error", e.message)
                }
              }
              filter.disconnect();
              imageWorker.terminate();
              clearInterval(secureTimeout);
            }
          })
          filter.ondata = event => {
            imageWorker.postMessage({
              oneImageBuffer: event.data
            }, [event.data]) // Explicityly transfer the ArrayBuffer to the worker
            
          }
          filter.onstop = event => {
            imageWorker.postMessage({
              filterStopped: 1,
              details
            });
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
            // console.log("Found an img element",details.url)
            // console.log(details.url,"is not a background image, but an img element",details)
            uDark.registerBackgroundItem(false, {
              selectorText: `img[src='${details.url}']`
            }, details);
          }
        }
        return resultEdit;
        
      },
      
      editBeforeRequestStyleSheet: function(details) {
        let options = {};
        options.isCorsRequest = dark_object.misc.isCorsRequest(details);
        
        // console.log("Loading CSS", details.url, details.requestId, details.fromCache)
        
        // Util 2024 jan 02 we were checking details.documentUrl, or details.url to know if a stylesheet was loaded in a excluded page
        // Since only CS ports that matches blaclist and whitelist are connected, we can simply check if this resource has a corresponding CS port
        if (!uDark.getPort(details)) {
          // console.log("CSS", "No port found for", details.url, "loaded by webpage:", details.originUrl, "Assuming it is not an eligible webpage, or even blocked by another extension");
          // console.log("If i'm lacking of knowledge, here is what i know about this request", details.tabId, details.frameId);
          return {}
        }
        // console.log("Will darken", details.url, details.requestId, details.fromCache)
        
        let filter = globalThis.browser.webRequest.filterResponseData(details.requestId); // After this instruction, browser espect us to write data to the filter and close it
        
        let n = details.responseHeaders.length;
        details.headersLow = {}
        while (n--) {
          details.headersLow[details.responseHeaders[n].name.toLowerCase()] = details.responseHeaders[n].value;
        }
        details.charset = ((details.headersLow["content-type"] || "").match(/charset=([0-9A-Z-]+)/i) || ["", "utf-8"])[1]
        let decoder = new TextDecoder(details.charset)
        let encoder = new TextEncoder();
        details.dataCount = 0;
        details.rejectedValues = "";
        filter.ondata = event => {
          details.dataCount++
          var str = decoder.decode(event.data, {
            stream: true
          }); //str,cssStyleSheet,verifyIntegrity=false,details
          let options = {};
          options.chunk = uDark.edit_str(details.rejectedValues + str, false, true, details, false, options);
          // if(str.includes('import'))
          // {
          // console.log(str)
          // }
          if (options.chunk.message) {
            // console.log(details,transformResult.message)
            details.rejectedValues += str;
            
            // console.info(transformResult.message,details.url,details.rejectedValues.length);
          } else {
            
            details.rejectedValues = "";
            // console.log(details,"Accepted integrity rule")
            if (options.chunk.rejected) {
              // console.log("Accepted a partial integrity_rule ♥",details.url)
              details.rejectedValues = options.chunk.rejected;
              options.chunk = options.chunk.str;
            }
            
            dark_object.misc.chunk_manage_idk_direct(details, options,filter);
            filter.write(encoder.encode(options.chunk));
            // console.log("Accepted integrity_rule",details.url,transformResult)
          }
        }
        filter.onstop = event => {
          
          if (details.rejectedValues.length) {
            
            options.chunk = uDark.edit_str(details.rejectedValues, false, false, details, false, options);
            dark_object.misc.chunk_manage_idk_direct(details, options.chunk,filter);
            filter.write(encoder.encode(options.chunk)); // Write the last chunk if any, trying to get the last rules to be applied, there is proaby invalid content at the end of the CSS;
          }
          
          filter.disconnect(); // Low perf if not disconnected !
          
        }
        
        // return {redirectUrl:details.url};
        // return {responseHeaders:[{name:"Vary",value:"*"},{name:"Location",value:details.url}]};
        return {};
        // must not return this closes filter//
      },
      isCorsRequest: (details) => {
        if(!details.documentUrl){return false;}
        let aUrl = new URL(details.url);
        let bUrl = new URL(details.documentUrl);
        details.origin = aUrl.origin;
        details.doc_origin = bUrl.origin;
        details.hostname = aUrl.hostname;
        details.doc_hostname = bUrl.hostname;
        return (aUrl.origin != bUrl.origin)
      },
      smartClearCache(details,filter)
      {
        if (!details.rejectCache) {
          // This can happen muliple times per page load, since all css requests have its own details object
          // I don't feel to store the document filter that loaded them all, since it would be a lot of work for a very small gain
          // I could store the last filter to removeEventListeners, in the idk_cache object, but it would be a lot of work for a very small gain
          details.rejectCache = true;
          console.log("Setting: Rejecting cache for",details.url,details.doc_hostname,details.type,details.requestId,Date.now()/1); // Works only with doc_hostname, not hostname
          filter.addEventListener("stop", event => {
            setTimeout(() => {
              dark_object.misc.clearCacheForRequest(details,[details.doc_hostname]);
            },900); // Must wait the request is finished, otherwise it will not be uncached. 100,300 were too short. 
            // I moved here the call and the timeout, to avoid triggering the code and the timeout on all requests, even those that are not eligible for uDark
            // Plus it had no perceptible gain to use clearCacheForRequest as a webFilter since it managed many times to exec later than the present code...
            
          })
        }
      },
      resolveIDKViaExec:function(details,chunk,chunk_variables,callback,timeForRetry=50,maxTime=10000,iteration=0){
        
        globalThis.browser.tabs.executeScript(details.tabId, { // This is not the content_script context.
          file:"/resolveIDKVars.js",
          frameId:details.frameId,
          runAt:"document_start",
          matchAboutBlank:true,
        }).then(result0 => globalThis.browser.tabs.executeScript(details.tabId, {
          code: `resolveIDKVars_direct(${JSON.stringify({details,chunk,chunk_variables})})`,
          frameId:details.frameId,
          runAt:"document_start",
          matchAboutBlank:true,})
        ).then(result => {
          let data=result[0];
          if(data.resolved)
            {
            callback(data,{iteration,cumuledWaitTime:iteration*timeForRetry});
          }
          else{
            if(iteration*timeForRetry<maxTime)
              {
              setTimeout(() => {
                dark_object.misc.resolveIDKViaExec(details,chunk,chunk_variables,callback,timeForRetry,maxTime,iteration+1);        
              }, timeForRetry);
            }
          }
          
        })
        
        
        
        
      },
      chunk_manage_idk_direct(details,options,filter)
      {
        
        if (!uDark.disable_remote_idk_css_edit && details.unresolvableChunks) {
          if (!options.unresolvableStylesheet.cssRules.length) {
            console.log("No unresolvable rules found for",details.url,"chunk",details.dataCount)
            return;
          }
          
          if (options.isCorsRequest && uDark.chunk_stylesheets_idk_only_cors) {
            
            // console.log("Skipping chunk as it is not a CORS one", details.url)
            return;
            
          }
          let chunk_hash = fMurmurHash3Hash(options.chunk); 
          
          if (chunk_hash in uDark.idk_cache) {
            // console.log("Skipping chunk as it is already in cache", details.url,details.requestId,details.dataCount)
            options.chunk = uDark.idk_cache[chunk_hash];
            delete uDark.idk_cache[chunk_hash] // Now it has been used and will be put in cache as is, we can clean it.
            return;
          }
          else{
            console.log("Chunk not in cache",chunk_hash);
          }
          
          
          
          let rules = [...options.unresolvableStylesheet.cssRules].map(r => r.cssText);
          let chunk_variables = rules.join("\n");
          chunk_variables = chunk_variables.unprotect_simple("--ud-ptd-");
          
          let resolve_start_time=Date.now()/1;
          dark_object.misc.resolveIDKViaExec(details,options.chunk,chunk_variables,(data,result)=>{
            
            uDark.idk_cache[chunk_hash] = data.chunk;
            console.log("Resolving variables took",Date.now()/1-resolve_start_time,"ms including",result.iteration,"iterations of ",result.cumuledWaitTime,"ms");
            globalThis.browser.tabs.insertCSS(details.tabId, {
              code: data.chunk_variables,
              frameId:details.frameId,
              cssOrigin:"author", // "author" stylesheets behave as if they appear after all author rules specified by the web page. This behavior includes any author stylesheets added dynamically by the page's scripts, even if that addition happens after the insertCSS call completes.
              matchAboutBlank:true,
              runAt:"document_start"
            })
            
          })
          
          let readable_variable_checker = `\n:root{--chunk_is_readable_${details.requestId}_${details.dataCount}:0.55;}`;
          options.chunk += readable_variable_checker;
          
          dark_object.misc.smartClearCache(details,filter);
          
          
          
        }
      },
      
      
      clearCacheForRequest: function(details,hostnames) {
        // console.log("Removing cache for", details.url);
        globalThis.browser.browsingData.removeCache({
          since: (Date.now() - details.timeStamp),
          hostnames: hostnames
        })
        .then(x => {
          console.info(`Browser last`, Date.now() - details.timeStamp, `ms cache of`, hostnames.join(" & "), ` flushed for request`, details.requestId)
          
        }, error => console.error(`Error: ${error}`));
        
        
      },
      
      // editHeadersOnHeadersReceived: function(details) {
      //   console.log("Headers received", details.url)
      
      //   return details;
      // },
      
      setEligibleRequestBeforeData(details){
        details.unEligibleRequest=(details.documentUrl || details.url).match(uDark.userSettings.exclude_regex);
        details.eligibleRequest=!details.unEligibleRequest;
        // Here we have to check the url or the documentUrl to know if this webpage is excluded
        // It already has passed the whitelist check, this is why we only check the blacklist
        // However this code executes before the content script is connected, so we can't check if it will connect or not
        // Even if we could do this, like sending some bytes and waiting for he content script to connect,
        // and it would be not so musch costly in terms of time, some pages as YouTube as the time i write this, somehow manages
        // to send in this very first request tabID -1 and frameID 0, which is not a valid combination, and the content script will never be found
        // stackoverflow says it might be related to worker threads. It's probably true with serviceWorkers
        
        // console.log("Will check",details.url,"made by",details.documentUrl || details.url,0)
        // console.log("Is eligible for uDark",details.eligibleRequest)
        if (details.unEligibleRequest) {
          
          uDark.deletePort(details)
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
        if (details.tabId != -1) {
          // Lets be the MVP here, sometimes the content script is not connected yet, and the CSS will arrive in few milliseconds.
          // This page is eligible for uDark
          // console.log("I'm telling the world that",details.url,"is eligible for uDark", "on", details.tabId,details.frameId)
          uDark.setPort(details,{arrivingSoon:true},0);
          
        }
        
      },
      editBeforeData: function(details) {
        
        
        if (details.tabId == -1 && uDark.connected_options_ports_count || uDark.connected_cs_ports["port-from-popup-" + details.tabId]) { // -1 Happens sometimes, like on https://www.youtube.com/ at the time i write this, stackoverflow talks about worker threads
          
          // Here we are covering the needs of the option page: Be able to frame any page
          let removeHeaders = ["content-security-policy", "x-frame-options", "content-security-policy-report-only"]
          details.responseHeaders = details.responseHeaders.filter(x => !removeHeaders.includes(x.name.toLowerCase()))
        }
        if(!uDark.getPort(details)){ // If setEligibleRequestBeforeData removed the port, we don't want to darken the page
          return {responseHeaders:details.responseHeaders};
        }

        var n = details.responseHeaders.length;
        details.headersLow = {}
        while (n--) {
          details.headersLow[details.responseHeaders[n].name.toLowerCase()] = details.responseHeaders[n].value;
        }
        if (!(details.headersLow["content-type"] || "text/html").includes("text/html")) return {}
        details.charset = ((details.headersLow["content-type"] || "").match(/charset=([0-9A-Z-]+)/i) || ["", "utf-8"])[1]
        
        details.responseHeaders = details.responseHeaders.filter(x => {
          var a_filter = uDark.headersDo[x.name.toLowerCase()];
          return a_filter ? a_filter(x) : true;
        })
        if (!details.fromCache) { // We don't want to edit cached pages, as they are already edited and put in cache !
          let filter = globalThis.browser.webRequest.filterResponseData(details.requestId);
          let decoder = new TextDecoder(details.charset)
          let encoder = new TextEncoder();
          details.dataCount = 0;
          details.writeEnd = "";
          
          filter.ondata = event => {
            details.dataCount++
            details.writeEnd += decoder.decode(event.data, {
              stream: true
            });
          }
          filter.onstop = event => {
            details.dataCount = 1;
            
            details.writeEnd = uDark.parseAndEditHtml3(details.writeEnd, details)
            filter.write(encoder.encode(details.writeEnd));
            filter.disconnect(); // Low perf if not disconnected !
          }
        }
        return {
          responseHeaders: details.responseHeaders
        }
      }
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