window.dark_object = {
  
  all_levels: {

    install: function() {
      
    
      const CSS_COLOR_NAMES = ["AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "DarkOrange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray", "Grey", "Green", "GreenYellow", "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "RebeccaPurple", "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen"]
      
      window.uDark = {
          rgb_a_colorsRegex: /rgba?\([%0-9., \/a-z_+*-]+\)/gmi, // rgba vals with variables names and calcs involved NOTE: #rgba(255 255 255 / 0.1) is valid color rgba(255,255,255,30%) is valid color too
          hsl_a_colorsRegex: /hsla?\(([%0-9., \/=a-z_+*-]|deg|turn|tetha)+\)/gmi, // hsla vals  with variables names and calcs involved  #rgba(255 255 255 / 0.1)
          direct_window_export: true,
          enable_idk_mode: true,
          general_cache:{},
          userSettings: {},
          regex_search_for_url: /url\("(.+?)(?<!\\)("\))/g,
          background_match: /(footer[^\/\\]*$)|background|(bg|box|panel|fond|fundo|bck)[._-]/i,
          chunk_stylesheets_idk_only_cors: false, 
          namedColorsRegex: (new RegExp(`(?<![_a-z0-9-])(${CSS_COLOR_NAMES.join("|")})(?![_a-z0-9-])`, "gmi")),
          min_bright_fg: 0.65, // Text with luminace under this value will be brightened
          max_bright_fg: 0.9, // Text over this value will be darkened
          brightness_peak_editor_fg: 0.5, // Reduce the brightness of texts with intermediate luminace, tying to achieve better saturation
          hueShiftfg: 0, // Hue shift for text, 0 is no shift, 360 is full shift
          min_bright_bg_trigger: 0.2, // backgrounds with luminace under this value will remain as is
          min_bright_bg: 0.1, // background with value over min_bright_bg_trigger will be darkened from this value up to max_bright_bg
          max_bright_bg: 0.4, // background with value over min_bright_bg_trigger will be darkened from min_bright_bg up to this value
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
              
              if(styleSheet.ownerNode.id=="UltimaDarkTempVariablesStyle")
              {
                return false; // Created on the document of the content script and becomes a cors stylesheet. It's already IDK resolved
              }
              if (styleSheet.href) {
  
                let styleSheetHref = (new URL(styleSheet.href))
                let is_cross_domain = styleSheetHref.origin != document.location.origin;
                
                return !is_cross_domain && !uDark.chunk_stylesheets_idk_only_cors; // If it is cross domain, we will do it via a message to the background script
                
              }
              else if(styleSheet.ownerNode.classList.contains("ud-idk-vars")){
                return true;
              }
              return false; // Stylesheet has no href, it is a style element, and is not declared by background as needing IDK intervention.
            });
            editableStyleSheets.forEach(styleSheet => {
              // console.log("Will edit",styleSheet)
              console.log(styleSheet.rules.length,"bug here" ,"https://pom.pm/Tests/test_idkvars_inline_style.html")
              uDark.edit_cssRules(styleSheet.cssRules, true);
            });
          },
          valuePrototypeEditor: function(leType, atName, watcher = x => x, conditon = x => x, aftermath = false) {
            //   console.log(leType,atName)
            // if (conditon) {
            //   console.log("VAdding condtition to", leType, leType.name, conditon, conditon.toString())
            // }
            
            if(leType.wrappedJSObject){ // Cross compatibilty with content script
              leType=leType.wrappedJSObject;
            }
            var originalSet = Object.getOwnPropertyDescriptor(leType.prototype, atName).set;
            Object.defineProperty(leType.prototype, "o_ud_set_" + atName, {
              set: originalSet
            });
            // uDark.general_cache["o_ud_set_"+atName]=originalSet
            Object.defineProperty(leType.prototype, atName, {
              set: exportFunction(function(value) {             // getters must be exported like regular functions
                // console.log("Setting", this, atName, value)
                var new_value = conditon && conditon(this, value) ? watcher(this, value) : value;
                let call_result = originalSet.call(this, new_value || value);
                aftermath && aftermath(this, value, new_value);
                return call_result;
              },window)
            });
          },
          functionPrototypeEditor: function(leType, laFonction, watcher = x => x, conditon = x => x, result_editor = x => x) {
            //  console.log(leType,leType.name,leType.prototype,laFonction,laFonction.name)
            if (laFonction.concat) {
              return laFonction.forEach(aFonction => { 
                uDark.functionPrototypeEditor(leType, aFonction, watcher, conditon, result_editor)
              })
            }
            if(leType.wrappedJSObject){ // Cross compatibilty with content script
              leType=leType.wrappedJSObject;
            }
            // if (conditon) {
            //   console.log("Adding condtition to", leType, leType.name, laFonction, conditon, conditon.toString())
            // }
            let originalFunctionKey="o_ud_" + laFonction.name
            var originalFunction = exportFunction(Object.getOwnPropertyDescriptor(leType.prototype, laFonction.name).value,window);
            Object.defineProperty(leType.prototype, originalFunctionKey, {
              value: originalFunction,
              writable: true
            });
            Object.defineProperty(leType.prototype, laFonction.name, {
              value: {
                [laFonction.name]: exportFunction(function() {
                  if (conditon && conditon(this, arguments)) {
                    // console.log("Setting",leType,laFonction,this,arguments[0],watcher(this, arguments)[0])
                    let watcher_result = watcher(this, arguments);
                    // console.log("watcher_result", this,originalFunction,watcher_result,originalFunctionKey,leType.prototype[originalFunctionKey],this[originalFunctionKey],this.getP);
                    let result = originalFunction.apply(this, watcher_result)
                    return result_editor(result, this, arguments, watcher_result);
                  } else {
                    return (originalFunction.apply(this, arguments));
                  }
                },window)
              } [laFonction.name]
            });
          },
          edit_str_restore_imports_header_way: function(str, rules) {
            let cssHeader = str.split("{", 1)[0];
            // Restore the header as it often contains important information like @import @namespace etc
            // Breaks if the header contains a comment including "{" but it is not a common case
            // Fixable by removing comments before splitting
            rules[0] = cssHeader + (rules.length ? "{" + rules[0].split("{", 2)[1] : "");
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
            let imports = str.match(uDark.cssAtRulesRegex) || [];
            rules.unshift(...imports);


          },
          send_data_image_to_parser: function(str, details,carried={}) {
            if (str.trim().toLowerCase().startsWith('data:') && !uDark.userSettings.disable_image_edition) {
              
              carried.changed=true;
              str = str.replace(/(?<!(base64IMG=))(data:image\/(png|jpe?g|svg\+xml);base64,([^\"]*?))([)'"]|$)/g, "https://data-image.com?base64IMG=$&")
            }
            return str;
          },
          frontEditHTML: (elem, value) => {
            if (elem instanceof HTMLStyleElement) {
              return uDark.edit_str(value)
            }
            var parser = new DOMParser();
            var documentElement = parser.parseFromString(value, "text/html").documentElement;
            documentElement.querySelectorAll("meta[name='color-scheme']").forEach(udMetaDark=>{
    
              udMetaDark.id = "ud-meta-dark"
              udMetaDark.name = "color-scheme";
            })
            documentElement.querySelectorAll("style").forEach(astyle => {
              astyle.innerHTML = uDark.edit_str(astyle.innerHTML);
              // According to https://stackoverflow.com/questions/55895361/how-do-i-change-the-innerhtml-of-a-global-style-element-with-cssrule ,
              // it is not possible to edit a style element innerHTML with its cssStyleSheet alone
              // As long as we are returing a STR, we have to edit the style element innerHTML;
              // astyle.innerHTML=uDark.edit_css(astyle.innerHTML,astyle.sheet);
              astyle.classList.add("ud-edited-content-script")
            });
            documentElement.querySelectorAll("[style]").forEach(astyle => {
              // console.log(details,astyle,astyle.innerHTML,astyle.innerHTML.includes(`button,[type="reset"],[type="button"],button:hover,[type="button"],[type="submit"],button:active:hover,[type="button"],[type="submi`))
              astyle.setAttribute("style", uDark.edit_str(astyle.getAttribute("style")));
            });
    
            documentElement.querySelectorAll("img[src*='data']").forEach(image => {
              image.src = uDark.send_data_image_to_parser(image.getAttribute("src"))
            })
    
            let result_edited= documentElement.innerHTML;
            
            result_edited = result_edited.replace(/[\s\t]integrity=/g, " nointegrity=")
            return result_edited;
          },
          edit_str: function(str, cssStyleSheet, verifyIntegrity = false, details, idk_mode = false, carried = {}) {
            let rejected_str = false;

            if (!cssStyleSheet) {
              cssStyleSheet = new CSSStyleSheet()
              let valueReplace = str + (verifyIntegrity ? "\n.integrity_rule{}" : "");
              cssStyleSheet.o_ud_replaceSync ? cssStyleSheet.o_ud_replaceSync(valueReplace) : cssStyleSheet.replaceSync(valueReplace);
            } else if (!cssStyleSheet.rules.length) {
              return str; // Empty styles from domparser can't be edited as they are not "constructed"
            }
            let nochunk = !verifyIntegrity && !cssStyleSheet.cssRules.length; // if we want to check integrity, it means we have a chunked css
            if (nochunk) {
              str = `z{${str}}`;
              cssStyleSheet.o_ud_replaceSync ? cssStyleSheet.o_ud_replaceSync(str) : cssStyleSheet.replaceSync(str);

              uDark.edit_css(cssStyleSheet, false, details, carried);
              str = cssStyleSheet.cssRules[0].cssText.slice(4, -2);

            } else {

              // Exists the rare case where css only do imports, no rules with {} and integrity cant be verified because it does not close the import with a ";"
              let returnAsIs = (!cssStyleSheet.cssRules.length && !str.includes("{"))
              if (returnAsIs) {
                return str; //don't even try to edit it .
                // Fortunately it is not a common case, easy to detect with zero cssRules, and it mostly are short strings testables with includes
              };

              if (verifyIntegrity) {
                let last_rule = cssStyleSheet.cssRules[cssStyleSheet.cssRules.length - 1];
                let is_rejected = !last_rule || last_rule.selectorText != ".integrity_rule";

                // console.log(cssStyleSheet,last_rule,is_rejected)
                if (is_rejected) {

                  //
                  let can_iterate = cssStyleSheet.cssRules.length > 1; // If there is only one rule, and it's rejected, we dont'have to find the previous one
                  if (can_iterate && (enableLiveChunkRepair = true)) // We accept CSS until it breaks, and cut it from there
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
                    //  console.log(can_iterate,cssStyleSheet,details.url,details.datacount)
                    return new Error("Rejected integrity rule as a whole");
                  }
                }
              }
              uDark.edit_css(cssStyleSheet, idk_mode, details, carried);

              let rules = [...cssStyleSheet.cssRules].map(r => r.cssText);

              uDark.edit_str_restore_imports_all_way(str, rules);

              str = rules.join("\n");
            }

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
          RGBToLightness: (r, g, b) => {

            const l = Math.max(r, g, b);
            const s = l - Math.min(r, g, b);
            return (2 * l - s) / 2;
          },
          
          eget_color: function(anycolor, editColorF = false, cssRule = false, no_color = false) {


            if (!anycolor) {
              return anycolor;
            }


            let theColor = uDark.is_color(anycolor, as_float = true, fill = false, cssRule)
            if (!theColor) {
              // otherwise if it is not a color, we should warn as its a bug in regexpes
              // or frontend does not define a color correctly
              console.info(anycolor, " is not a color (It's ok if frontent does not define a color correctly)")
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
          is_color: function(possiblecolor, as_float = true, fill = false, cssRule,spanp=false) { 
            let cache_key = `${possiblecolor}${as_float}${fill}`
              if (!uDark.userSettings.disable_cache && !spanp && uDark.general_cache[cache_key]) { // See https://jsben.ch/aXxCT for cache effect on performance
                return uDark.general_cache[cache_key];
              }
             if (!possiblecolor || possiblecolor === "none") { // none is not a color, and it not usefull to create a style element for it
              return false
              }
              if(uDark.is_content_script&&possiblecolor.includes("var(")){
                return    uDark.is_color_var(possiblecolor, as_float, fill, cssRule, spanp)
              }
              
              let nonColor="rgba(0,0,0,0.11)";
              uDark.colorWork.canvasContext.fillStyle=nonColor;
              uDark.colorWork.canvasContext.fillStyle=possiblecolor;
              let result = uDark.colorWork.canvasContext.fillStyle;
              if(result==nonColor)
              {
                return false;
              }
              if(as_float)
              {
                if(result.startsWith("#"))
                {
                  hexColor= "0x"+result.slice(1);
                  result= [(hexColor >> 16) & 0xFF, (hexColor >> 8) & 0xFF,   hexColor & 0xFF]
                }
                else {
                { 
                  result=result.match(/[0-9\.]+/g).map(parseFloat)
                }
              }
              if (!uDark.userSettings.disable_cache) {
                uDark.general_cache[cache_key] = result;
              }
              return result;

            }
            

          },  
          is_color_var: function(possiblecolor, as_float = true, fill = false, cssRule, spanp = false) {
            // Must restore spanp feature and use it in frontend capture with flood-color css attribute
            // to catch correctly assignments like style.color=rgba(var(--flood-color),0.5) instead of returning [0,0,0,0]

            // Helped by is_color_var and regexpes, we should not need this block
            if (!possiblecolor || possiblecolor === "none") { // none is not a color, and it not usefull to create a style element for it
              return false
            }

            
            let cache_key = `${possiblecolor}${as_float}${fill}`
            if (!uDark.userSettings.disable_cache && !spanp && uDark.general_cache[cache_key]) {
              return uDark.general_cache[cache_key];
            }
            possiblecolor = possiblecolor.trim().toLowerCase();
            let option = new Option();
            let style = option.style;
            if (cssRule) {
              // apply specific class variables to style
              Object.values(cssRule.style).filter(x => x.startsWith("--")).forEach(x => {
                style.setProperty(x, cssRule.style.getPropertyValue(x))
              })
            }

            style.floodColor = possiblecolor;

            let result = style.floodColor; // Must be done in 2 steps to avoid same value as possiblecolor

            if (!style.floodColor) {
              // Impossible color : browser said so
              return false;
            }
            if (style.floodColor == possiblecolor) {
              // Browser said it is a color but doubt it is a valid one, we need a further check
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

              if (!uDark.userSettings.disable_cache) {
                uDark.general_cache[cache_key] = result;
              }
            }
            return result;
          },
          
          rgba_rgb: function(r, g, b, a,render=false) {
            render=(render||uDark.rgba_val)
            a = typeof a == "number" ? a : 1
            let lightness=uDark.RGBToLightness(r,g,b);
            let max_channel=Math.max(r,g,b);
            let min_chanel=Math.min(r,g,b);
            let scale=204;
            if(lightness>uDark.min_bright_bg_trigger*255)
            {
              [r,g,b]=[r,g,b].map(x=>x-min_chanel);
            }
            if(lightness>127&&Math.min(r,g,b)<26)
            {
              [r,g,b]=[r,g,b].map(x=>Math.min(x+26,255));
            }

            return render(...[r, g, b], a);

            
          },
          rgba_via_canvas: function(r, g, b, a,render=false) { // Too slow even without being completed with complex logics
            render=(render||uDark.rgba_val)
            a = typeof a == "number" ? a : 1
            let colorYindex=0;
            let colorXPos=uDark.colorWork.indexes[colorYindex];
            if(colorXPos==0)
            {
              let min_chanel=255*uDark.min_bright_bg;
              uDark.colorWork.canvasContext.fillStyle = uDark.rgba_val(min_chanel, min_chanel, min_chanel, 1);
              uDark.colorWork.canvasContext.fillRect(0, 0, uDark.colorWork.canvasWidth, 1);         
            }

            let lightness=uDark.RGBToLightness(r,g,b);
            if(lightness>127)
            {
              uDark.colorWork.canvasContext.fillStyle = uDark.rgba_val(r, g, b, 1-lightness/255);
              uDark.colorWork.canvasContext.fillRect(colorXPos, colorYindex, 1, 1);
              pixel=uDark.colorWork.canvasContext.getImageData(colorXPos, colorYindex, 1, 1);
              [r,g,b]=pixel.data
              // console.log("3",uDark.colorWork.canvasContext.fillStyle,uDark.rgba_val(r, g, b, 1),lightness)
              // console.log(1,...pixel.data );
              uDark.colorWork.indexes[colorYindex]=uDark.colorWork.indexes[colorYindex]%uDark.colorWork.canvasWidth;
            }

            return render(...[r, g, b], a);

            
          },
          rgba: (r, g, b, a, render = false) => {
            // Lets remove any brightness from the color
            render = (render || uDark.rgba_val)
            a = typeof a == "number" ? a : 1

            
            let [h, s, l] = uDark.rgbToHsl(r, g, b);
            if (l > uDark.min_bright_bg_trigger) {

              
              // https://www.desmos.com/calculator/oqqi9nzonh
              let B = uDark.min_bright_bg;
              let A = uDark.max_bright_bg
              // let scaleToA = uDark.userSettings.noScaleToA && l<A;
              if (l > 0.5) {
                l = 1 - l; // Invert the lightness for bightest colors
              }
              //  l = Math.sin(Math.PI*l)*(A-B)+B;

              // if(!scaleToA)
              // {
              l = Math.min(2 * l, -2 * l + 2) * (A - B) + B;
              // }
            }
            [r, g, b] = uDark.hslToRgb(h, s, l);
            return render(...[r, g, b], a);

          },
          revert_rgba: function(r, g, b, a, render) {
            render = (render || uDark.rgba_val)
            a = typeof a == "number" ? a : 1
            let [h, s, l] = uDark.rgbToHsl(r, g, b);
            let A = uDark.min_bright_fg
            let B = uDark.max_bright_fg
            let E = uDark.brightness_peak_editor_fg

            let ol = l;

            // l = Math.sin(Math.PI*l)*(A-B)+B;
            l = Math.min(2 * l, -2 * l + 2) * (A - B) + B; // Was a good one, but we may boost saturation as folowing lines shows
            // Still not sure about the best way to do it ^ has implicity while indeed a saturation boost might be nice
            // l = Math.pow(Math.min(2 * l, -2 * l + 2),E) * (A - B) + B;
            if (l > .60 && h > 0.66 && h < 0.72) {
              // FIXME: EXPERIMENTAL:
              h += 0.66 - 0.72; // Avoid blueish colors being purple 
            }
            // i dont like how saturation boost gives a blue color to some texts like gitlab's ones.
            // s=1-Math.pow(1-s,1/E); // Boost saturation proportionnaly as brightness decrease, but we could have a separate setting for saturation boost

            // h=h-(l-ol)/4; // Keep the same hue, but we could have a separate setting for hue shift


            [r, g, b] = uDark.hslToRgb(h, s, l);


            return render(...[r, g, b], a);
          },
          
          edit_cssRules: (cssRules, idk_mode = false, details, carried, callBack = uDark.edit_cssProperties) => {
            [...cssRules].forEach(cssRule => {
              if (cssRule.cssRules && cssRule.cssRules.length) {
                return uDark.edit_cssRules(cssRule.cssRules, idk_mode, details, carried, callBack);
              } else if (cssRule.style && cssRule.constructor.name != "CSSFontFaceRule") {
                callBack(cssRule, idk_mode, details, carried);
              }
            })
          },
          
          edit_css_urls: function(cssStyle, cssRule, details, property = "background-image")
          {
            let value = cssStyle.getPropertyValue(property);
            // Its very neccessary to not edit property if they dont contain a url, as it changes a lot the CSS if there are shorthand properties involved : setting bacground image removes bacground property
            
            // Instead of registering the image as a background, we will encode the selector in the URL 
            // and register the image as a background image only when it is downloaded, in the filter script
              
              let carried={};
              value = value.replace(uDark.regex_search_for_url, (match, g1) => {
              //changed = true;
              let link = g1.trim();
              
              link = uDark.send_data_image_to_parser(link,false,carried);
              carried.changed=true;
              let usedChar = link.includes("#") ? "&" : "?"
              usedChar = "#";
              link += usedChar + "uDark_cssClass=" + encodeURIComponent(cssRule.selectorText);
              return 'url("' + link + '")';
            })
            
            if (carried.changed) {
              cssStyle.setProperty(property, value);
            }

          },
          
          css_properties_wording_action: function(cssStyle, keys, details, cssRule) {
            keys.forEach(key => {
              let action = uDark.css_properties_wording_action_dict[key];

              if (action) {


                if (action.replace) {
                  let value = cssStyle.getPropertyValue(key);
                  cssStyle.setProperty(key, value.replaceAll(...action.replace));
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
                  cssStyle.setProperty(vars.rKey, new_value);

                }
                if (action.callBacks) {
                  action.callBacks.forEach(callBack => {
                    callBack(cssStyle, cssRule, details);
                  });
                }
              }

            });
          },
          ceilBrigthness: function(str) {
              // 9 nested vars or parentheis: if a parethesis is open we expect it to be closed.
                return str.replaceAll(/((?:rgb|hsl)a?\()(\((\((\((\((\((\((\((.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)/g, (match,g1) => {
                  let intermediate=match.slice(g1.length,-1);
                  let inside=intermediate.split(/[,](?![^(]*\))/);
                  if(inside.length>=3)
                  {
                    if(g1.startsWith("rgb"))
                    {
                      for(let i=0;i<3;i++)
                      {
                        inside[i]=`min(${inside[i]},180)`
                      }
                    }
                    else if(g1.startsWith("hsl"))
                    {
                      inside[2]=`min(${inside[2]},0.5)`
                    }
                    match=g1+inside.join(",")+")";
                  }
                  return match;
                })
          },
          idk_twice_actions: {
            "background": (cssRule, idk_value) => {
              let result = uDark.ceilBrigthness(idk_value);
              return result;
              // old way:
              // cssRule.style.setProperty("background-blend-mode", "darken", "important");
              // return idk_value + " linear-gradient(rgba(168, 168, 168, 1),rgba(168, 168, 168, 1))"; 
            },
            "background-image": (cssRule, idk_value) => {
              return uDark.ceilBrigthness(idk_value);
            },
            "background-color": (cssRule, idk_value) => {
              return uDark.ceilBrigthness(idk_value);

              // old way:
              // cssRule.style.setProperty("background-blend-mode", "darken", "important");
              // let background_image = cssRule.style.getPropertyValue("background-image");
              // let result = `linear-gradient(${idk_value},${idk_value}), linear-gradient(rgba(168, 168, 168, 1),rgba(168, 168, 168, 1))`;
              // if (background_image) {
              //   result = background_image + "," + result;
              // }
              // cssRule.style.setProperty("background-image", result);
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
              let maybe_array = uDark.eget_color(restored, false, cssRule, uDark.on_idk_missing_twice)
              if (maybe_array.push) {
                return transformation(...maybe_array, render);
              }
              // console.log("Fully failed to get '",key,"' from",maybe_array,cssRule,match);
              if (uDark.idk_twice_actions[key]) {
                maybe_array = uDark.idk_twice_actions[key](cssRule, restored);
                console.log(maybe_array, "from", restored);
              }
              return maybe_array;
            });
          },

          hexadecimalColorsRegex: /#[0-9a-f]{3,4}(?:[0-9a-f]{2})?(?:[0-9a-f]{2})?/gmi, // hexadecimal colors
          foreground_color_css_properties: ["color", "fill"], // css properties that are foreground colors
          // Gradients can be set in background-image
          background_color_css_properties_regex: /color|fill|box-shadow|^background(?:-image|-color)?$/, // css properties that are background colors
          edit_prefix_fg_vars: function(idk_mode, value, actions) {
            if (!value.includes("var(") && !idk_mode) {
              return value; // No variables to edit;
            }
            return value.replace(/(?<!a-z0-^9-_])--([a-z0-9-_])/g, "--ud-fg--$1")
          },
          restore_idk_vars: function(idk_mode, value) {
            if (idk_mode) {
              value = value.replaceAll("..1..", "var(").replaceAll("..2..", ")").replaceAll("..3..", "calc(");
              // value = CSS_COLOR_NAMES[Math.floor(Math.random() * CSS_COLOR_NAMES.length)];
            }
            return value;
          },

          edit_all_cssRule_colors_cb: (idk_mode, cssRule, key, key_idk, value, transformation, render, hasUnresolvedVars, key_prefix, actions, topLevelRule) => {
            let cssStyle = cssRule.style;
            cssRule[key] = "done"; // Used right above to avoid reprocessing, already deleted once by mistake, this is why this comment exists now :)
            let priority = cssStyle.getPropertyPriority(key_idk);

            if (uDark.is_background && uDark.unResolvableVarsRegex.test(value) && value.includes("var(")) { // To complicated to write a rgex for this, so we will use a simple test
              if (!topLevelRule.unresolvableRule) {
                hasUnresolvedVars.carried.unresolvableStylesheet.insertRule(topLevelRule.cssText, hasUnresolvedVars.carried.unresolvableStylesheet.cssRules.length);
                topLevelRule.unresolvableRule = true;
              }



              // console.log(uDark.is_background,key,value,"has unresolvable vars, skipping");
              hasUnresolvedVars.has = hasUnresolvedVars.has || true;
              cssStyle.setProperty("--ud-idk_" + key, value, priority);
              uDark.on_idk_missing == "remove" && cssStyle.removeProperty(key)
              uDark.on_idk_missing == "fill_black" && cssStyle.setProperty(key, transformation(0, 0, 0, 1, render), priority);

              uDark.on_idk_missing == "fill_minimum" && cssStyle.setProperty(key, transformation(...uDark.hslToRgb(0, 0, uDark.max_bright_bg * uDark.idk_minimum_editor), 1, render), priority);
              uDark.on_idk_missing == "fill_red" && cssStyle.setProperty(key, transformation(129, 0, 0, 1, render), priority);
              uDark.on_idk_missing == "fill_green" && cssStyle.setProperty(key, transformation(0, 129, 0, 1, render), priority);
              return;
            } else if (idk_mode) {

              {
                if (!uDark.keepIdkProperties) {
                  cssStyle.removeProperty(key_idk);
                }
                //value.match(/(var|calc)\((\((\((\((\((\((\((\((.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)/g) 
                // 9 nested vars or parentheis: keep hsl or RGBA bounds if a parethesis is open we expect it to be closed.
                value = value.replaceAll(/(var|calc)\((\((\((\((\((\((\((\((.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)|.)*?\)/g, match => match.replaceAll("var(", "..1..").replaceAll(")", "..2..").replaceAll("calc(", "..3.."));
                // value = value.replaceAll(/(var|calc)\([^()]+\)/g, match => match.replaceAll("var(", "..1..").replaceAll(")", "..2..").replaceAll("calc(", "..3.."))

              }
            }
            // if(debug=cssRule.cssText.includes(uDark.searchedCssText))
            // {
            //   console.log("Catched 1.1", idk_mode,cssRule.cssText,key_idk,key,value,actions,uDark.is_background && uDark.unResolvableVarsRegex.test(value)) 
            // }
            if (actions.prefix_fg_vars) {
              value = uDark.edit_prefix_fg_vars(idk_mode, value, actions);
            }

            // if(debug=cssRule.cssText.includes(uDark.searchedCssText))
            // {
            //   console.log("Catched 1.2", idk_mode,cssRule.cssText,key_idk,key,value,actions,uDark.is_background && uDark.unResolvableVarsRegex.test(value)) 
            // }

            
      
            value = uDark.edit_with_regex(idk_mode, key, value, uDark.rgb_a_colorsRegex, transformation, render, idk_mode ? cssRule : false); // edit_rgb_a_colors
            value = uDark.edit_with_regex(idk_mode, key, value, uDark.hsl_a_colorsRegex, transformation, render, idk_mode ? cssRule : false); // edit_hsl_a_colors
            value = uDark.restore_idk_vars(idk_mode, value); // Restore alone vars: color: var(--color_8)
            value = uDark.edit_with_regex(false /*The namedColorsRegex is not affected*/ , key, value, uDark.namedColorsRegex, transformation, render); // edit_named_colors
            value = uDark.edit_with_regex(false /*The hexadecimalColorsRegex is not affected*/ , key, value, uDark.hexadecimalColorsRegex, transformation, render); // edit_hex_colors // The browser auto converts hex to rgb, but some times not like in  var(--123,#00ff00) as it cant resolve the var

            cssStyle.setProperty(key_prefix + key, value, priority); // Once we had  an infinite loop here when uDark was loaded twice and redefining setProperty.
            // console.log("cssKey Color",cssRule,key,value,priority,cssRule.cssText);
          },
          edit_all_cssRule_colors(idk_mode, cssRule, keys, transformation, render, hasUnresolvedVars, key_prefix = "", actions = {}, callBack = uDark.edit_all_cssRule_colors_cb) {
            // render = (render||uDark.rgba_val);
            // console.log(idk_mode,cssRule,keys,transformation,render,key_prefix,actions);
            let topLevelRule = cssRule;
            while (topLevelRule.parentRule) {
              topLevelRule = topLevelRule.parentRule; // Even media rules can have parentRule: its called Layers
            }
            keys.forEach(key => {
              let key_idk = ((idk_mode === true) ? "--ud-idk_" : "") + key;
              let value = cssRule.style.getPropertyValue(key_idk) || "";



              if (!value) { // Value is not set when using shorthand and var(--background-color) is used
                /* This is testable with
                    aCSS=new CSSStyleSheet();
                    aCSS.replaceSync("z{border:var(--bd-color);background:var(--bg-color);}");
                    Object.values(aCSS.cssRules[0].style)
                    cssRule=aCSS.cssRules[0];
                    for(x of cssRule.style){console.log(x)}
                */
                if (key.endsWith("-color")) { // For now only background-color and border-[side]-color can bother us
                  key = key.slice(0, -6);
                  if (cssRule[key]) return;
                  value = cssRule.style.getPropertyValue(key);
                }
                if (!value && key.startsWith("border-")) { // And now border-[side]
                  key = "border";
                  if (cssRule[key]) return;
                  value = cssRule.style.getPropertyValue(key); // background-color is not always set if using background shorthand and var(--background-color) is used
                }
              }
              if (value) {

                callBack(idk_mode, cssRule, key, key_idk, value, transformation, render, hasUnresolvedVars, key_prefix, actions, topLevelRule);
              }
            });
          },

          edit_cssProperties: function(cssRule, idk_mode = false, details, carried) {
            let foreground_items = [],
              variables_items = [],
              background_items = [],
              wording_action = [];

            for (let x of cssRule.style) {
              if (idk_mode === true) {
                if (x.startsWith("--ud-idk_")) {
                  x = x.slice(9);
                } else {
                  continue;
                }
              }

              if (x.startsWith("--")) { // Partial idk mode must not edit variables
                variables_items.push(x);
                continue;
              } // Eliminate Variables, i don't think its usefull to test them againt regexes
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



            let hasUnresolvedVars = {
              has: false,
              carried: carried,
            }; // Passed by reference. // request details are shared so we use a new object. We could have emedded it into details though

            wording_action.length && uDark.css_properties_wording_action(cssRule.style, wording_action, details, cssRule);
            background_items.length && uDark.edit_all_cssRule_colors(idk_mode, cssRule, background_items, uDark.rgba, uDark.rgba_val, hasUnresolvedVars)

            foreground_items.length && uDark.edit_all_cssRule_colors(idk_mode, cssRule, foreground_items, uDark.revert_rgba, uDark.rgba_val, hasUnresolvedVars, "", {
              prefix_fg_vars: true
            })
            variables_items.length && [uDark.edit_all_cssRule_colors(idk_mode, cssRule, variables_items, uDark.revert_rgba, uDark.rgba_val, hasUnresolvedVars, "--ud-fg", {
              prefix_fg_vars: true
            }), uDark.edit_all_cssRule_colors(idk_mode, cssRule, variables_items, uDark.rgba, uDark.rgba_val, hasUnresolvedVars)]

            if (details && hasUnresolvedVars.has) {

              details.unresolvableChunks = details.unresolvableChunks || [];
              details.unresolvableChunks[details.datacount] = true;
            }
          },
          edit_css: function(cssStyleSheet, idk_mode, details, carried = {}) {


            unresolvableStylesheet = new CSSStyleSheet();

            carried.cssStyleSheet = cssStyleSheet;
            carried.unresolvableStylesheet = unresolvableStylesheet;

            uDark.edit_cssRules(cssStyleSheet.cssRules, idk_mode, details, carried);

            // console.log("BEFORE",unresolvableStylesheet.cssRules)
            carried.has_idk_vars = unresolvableStylesheet.cssRules.length>0;
            uDark.edit_cssRules(unresolvableStylesheet.cssRules, false, details, {}, function(rule) {
              uDark.edit_all_cssRule_colors(false, rule, Object.values(rule.style), false, false, false, key_prefix = "", actions = {},
                function(idk_mode, cssRule, key, key_idk, value, transformation, render, hasUnresolvedVars, key_prefix, actions, topLevelRule) {

                  if (!uDark.unResolvableVarsRegex.test(value) && !uDark.is_color(value)) {
                    cssRule.style.removeProperty(key);
                  }
                });
            })


            // console.log("Unresolvable rules",unresolvableStylesheet,unresolvableStylesheet.cssRules.length);
          },

      };
      
      uDark.colorWork={
        canvasWidth: 5,
        canvasHeight: 3,
        indexes:Array(3).fill(0),
      }
      uDark.colorWork.canvas=document.createElement('canvas');
      uDark.colorWork.canvas.width=uDark.colorWork.canvasWidth;
      uDark.colorWork.canvas.height=uDark.colorWork.canvasHeight;
      uDark.colorWork.canvasContext=uDark.colorWork.canvas.getContext('2d');
      window.uDark.css_properties_wording_action_dict = {
        "mix-blend-mode": {
          replace: ["multiply", "normal"]
        },
        "color-scheme": {
          replace: ["light", "dark"]
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
          callBack: [uDark.edit_css_urls]
        },


        // Not good for wayback machine time selector
        // "color":{ stickConcatToPropery: {sValue:"(",rKey:"mix-blend-mode", stick:"difference"}}, // Not good for wayback machine time selector
        // "position":{ stickConcatToPropery: {sValue:"fixed",rKey:"filter", stick:"contrast(110%)"}}, // Not good for wayback machine time selector
      };
    },
  },

  user_content: {
    install: function() {
      console.info("UltimaDark","User content script install", document.location.href);
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
        if (bodycolor != "rgba(0, 0, 0, 0)") {
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
      if (breakpages = false) {



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
        uDark.functionPrototypeEditor(CSSStyleDeclaration, CSSStyleDeclaration.prototype.setProperty, (elem, args) => {
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
      

      console.info("UltimaDark","Content script install", window);

      window.uDark = {...uDark,...{
       is_content_script:true,


        

      }}

      if(uDark.direct_window_export)
      {
        let injectscripts = [dark_object.all_levels.install, dark_object.content_script.override_website].map(code => {
          return "(" + code.toString() + ")()";
        })
        window.wrappedJSObject.eval(injectscripts.join(";"));

        
      }
    

      browser.storage.local.get(null, function(res) {
        window.uDark.userSettings = res;
        if(uDark.direct_window_export)
        {
          // let loadSettings = function() {
          //   uDark.userSettings=JSON.parse('{res}');
          // };
          // window.wrappedJSObject.eval("(" + loadSettings.toString().replace('{res}',JSON.stringify(uDark.userSettings).replaceAll(/(['\\])/g,"\\$1")) + ")()");
          window.wrappedJSObject.uDark.userSettings = cloneInto(res, window); // Using eval here has no gain, on browserbench.org it has equal performance
        }
      });
      // NOTE: DROPS SIGNIFICANTLY THE PERFORMANCE, prefer use eval
      if(exportUlimaDarkToForeground=false){ // Under test but not usefull anymore

        window.wrappedJSObject.uDark = cloneInto({ // Export functions the page needs to use
          rgba: uDark.rgba,
          rgba_via_canvas: uDark.rgba_via_canvas,
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
          edit_str:uDark.edit_str,
        }, window, {
          cloneFunctions: true
        });

      }

      let myPort = browser.runtime.connect({
        name: "port-from-cs"
      });
      
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
              let ikd_chunk_resolved = uDark.edit_str(data.chunk, false, false, false, true);
                  
              let idk_variables_only = uDark.edit_str(data.chunk_variables , false, false, false, "partial_idk");
              
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
              console.log("Timeout: on chunk",data.details.datacount,"for",data.details.requestId,"(url:",data.details.url,")","Search for",readable_variable_check_value,"was not successful");
              // console.log("It was containing:", uDark.edit_str(data.chunk_variables , false, false, false, "partial_idk"));
              clearInterval(workInterval);
            }, 10000); // If the chunk is not written after 10 seconds, we stop waiting for it.
          }
      };
      
      function registerBackgroundItem(selectorText) {
        // NOTE: TODO: Disable registerBackgroundItem for now, but re-enable it later
        //window.uDark.registerBackgroundItem(false, selectorText, false); // go directly to the edit, the validation is already done
      }
      
      myPort.onMessage.addListener(function(m) {
        // console.log("In content script, received message from background script: ",m);
      
          m.havingIDKVars && resolveIDKVars(m.havingIDKVars);
          m.registerBackgroundItem && registerBackgroundItem(m.registerBackgroundItem);
      });
      
      

      console.info("UltimaDark","Content script ready", window);
    },
    
    website_load: function() {
      
      if (uDark.enable_idk_mode) { // Use of an observer was consuming too much ressources
        
        uDark.do_idk_mode_timed();
      }
    },
    override_website: function() {
      start = new Date()/1;
      console.log("UltimaDark","Content script override website",start = new Date()/1 );
      // console.log(globalThis.exportFunction)
      {// Measure the impact of exportFunction on performance by disabling its behavior
        
        // globalThis.exportFunction=f=>f;
      }
      if(uDark.direct_window_export)
      {
        document.wrappedJSObject=document;
        // Avoid infinite loops 
        if (window.uDark && window.uDark.installed) {
          return; // Already fully installed. Do not reinstall if somehow another uDark object gets injected in the page
        } else {
          uDark.installed = true;
        }


        // Emulate content script exportFunction in one line;
        globalThis.exportFunction=f=>f;

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
      console.info("UltimaDark","Websites overrides install", window);

      uDark.functionPrototypeEditor(CSSStyleSheet,
        [
          CSSStyleSheet.prototype.replace,
          CSSStyleSheet.prototype.replaceSync
        ], (elem, args) => { // Needed to manage it some day, now done :)
          args[0] = uDark.edit_str(args[0]);
          return args;
        })
      // This is the one youtube uses
      uDark.valuePrototypeEditor(Element, "innerHTML", uDark.frontEditHTML, (elem, value) => value && value.toString().includes('style') || elem instanceof HTMLStyleElement); // toString : sombe object can redefine tostring to generate thzir inner
      //geo.fr uses this one
      uDark.valuePrototypeEditor(Element, "outerHTML", uDark.frontEditHTML, (elem, value) => value && value.toString().includes('style') || elem instanceof HTMLStyleElement); // toString : sombe object can redefine tostring to generate thzir inner

      // This is the one google uses
      uDark.functionPrototypeEditor(Element, Element.prototype.insertAdjacentHTML, (elem, args) => {
        args[1] = uDark.frontEditHTML("ANY_ELEMENT", args[1]); // frontEditHTML have a diffferent behavior with STYLE elements
        return args;
      }, (elem, args) => args[1].includes("style"))

      if(uDark.enable_idk_mode && !uDark.chunk_stylesheets_idk_only_cors /*Block not needed if cors is done by background and postMessage*/){
        // Do IDK mode for a while if a script is added or edited ( We don't know when it will be aded to the page, 5000ms is enough)
        // Optimisation is done in do_idk_mode, witha boolean called idk_mode_ok which is lost on href edits, so it is not a problem to do it several times
        uDark.valuePrototypeEditor(HTMLLinkElement, "href", (elem, value) => value, (elem, value) => {
          return true;
        }, (elem, value, new_value) => uDark.do_idk_mode_timed(5000, 300))

      }


      if (checkDomEdit = false) {

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
        for (i = 20; i; i--) {
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
        
      }, (elem, value) => elem instanceof HTMLStyleElement)



      uDark.valuePrototypeEditor(CSS2Properties, "background", (elem, value) => {
        let possiblecolor = uDark.is_color(value);
        return possiblecolor ? uDark.rgba(...possiblecolor) : value;

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

      uDark.valuePrototypeEditor(CSS2Properties, "backgroundColor", (elem, value) => uDark.rgba(...uDark.eget_color(value)))
      uDark.valuePrototypeEditor(CSS2Properties, "background-color", (elem, value) => uDark.rgba(...uDark.eget_color(value)))
      uDark.valuePrototypeEditor(CSS2Properties, "color", (elem, value) => uDark.revert_rgba(...uDark.eget_color(value)))
      uDark.valuePrototypeEditor(HTMLElement, "style", (elem, value) => uDark.edit_str(value)) // Care with "style and eget, this cause recursions"
      // TODO: Support CSS url(data-image) in all image relevant CSS properties like background-image etc

      uDark.valuePrototypeEditor(HTMLElement, "innerText", (elem, value) => {
        return uDark.edit_str(value)
      }, (elem, value) => value && elem instanceof HTMLStyleElement);

      console.info("UltimaDark","Websites overrides ready", window, "elapsed:" ,(new Date()/1)-start);

    
      
    }
  },
  background: {
    defaultRegexes: {
      white_list: ["<all_urls>", "*://*/*", "https://*.w3schools.com/*"].join('\n'),
      black_list: ["*://example.com/*"].join('\n')
    },
    filterContentScript: function(x) {
      return x.match(/<all_urls>|^(https?|wss?|file|ftp|\*):\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^file:\/\/\/.*$|^resource:\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^about:$/)
    },
    setListener: function() {
      browser.storage.local.get(null, function(res) {
        uDark.userSettings = res;
        uDark.userSettings.properWhiteList = (res.white_list || dark_object.background.defaultRegexes.white_list).split("\n").filter(dark_object.background.filterContentScript)
        uDark.userSettings.properBlackList = (res.black_list || dark_object.background.defaultRegexes.black_list).split("\n").filter(dark_object.background.filterContentScript)
        uDark.userSettings.exclude_regex = (res.black_list || dark_object.background.defaultRegexes.black_list).split("\n").map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Sanitize regex
          .replace(/(^<all_urls>|\\\*)/g, "(.*?)") // Allow wildcards
          .replace(/^(.*)$/g, "^$1$")).join("|") // User multi match)
        uDark.idk_cache = {};
        uDark.resolvedIDKVars_action_timeout = 400; // edit_str from 2024 january was ok with 210 for both editing and messaging, 250 Should be enough for now
        uDark.fixedRandom = Math.random();

        browser.webRequest.onHeadersReceived.removeListener(dark_object.misc.editBeforeData);
        browser.webRequest.onBeforeRequest.removeListener(dark_object.misc.editBeforeRequestStyleSheet);
        browser.webRequest.onBeforeRequest.removeListener(dark_object.misc.editBeforeRequestImage);
        browser.webRequest.onCompleted.removeListener(dark_object.misc.onCompletedStylesheet);
        /*Experimental*/
        // browser.webRequest.onHeadersReceived.removeListener(dark_object.misc.editHeadersOnHeadersReceived);
        /*end of Experimental*/
        if (uDark.regiteredCS) {
          uDark.regiteredCS.unregister();
          uDark.regiteredCS = null
        }
        if (!res.disable_webext && uDark.userSettings.properWhiteList.length) {
          browser.webRequest.onHeadersReceived.addListener(dark_object.misc.editBeforeData, {
              urls: uDark.userSettings.properWhiteList,
              types: ["main_frame", "sub_frame"]
            },
            ["blocking", "responseHeaders"]);

          browser.webRequest.onBeforeRequest.addListener(dark_object.misc.editBeforeRequestStyleSheet, {
              // urls: uDark.userSettings.properWhiteList, // We can't assume the css is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
              urls: ["<all_urls>"],
              types: ["stylesheet"]
            },
            ["blocking"]);

          /*Experimental*/
          // browser.webRequest.onHeadersReceived.addListener(dark_object.misc.editHeadersOnHeadersReceived, {
          //     // urls: uDark.userSettings.properWhiteList, // We can't assume the css is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
          //     urls: ["<all_urls>"],
          //     types: ["stylesheet"]
          //   },
          //   ["blocking"]);
          /*end of Experimental*/

          browser.webRequest.onBeforeRequest.addListener(dark_object.misc.editBeforeRequestImage, {
              urls: ["<all_urls>"],
              // urls: uDark.userSettings.properWhiteList, // We can't assume the image is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
              types: ["image"]
            },
            ["blocking"]);

          browser.webRequest.onCompleted.addListener(dark_object.misc.onCompletedStylesheet, {
            // urls: uDark.userSettings.properWhiteList, // We can't assume the css is on a whitelisted domain, we do it either via finding a registered content script or via checking later the documentURL
            urls: ["<all_urls>"],
            types: ["stylesheet"]
          });

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

          var contentScript = {
            matches: uDark.userSettings.properWhiteList,
            excludeMatches: uDark.userSettings.properBlackList,

            // js : [{code: uDark.injectscripts_str}],
            js: [{
                file: "content_script.js"
              },
              {
                file: "background.js"
              },
              {
                file: "MurmurHash3.js"
              }
            ], // Forced overrides
            css: [{
              code: uDark.inject_css_override
            }], // Forced overrides
            runAt: "document_start",
            matchAboutBlank: true,
            allFrames: true
          }
          if (!uDark.userSettings.properBlackList.length) {
            delete contentScript.excludeMatches;
          }
          browser.contentScripts.register(contentScript).then(x => {
            uDark.regiteredCS = x
          });
        } else
          console.info("UD Did not load : ", "White list", uDark.userSettings.properWhiteList, "Enabled", !res.disable_webext)
      });
      browser.webRequest.handlerBehaviorChanged().then(x => console.info(`In-memory cache flushed`), error => console.error(`Error: ${error}`));
      browser.browsingData.removeCache({}).then(x => console.info(`Browser cache flushed`), error => console.error(`Error: ${error}`));

    },
    install: function() {
      

      function connected(connectedPort) {


        console.info("Connected", connectedPort.sender.url);
        if (connectedPort.name == "port-from-cs") {
          // At first, we used exclude_regex here to not register some content scripts, but thent we used it earlier, in the content script registration
          
          let portKey = `port-from-cs-${connectedPort.sender.tab.id}-${connectedPort.sender.frameId}`
          connectedPort.used_cache_keys = new Set();
          // console.log(portKey, connectedPort, uDark.connected_cs_ports[portKey])

          uDark.connected_cs_ports[portKey] = connectedPort;
          connectedPort.onDisconnect.addListener(p => {
            console.info("Disconnected:", p.sender.url, "Checking", p.used_cache_keys)
            if (p.used_cache_keys.size) { // We time it to avoid deleting the cache before the page is loaded (Like on link clicks)
              setTimeout(x => {
                let owned_cache_keys = new Set()
                Object.values(uDark.connected_cs_ports).forEach(x => x.used_cache_keys && x.used_cache_keys.forEach(y => owned_cache_keys.add(y)))

                p.used_cache_keys.forEach(x => {
                  if (!owned_cache_keys.has(x)) {
                    // console.log("Deleting", x)
                    delete uDark.idk_cache[x]
                  } else(console.log("Not deleting", x, "because it is still used by another port"))
                })
              }, 5 * 1000); // Allow 5 seconds for the new port to connect and own its cache keys
            }
            let portValue = uDark.connected_cs_ports[portKey]

            if (portValue != "ARRIVING_SOON") // A port should arrive soon, and we need this marker for ressources connected before it
            {
              delete uDark.connected_cs_ports[portKey] // Removing reference to the port, so it will be garbage collected
            }
          });
          connectedPort.onMessage.addListener(uDark.handleMessageFromCS);
        }
        if (connectedPort.name == "port-from-popup") {

          if (connectedPort.sender.tab) {
            // Knowing if my options are open or not, to change requests behaviour in these windows
            // Basicaly i want them to be able to frame any website
            // Popup does not have a tab, this may be how we could differenciate popup from options 
            uDark.connected_cs_ports[`port-from-popup-${connectedPort.sender.tab.id}`] = connectedPort;
            uDark.connected_options_ports_count++;
            connectedPort.onDisconnect.addListener(p => {
              delete uDark.connected_cs_ports[`port-from-popup-${p.sender.tab.id}`]
              uDark.connected_options_ports_count--;
            });
          }
          // uDark.userSettings = {...uDark.userSettings,...m.updateSettings}
          connectedPort.onMessage.addListener(function(m) {

            if (m.updateSettings) {
              browser.storage.local.set(m.updateSettings, dark_object.background.setListener);
            }
          });
        }
      }
      browser.runtime.onConnect.addListener(connected);
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
              for (key of Object.values(rule.style)) {


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

      window.uDark = {
        ...uDark,
        ...{
          is_background: true,
          rgb_a_colorsRegex: /rgba?\([%0-9., \/]+\)/gmi, // rgba vals without variables and calc()involved #! rgba(255 255 255 / 0.1) is valid color and rgba(255,255,255,30%) too
          hsl_a_colorsRegex: /hsla?\(([%0-9., \/=]|deg|turn|tetha)+\)/gmi, // hsla vals without variables and calc() involved
          headersdo: {
            "content-security-policy": (x => {
              x.value = x.value.replace(/script-src/, "script-src *")
              x.value = x.value.replace(/default-src/, "default-src *")
              x.value = x.value.replace(/style-src/, "style-src *")
              return false;
            }),
            "content-type": (x => {
              x.value = x.value.replace(/charset=[0-9A-Z-]+/i, "charset=utf-8")
              return true;
            }),
          },
          attfunc_map: {
            "fill": uDark.revert_rgba,
            "color": uDark.revert_rgba,
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
          edit_an_image: function(details) {
            var theUrl = new URL(details.url);
            details.isDataUrl = theUrl.hostname == "data-image.com"
            if (details.isDataUrl) {
              details.dataUrl = details.url.slice(34)
              details.isSvgDataUrl = details.dataUrl.startsWith("data:image/svg+xml;base64,")
            }
            if (theUrl.search.includes("ud-bypass_image") ||
              (theUrl.search = "" && theUrl.pathname == "/favicon.ico")) {
              return {}; // avoid simple favicons
            }

            var is_background = (uDark.background_match).test(theUrl.pathname + theUrl.search);
            is_background = is_background || details.url.includes("#ud-background")
            if (theUrl.pathname.endsWith(".gif") && !is_background && !theUrl.pathname.match(/logo|icon/i)) {
              return {}; // avoid animated gifs
            }
            var canvas = document.createElement('canvas');
            var myImage = new Image;


            if (theUrl.pathname.match(/\.svg$/) || details.isSvgDataUrl) {
              return new Promise((resolve, reject) => { // on my way to do a reaaal svg url parsing
                let svgSupport = function(text) {
                  var div = document.createElement("div");
                  div.innerHTML = text;
                  document.body.appendChild(div)
                  var svg = div.querySelector('svg')
                  if (!svg) { // Problem for later me
                    console.warn("No svg found in " + details.url, text)
                    return reject("No svg found in " + details.url, text);
                  }
                  var {
                    width,
                    height
                  } = svg.getBoundingClientRect();
                  if (!width || !height) {
                    var {
                      width,
                      height
                    } = svg.getBBox();
                  }
                  // console.log(svg.getBoundingClientRect(),svg.getBBox())

                  div.innerHTML = text.replace("<svg", `<svg width="${width}"  height="${height}" `);
                  svg = div.querySelector('svg')
                  var can = document.createElement("canvas")
                  var ctx = can.getContext('2d');
                  var sourceImage = new Image;
                  can.width = width;
                  can.height = height;

                  sourceImage.onload = function() {
                    //                               console.log(width,height);
                    ctx.drawImage(sourceImage, 0, 0, width, height);
                    div.remove()
                    // So far  svg'sare only used for logos
                    var islogo = uDark.edit_a_logo(ctx, width, height, details);
                    // console.log(details,can.toDataURL())
                    // img1.src = can.toDataURL();
                    resolve({
                      redirectUrl: islogo ? can.toDataURL() : details.dataUrl
                    });
                  };
                  myImage.onerror = x => {
                    resolve({})
                  }
                  setTimeout(x => resolve({}), 1000);

                  sourceImage.src = uDark.svgDataURL(svg)
                }

                details.isSvgDataUrl ?
                  svgSupport(atob(details.dataUrl.slice(26))) :
                  fetch(details.url).then(response => response.text()).then(svgSupport)

              })
            } else {
              return new Promise((resolve, reject) => {
                if (details.isDataUrl) {
                  myImage.src = details.dataUrl;
                } else {
                  myImage.src = details.url;
                }

                var normalresolve = x => {

                  // Very small data:images are often used as backgrounds
                  is_background = is_background || details.isDataUrl && (5 - myImage.width < 0 || 5 - myImage.width < 0)


                  canvas.width = myImage.width;
                  canvas.height = myImage.height;
                  var context = canvas.getContext('2d');
                  context.drawImage(myImage, 0, 0);

                  // is_background=is_background&&!((/(logo|icon)/i).test(theUrl.pathname+theUrl.search))

                  var islogo = !is_background && uDark.edit_a_logo(context, myImage.width, myImage.height, details);
                  /*&& !theUrl.pathname.endsWith(".jpg") // some websites renames png files in jpg */

                  //   console.log(theUrl,is_background,islogo,theUrl.search.startsWith("?data-image="))


                  if (islogo) {
                    resolve({
                      redirectUrl: canvas.toDataURL()
                    });
                  } else if (is_background) {
                    if (details.url.includes("#ud-background-magic")) {
                      uDark.magic_a_background(context, myImage.width, myImage.height, 0xff)
                    } else {
                      uDark.edit_a_background(context, myImage.width, myImage.height, 0xff)

                    }
                    // console.log(details, theUrl, canvas);
                    resolve({
                      redirectUrl: canvas.toDataURL()
                    });
                  } else if (details.isDataUrl) {
                    resolve({
                      redirectUrl: myImage.src
                    });
                  } else {
                    resolve({});
                  }
                }
                myImage.onload = normalresolve;
                myImage.onerror = x => {
                  resolve({})
                }
                setTimeout(x => resolve({}), 1000);
              })
            }
          },
          edit_a_logo: function(canvasContext, width, height, details) { // must found a better saturation, less brighness calc
            if (width * height < 50 || width < 5 || height < 5) { // small images can't be logos or affect the page
              // console.log(`${details.url} is too small: ${width} width, ${height} height `)
              return false;
            }
            // console.log(width,height,details)
            let theImageData = canvasContext.getImageData(0, 0, width, height),
              theImageDataBufferTMP = new ArrayBuffer(theImageData.data.length),
              theImageDataClamped8TMP = new Uint8ClampedArray(theImageDataBufferTMP),
              theImageDataUint32TMP = new Uint32Array(theImageDataBufferTMP),
              n = theImageDataUint32TMP.length;
            theImageDataClamped8TMP.set(theImageData.data);
            //    console.log(details,"willresolve")
            var cornerpixs = [
              0, // 1 top right pixel
              parseInt(width / 2), // 2 midle top pixel
              width - 1, // 3 top right pixel
              width * parseInt(height / 2) - (width - 1), // 4
              width * parseInt(height / 2), // 5
              n - width, // 6
              n - parseInt(width / 2), // 7
              n - 1
            ] // 8
            // console.log(cornerpixs.map(x=>theImageDataUint32TMP[x]));
            // cornerpixs = cornerpixs.map(x => theImageDataUint32TMP[x] <= 0x00ffffff) // superior to 0x00ffffff is not fully alpha
            cornerpixs = cornerpixs.map(x => theImageDataUint32TMP[x] < 0xff000000) // inferior to 0xff000000 is at least a bit transparent
            // console.log(cornerpixs)
            var pixelcount1 = cornerpixs.slice(0, 4).reduce((a, b) => a + b)
            var pixelcount2 = cornerpixs.slice(4).reduce((a, b) => a + b)
            // console.log(pixelcount)


            //  console.log(details.url,pixelcount1,pixelcount1)
            if (!pixelcount1 || !pixelcount2) {

              // console.log(details.url,"is not a logo : not enough trasnparent pixels",cornerpixs,theImageData)
              return false;
            }

            var samplepixels = theImageDataUint32TMP;
            if (uDark.sample_mode_active == false) {
              //          var sampler = 40
              //        var samplepixelscount = Math.round(n/sampler); 
              //      samplepixels = Array.from({length: samplepixelscount}, (x, i) => i*sampler).map(x=>theImageDataUint32TMP[x])
              // #was used for globalcol#.map(number=>[number & 0xff,(number >> 8) & 0xff,(number >> 16) & 0xff])
            }
            let unique = [...new Set(samplepixels)];
            // var maxcol = Math.max(...[].concat(...samplepixels));
            // var delta= 255-maxcol // 255 is the future logo brightness inversion; can be configurable
            //   console.log(unique);
            // console.log(details.url,maxcol,n,samplepixels,unique.length)
            //  console.log(details.url, unique,unique.length);
            // console.log(width, height, details.url, "alphapix:", pixelcount, "unique", unique, "fullset", theImageDataUint32TMP, "sampleset", samplepixels, theImageData, canvasContext)
            // console.log(details.url, unique.length);
            if (unique.length > 700 + details.url.match(/logo|icon/) * 700 /*|| unique.length == 256 */
              /*|| unique.indexOf(0) == -1*/ // already tested before
            ) {
              return false;
            }
            var delta2 = unique.includes(0xffffffff) && unique.includes(0xff000000) ? 135 : 0 // care with pow
            // one last time : 00 is the opacity level : 0xff means full opacity, 0x00 means full transparency
            imgDataLoop: while (n--) {
              var number = theImageDataUint32TMP[n];
              var r = number & 0xff;
              var g = (number >> 8) & 0xff;
              var b = (number >> 16) & 0xff;
              var a = (number >> 24) & 0xff;
              {
                // Standard way 2023
                [r, g, b, a] = uDark.revert_rgba(r, g, b, a, (...args) => args);
              }
              //     {
              //       /*if((r+g+b)/3>500)
              //     {
              //       continue imgDataLoop;
              //     }*/
              //     var maxcol = Math.max(r, g, b) // Local max col
              //     var delta = 255 - maxcol // 255 is the future logo brightness; can be configurable
              //     if (delta2 && a && (r + g + b) < 1) {
              //       delta -= delta2; // Experimental : if pic has black and white do not set black entirely white

              //     }

              //   r = Math.min(Math.pow(r + delta,1.05),255);
              //   g = Math.min(Math.pow(g + delta,1.05),255);
              //   b = Math.min(Math.pow(b + delta,1.05),255); // experimental power up whites in logos; but how much ?

              //  /*   r = r + delta;
              //     g = g + delta;
              //     b = b + delta;*/
              //     }
              var newColor = ((a << 24)) | (b << 16) | (g << 8) | r;
              theImageDataUint32TMP[n] = newColor;
            }
            theImageData.data.set(theImageDataClamped8TMP);
            canvasContext.putImageData(theImageData, 0, 0);
            return true;
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
            theImageDataBufferTMP = new ArrayBuffer(theImageData.data.length),
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
          edit_a_background: function(canvasContext, width, height, max_a = 1) {
            // where all the magic happens
            let theImageData = canvasContext.getImageData(0, 0, width, height),
              theImageDataBufferTMP = new ArrayBuffer(theImageData.data.length),
              theImageDataClamped8TMP = new Uint8ClampedArray(theImageDataBufferTMP),
              theImageDataUint32TMP = new Uint32Array(theImageDataBufferTMP),
              n = theImageDataUint32TMP.length;
            theImageDataClamped8TMP.set(theImageData.data);
            let date_start = (new Date()) / 1
            imgDataLoop: while (n--) {
              var number = theImageDataUint32TMP[n];
              var r = number & 0xff;
              var g = (number >> 8) & 0xff;
              var b = (number >> 16) & 0xff;
              var a = (number >> 24) & max_a;
              { // Standard way 2023
                [r, g, b, a] = uDark.rgba(r, g, b, a, (...args) => args);
              }
              // {

              //     if ((r+b+g)/3<150)
              //     continue imgDataLoop; // does not work with gradients
              // }
              // {
              //   var oa = a;

              //   var rgbarr = [r,g,b].map(x => uDark.max_bright_bg *(x/uDark.max(r,g,b)));
              //   r=uDark.max( r-100,0)// rgbarr[0];
              //   g=uDark.max( g-100,0)// rgbarr[1];
              //   b=uDark.max( b-100,0)// rgbarr[2];
              //   r=rgbarr[0];
              //   g=rgbarr[1];
              //   b=rgbarr[2];
              //   a=Math.abs(uDark.max(r,g,b)-255);
              // }
              // {
              //   var oa = a;

              //     a=uDark.min(a,(r+g+b)/-3+255); // linear
              //    a = Math.min(a, Math.pow((r + g + b) / -3 + 255, 1.25)); // pow, solves gradients & keeps colors; 0 means full dark;
              //   // cant fully alpha : if text is on white(to alpha) div and div on an image, text will be hard to read
              //   if (a < 1) {
              //     r = g = b = uDark.min_bright_bg_trigger;
              //     a = oa;
              //     // r=g=b=0;
              //   }
              // }
              var newColor = ((a << 24)) | (b << 16) | (g << 8) | r;
              theImageDataUint32TMP[n] = newColor;
            }
            theImageData.data.set(theImageDataClamped8TMP);
            canvasContext.putImageData(theImageData, 0, 0);

            console.log("BG Edited in", (new Date()) / 1 - date_start, "ms")
          },
          handleMessageFromCS: function(message, sender) {
            message.resolvedIDKVars && uDark.resolvedIDKVars_action(message.resolvedIDKVars, sender);
          },
          resolvedIDKVars_action: function(data) {
            // console.log("resolvedIDKVars_action", data.chunk.includes("darken"))
            uDark.idk_cache[data.chunk_hash] = data.chunk;




            // // Missing chunks strategy :
            // let missingChunksKey="missing_chunks_"+data.details.requestId;
            // if(missingChunksKey in uDark.idk_cache){
            //   let missing_chunk_key_set=uDark.idk_cache[missingChunksKey];
            //   missing_chunk_key_set.delete(data.chunk_hash);
            //   let filter_items=uDark.idk_cache["filter_"+missingChunksKey];
            //   filter_items.filter.write(filter_items.encoder.encode( data.chunk));
            //   // console.log("Received chunk",data.chunk_hash,missing_chunk_key_set.size,"remaining")
            //   if(missing_chunk_key_set.size==0){
            //     delete uDark.idk_cache[missingChunksKey];
            //     filter_items.filter.disconnect();
            //     delete uDark.idk_cache["filter_"+missingChunksKey];
            //   }
            // }
            // // end of missing chunks strategy




          },
          parse_and_edit_html3: function(str, details) {
            details.requestScripts = details.requestScripts || []
            if (uDark.debugFirstLoad = false) {
              str = str.replace(/(<script ?.*?>)((.|\n)*?)(<\/script>)/g, (match, g1, g2, g3, g4) => {
                var securedScript = {
                  "id": ["--ud-SecuredScript-", details.requestScripts.length, "_-"].join(""),
                  "content": match
                }
                details.requestScripts.push(securedScript);
                return securedScript.id;
              });

            }
            str = str.replace(/<(\/)?noscript/g, "<$1ud_secure_a_noscript");
            // var documentElement = document.createElement("html")
            // documentElement.innerHTML=str.replace(/<\/?html.*?>/g,"")
            var parser = new DOMParser();
            let aDocument = parser.parseFromString(
              str, "text/html");
            let documentElement = aDocument.documentElement;

            // The code
            //              console.log(documentElement)

            // documentElement.querySelectorAll("noscript").forEach(anoscript=>{ // This is too late to edit noscript as as thei are aleready parsed
            //    anoscript.remove();
            // });

            aDocument.querySelectorAll("style").forEach(astyle => {
              carried = {};
              astyle.innerHTML = uDark.edit_str(astyle.innerHTML, false, false, details,false,carried);
              // According to https://stackoverflow.com/questions/55895361/how-do-i-change-the-innerhtml-of-a-global-style-element-with-cssrule ,
              // it is not possible to edit a style element innerHTML with its cssStyleSheet alone
              // As long as we are returing a STR, we have to edit the style element innerHTML;
              // astyle.innerHTML=uDark.edit_css(astyle.innerHTML,astyle.sheet);
              if(carried.has_idk_vars)
              {
                astyle.classList.add("ud-idk-vars");
              }
              astyle.classList.add("ud-edited-background")
            });
            aDocument.querySelectorAll("[style]").forEach(astyle => {
              // console.log(details,astyle,astyle.innerHTML,astyle.innerHTML.includes(`button,[type="reset"],[type="button"],button:hover,[type="button"],[type="submit"],button:active:hover,[type="button"],[type="submi`))
              astyle.setAttribute("style", uDark.edit_str(astyle.getAttribute("style"), false, false, details));
            });

            //EXPERIMENTAL
            aDocument.querySelectorAll("meta").forEach(m => {
              if (m.httpEquiv.toLowerCase().trim() == "content-type" && m.content.includes("charset")) {
                m.content = "text/html; charset=utf-8"
              }
            })
            aDocument.querySelectorAll("img[src*='data']").forEach(image => {
              image.src = uDark.send_data_image_to_parser(image.getAttribute("src"), details)
            })

            // aDocument.querySelectorAll("img[src]").forEach(image => { // We catch images later, not here
            //   uDark.registerBackgroundItem(false,{selectorText:`img[src='${image.src}']`}, details)
            // })
            // I think killing cache this way may be more efficient than cleaning the cache
            // cache key is unique for each browser session
            // aDocument.querySelectorAll("link[rel='stylesheet'][href]")//This was causing problems i dont knwo why : double loading of css on openAi, and not so usefull since UD flushes cache on options change
            //   .forEach(x => {
            //     let hasHref = x.getAttribute("href").trim(); 
            //     console.log("link", hasHref)
            //     hasHref && x.setAttribute("href", hasHref + "ud_ck=1" + uDark.fixedRandom);
            //   });
            // /

            aDocument.querySelectorAll("[fill],[color],path,[bgcolor]").forEach(coloreditem => {
              for (const [key, afunction] of Object.entries(uDark.attfunc_map)) {
                var possiblecolor = uDark.is_color(coloreditem.getAttribute(key))
                if (possiblecolor) {
                  coloreditem.setAttribute(key, afunction(...possiblecolor, uDark.hex_val))
                }
              }
            })
            if (details.datacount == 1) {

              var udStyle = document.createElement("style")
              udStyle.innerHTML = uDark.inject_css_suggested;
              udStyle.id = "ud-style"
              aDocument.head.prepend(udStyle);

              var udMetaDark = aDocument.querySelector("meta[name='color-scheme']") || document.createElement("meta")
              udMetaDark.id = "ud-meta-dark"
              udMetaDark.name = "color-scheme";
              udMetaDark.content = "dark";
              aDocument.head.prepend(udMetaDark);

            }
            // <meta name="color-scheme" content="dark light"> Telling broswer order preference for colors 
            // Makes input type checkboxes and radio buttons to be darkened

            var outer_edited = "<!doctype html>" + documentElement.outerHTML
            outer_edited = outer_edited.replace(/[\s\t]integrity=/g, " nointegrity=")
            outer_edited = outer_edited.replaceAll("ud_secure_a_noscript", "noscript")


            return outer_edited;
          }
        }
      }
      Promise.all([
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
        getInjectCSS("/inject_css_suggested.css", actions = {
          append: {
            inject_css_suggested: uDark,
            edit_css: true
          }
        }),
        getInjectCSS("/inject_css_suggested_no_edit.css", actions = {
          append: {
            inject_css_suggested: uDark
          }
        }),
        getInjectCSS("/inject_css_override.css", actions = {
          append: {
            inject_css_override: uDark
          },
          edit_css: true
        }),
        getInjectCSS("/inject_css_override_no_edit.css", actions = {
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
          on_idk_missing: "fill_minimum",
          idk_minimum_editor: 0.2,
          connected_cs_ports: {},
          connected_options_ports_count: 0,
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
          RGBRotate:class {
            constructor() {
              this.matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
            }
          
            setHueRotation(degrees) {
              const cosA = Math.cos((degrees * Math.PI) / 180);
              const sinA = Math.sin((degrees * Math.PI) / 180);
          
              this.matrix[0][0] = cosA + (1.0 - cosA) / 3.0;
              this.matrix[0][1] = (1.0 / 3.0) * (1.0 - cosA) - Math.sqrt(1.0 / 3.0) * sinA;
              this.matrix[0][2] = (1.0 / 3.0) * (1.0 - cosA) + Math.sqrt(1.0 / 3.0) * sinA;
              this.matrix[1][0] = (1.0 / 3.0) * (1.0 - cosA) + Math.sqrt(1.0 / 3.0) * sinA;
              this.matrix[1][1] = cosA + (1.0 / 3.0) * (1.0 - cosA);
              this.matrix[1][2] = (1.0 / 3.0) * (1.0 - cosA) - Math.sqrt(1.0 / 3.0) * sinA;
              this.matrix[2][0] = (1.0 / 3.0) * (1.0 - cosA) - Math.sqrt(1.0 / 3.0) * sinA;
              this.matrix[2][1] = (1.0 / 3.0) * (1.0 - cosA) + Math.sqrt(1.0 / 3.0) * sinA;
              this.matrix[2][2] = cosA + (1.0 / 3.0) * (1.0 - cosA);
            }
          
            apply(r, g, b) {
              const rx = r * this.matrix[0][0] + g * this.matrix[0][1] + b * this.matrix[0][2];
              const gx = r * this.matrix[1][0] + g * this.matrix[1][1] + b * this.matrix[1][2];
              const bx = r * this.matrix[2][0] + g * this.matrix[2][1] + b * this.matrix[2][2];
          
              const clamp = (v) => {
                if (v < 0) {
                  return 0;
                }
                if (v > 255) {
                  return 255;
                }
                return Math.round(v);
              };
          
              return [clamp(rx), clamp(gx), clamp(bx)];
            }
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
            let bgColorItem = [...document.querySelectorAll("[style*=background],[class]")]
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
              let boundingRect = getBoundingClientRect = textItem.getBoundingClientRect();
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

            if (uDark.is_content_script) {
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
          get_the_remote_port(details, max_tries = 5, time_between_tries = 100) { // Ports can take a lot of time to be available
            return new Promise((resolve, reject) => {

              let content_script_port = uDark.connected_cs_ports[`port-from-cs-${details.tabId}-${details.frameId}`];
              if (content_script_port && content_script_port != "ARRIVING_SOON") {
                if (max_tries != 5) {
                  console.log("Port found after", 5 - max_tries, "tries of", time_between_tries, "ms");
                }
                resolve(content_script_port);
              }
              if (max_tries == 0) {
                reject("Max tries reached");
              }
              if (content_script_port == "ARRIVING_SOON") {
                setTimeout(() => {
                  resolve(uDark.get_the_remote_port(details, max_tries - 1, time_between_tries));
                }, time_between_tries);
              }
            });
          },
        }
      }

      // Shared funtion prototype editors :

      //This allows to use the same code for foreground and background : setProperty : No costly need to check if it is a background or foreground
      // uDark.functionPrototypeEditor(CSSStyleDeclaration, CSSStyleDeclaration.prototype.setProperty, (elem, args) => {
      //   return args
      // },(elem,args)=>{
      //   if(`o_ud_${args[0]}` in elem) // If the property is edited by uDark, we let uDark handle it
      //   {
      //     elem[args[0]]=args[1]; // Benefits the intended change
      //     elem.setProperty(args[0],elem.getPropertyValue(args[0]),args[2]/*Adds important flag if specified*/); 
      //     return false; // No need for further processing
      //   }
      //   return true; // Continue processing,  see you in aftermath


      // }, (result, elem, args, watcher_result) => {
      //   // Any thing could have been done to this poor little CSSStyleDeclaration, we are here aftermath, lets run a full check on it.
      //   // We don't even know if it has a CSSRule or not, let try to emulate this.
      //   if(elem.parentRule)
      //   {
      //     // console.log("Go go 1",elem,elem.parentRule)
      //     // return uDark.edit_cssProperties(elem.parentRule,false);
      //   }
      //   //   else if(!elem.parentRule)
      //   //   {
      //   //     console.log("Go go 2")
      //   //     return uDark.edit_cssProperties({
      //   //       "selectorText":"EmulatedRule",
      //   //       "style":elem
      //   //     },false);

      //   // }
      // })
      /// end of shared funtion prototype editors

    }
  },
  misc: {
    editBeforeRequestImage: function(details) {


      // Util 2024 jan 02 we were checking details.documentUrl, or details.url to know if a stylesheet was loaded in a excluded page
      // Since only CS ports that matches blaclist and whitelist are connected, we can simply check if this resource has a corresponding CS port
      if (!uDark.connected_cs_ports["port-from-cs-" + details.tabId + "-" + details.frameId]) {
        // console.log("Image","No port found for",details.url,"loaded by webpage:",details.originUrl,"Assuming it is not an eligible webpage, or even blocked by another extension");
        return {}
      }
      //   if (details.originUrl && (details.originUrl.startsWith("moz-extension://")) ||
      //   (details.documentUrl || details.url).match(uDark.userSettings.exclude_regex)) {
      //   return {}
      // }
      
      if (details.url.startsWith("https://data-image.com/?base64IMG=")) {
        // console.log(details.url,"catched",details.url.slice(34));
        return {
          redirectUrl: details.url.slice(34)
        }
      }
      // PROOF OF CONCEPT EDITING IMAGES BUFFERS WIHOUT FETCHING THEM IS POSSIBLE
      if (details.url && (use2024Experimentalway = false)) {
        let filter = browser.webRequest.filterResponseData(details.requestId); // After this instruction, browser espect us to write data to the filter and close it
        details.buffers = details.buffers || [];
        filter.ondata = event => {
          details.buffers.push(event.data);
        }

        filter.onstop = event => {
          console.log("Image", "Filter stopped	", details.buffers.length);

          let blob = (new Blob(details.buffers));
          blob.arrayBuffer().then((buffer) => {
            {

              // Create an Image object
              const img = new Image();

              // Set the source of the Image to the blob URL
              img.src = URL.createObjectURL(blob);

              // Wait for the image to load
              img.onload = function() {
                // Create a canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Set the canvas size to the image size
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw the image onto the canvas
                ctx.drawImage(img, 0, 0);

                // Get the ImageData from the canvas
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Now you can work with the imageData object
                console.log(imageData, img.src);

                // The imageData object has a data property, a Uint8ClampedArray containing the color values of each pixel in the image.
                // It is easier to work with this array as 32-bit integers, so we create a new Uint32Array from the original one.



                let theImageDataBufferTMP = new ArrayBuffer(imageData.data.length);
                let theImageDataClamped8TMP = new Uint8ClampedArray(theImageDataBufferTMP);
                theImageDataClamped8TMP.set(imageData.data);
                let theImageDataUint32TMP = new Uint32Array(theImageDataBufferTMP) // Id prefet o use imageData bu idont uderstand yet why in can't
                // let theImageDataUint32TMP = new Uint32Array(imageData.data);

                let n = theImageDataUint32TMP.length;
                start_date = new Date();

                console.log("Image", "Starting edition", new Date() / 1 - start_date / 1);
                imgDataLoop: while (n--) {
                  var number = theImageDataUint32TMP[n];
                  var r = number & 0xff;
                  var g = (number >> 8) & 0xff;
                  var b = (number >> 16) & 0xff;
                  var a = (number >> 24) & 0xff;
                  {
                    // Standard way 2023 // very very very slow (1.5s for a 500 x 500 img)

                    // 2024 way : Go faster by finding the right caclulation for each pixel
                    // [r, g, b, a] = uDark.revert_rgba(r, g, b, a, (...args) => args);
                    if (uDark.RGBToLightness(r, g, b) > 128) {
                      // [r,g,b]=[r,g,b].map((x)=>x/2);
                      a = 0;
                    }
                  }
                  var newColor = ((a << 24)) | (b << 16) | (g << 8) | r;
                  theImageDataUint32TMP[n] = newColor;
                }
                console.log("Image", "Image edited in", new Date() / 1 - start_date / 1);
                imageData.data.set(theImageDataClamped8TMP);
                ctx.putImageData(imageData, 0, 0);


                canvas.toBlob((editedBlobWithImageHeaders) => {
                  // console
                  // filter.write(theImageDataUint32TMP.buffer);
                  console.log(editedBlobWithImageHeaders);
                  editedBlobWithImageHeaders.arrayBuffer().then((buffer) => {
                    filter.write(buffer);
                    console.log("Image", "Image written in filter", new Date() / 1 - start_date / 1);
                    filter.disconnect();

                  });
                })
                // filter.write(theImageDataUint32TMP.buffer);
                // filter.write(details.buffers[0]);
                // filter.disconnect();
              };



            };
          });
        }
        return {}
      }
      // END OF PROOF OF CONCEPT EDITING IMAGES BUFFERS WIHOUT FETCHING THEM IS POSSIBLE

      ////////////////////////
      // Here we catch any image, including data:images <3 ( in the form of data-image.com)
      let resultEdit = {}
      // console.log("Image",uDark.userSettings.disable_image_edition,!(uDark.userSettings.disable_image_edition))
      if (!(uDark.userSettings.disable_image_edition)) {
        resultEdit = uDark.edit_an_image(details);
      }
      // If resultEdit is a promise, image will be edited (foreground or background), otherwise it may be a big background image to include under text
      // Lets inform the content script about it
      if (!resultEdit.then) {
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

      let carried = {};
      carried.isCorsRequest = dark_object.misc.isCorsRequest(details);
      // let stylesheetURL=(new URL(details.url));


      console.log("Loading CSS", details.url)


      // Util 2024 jan 02 we were checking details.documentUrl, or details.url to know if a stylesheet was loaded in a excluded page
      // Since only CS ports that matches blaclist and whitelist are connected, we can simply check if this resource has a corresponding CS port
      if (!uDark.connected_cs_ports["port-from-cs-" + details.tabId + "-" + details.frameId]) {
        // NOTE: It is safe to NOT use the promise here, thanks to the ARRIVING_SOON system 
        console.log("CSS", "No port found for", details.url, "loaded by webpage:", details.originUrl, "Assuming it is not an eligible webpage, or even blocked by another extension");
        console.log("If i'm lacking of knowledge, khere is what i know about this request", details.tabId, details.frameId);
        return {}
      }

      let filter = browser.webRequest.filterResponseData(details.requestId); // After this instruction, browser espect us to write data to the filter and close it
      let decoder = new TextDecoder()
      let encoder = new TextEncoder();
      details.datacount = 0;
      details.rejectedValues = "";
      filter.ondata = event => {

        details.datacount++
        var str = decoder.decode(event.data, {
          stream: true
        }); //str,cssStyleSheet,verifyIntegrity=false,details
        let carried = {};
        carried.chunk = uDark.edit_str(details.rejectedValues + str, false, true, details, false, carried);
        if (carried.chunk.message) {
          // console.log(details,transformResult.message)
          details.rejectedValues += str;

          // console.info(transformResult.message,details.url,details.rejectedValues.length);
        } else {

          details.rejectedValues = "";
          // console.log(details,"Accepted integrity rule")
          if (carried.chunk.rejected) {
            // console.log("Accepted a partial integrity_rule ♥",details.url)
            details.rejectedValues = carried.chunk.rejected;
            carried.chunk = carried.chunk.str;
          }

          dark_object.misc.chunk_manage_idk(details, carried);
          filter.write(encoder.encode(carried.chunk));
          // console.log("Accepted integrity_rule",details.url,transformResult)
        }
      }
      filter.onstop = event => {

        if (details.rejectedValues.length) {

          carried.chunk = uDark.edit_str(details.rejectedValues, false, false, details, false, carried);
          dark_object.misc.chunk_manage_idk(details, carried.chunk);
          filter.write(encoder.encode(carried.chunk)); // Write the last chunk if any, trying to get the last rules to be applied, there is proaby invalid content at the end of the CSS;
        }

        // let missingChunksKey="missing_chunks_"+details.requestId;
        // if(missingChunksKey in uDark.idk_cache)
        // {
        //   /* Missing chunck strategy*/
        //   console.log("Missing chunks",uDark.idk_cache[missingChunksKey].size)
        //   let missing_chunk_key_set = uDark.idk_cache[missingChunksKey]
        //   uDark.idk_cache["filter_"+missingChunksKey]={filter,encoder};
        //   setTimeout(()=>{
        //     if(missing_chunk_key_set.size)
        //     {
        //       console.log("Missing chunks",missing_chunk_key_set.size,"for",details.url,"after",uDark.resolvedIDKVars_action_timeout,"ms")
        //     }
        //     missing_chunk_key_set.forEach((chunk_hash)=>{
        //       uDark.resolvedIDKVars_action({chunk_hash,details,chunk:""})
        //     })
        //   },  uDark.resolvedIDKVars_action_timeout*2000);
        //   /* End of missing chunck strategy*/
        // }
        // else{
        filter.disconnect(); // Low perf if not disconnected !
        // }
      }

      // return {redirectUrl:details.url};
      // return {responseHeaders:[{name:"Vary",value:"*"},{name:"Location",value:details.url}]};
      return {};
      // must not return this closes filter//
    },
    isCorsRequest: (details) => {
      let aUrl = new URL(details.url);
      let bUrl = new URL(details.documentUrl);
      details.origin = aUrl.origin;
      details.doc_origin = bUrl.origin;
      details.hostname = aUrl.hostname;
      details.doc_hostname = bUrl.hostname;
      return (aUrl.origin != bUrl.origin)
    },
    chunk_manage_idk: function(details, carried) {


      if (!uDark.disable_remote_idk_css_edit && details.unresolvableChunks) {
        if (!carried.unresolvableStylesheet.cssRules.length) {
          // console.log("No unresolvable rules found for",details.url,"chunk",details.datacount)
          return;
        }

        if (carried.isCorsRequest && uDark.chunk_stylesheets_idk_only_cors) {

          // console.log("Skipping chunk as it is not a CORS one", details.url)
          return;

        }
        let chunk_hash = fMurmurHash3Hash(carried.chunk);
        if (chunk_hash in uDark.idk_cache) {
          console.log("Skipping chunk as it is already in cache", details.url)
          carried.chunk = uDark.idk_cache[chunk_hash];
          return;
        }
        let content_script_port_promise = uDark.get_the_remote_port(details); // Sometimes here the port havent connected yet. In fact content_script_ports are slow to connect.
        let rules = [...carried.unresolvableStylesheet.cssRules].map(r => r.cssText);
        let chunk_variables = rules.join("\n");

        let readable_variable_checker = `\n:root{--chunk_is_readable_${details.requestId}_${details.datacount}:0.55;}`;
        carried.chunk += readable_variable_checker;

        if (!details.rejectCache) {
          details.rejectCache = true;
          // console.log("Setting: Rejecting cache for",details.url,details.doc_hostname); // Works only with doc_hostname, not hostname
          uDark.idk_cache["remove_cache_" + details.requestId] = details.doc_hostname; // Works only with doc_hostname, not hostname; this is counter intuitive
        }


        // /* Missing chucks strategy */
        // let missingChunksKey="missing_chunks_"+details.requestId;
        // if(!(missingChunksKey in uDark.idk_cache))
        // {
        //   uDark.idk_cache[missingChunksKey]=new Set();
        // }
        // uDark.idk_cache[missingChunksKey].add(chunk_hash);
        // /* End of missing chucks strategy */



        content_script_port_promise.then((content_script_port) => {


          content_script_port.used_cache_keys.add(chunk_hash);


          content_script_port.postMessage({
            havingIDKVars: {
              details,
              chunk: carried.chunk,
              chunk_variables: chunk_variables,
              chunk_hash,
            }
          });


        })

      }
    },
    onCompletedStylesheet: function(details) {

      // Remove cache for the css resource if it was rejected by chunk_manage_idk, the next time we see it we'll have to replace its chunks
      let possibleCacheKey = "remove_cache_" + details.requestId;
      if (possibleCacheKey in uDark.idk_cache) {
        setTimeout(w => {
          // console.log("Removing cache for", details.url);
          browser.browsingData.removeCache({
              since: (Date.now() - details.timeStamp),
              hostnames: [uDark.idk_cache[possibleCacheKey]]
            })
            .then(x => {
              console.info(`Browser cache flushed`)
              delete uDark.idk_cache[possibleCacheKey];
            }, error => console.error(`Error: ${error}`));
        }, 100) // Must wait the request is finished, otherwise it will not be uncached
      }



    },

    // editHeadersOnHeadersReceived: function(details) {
    //   console.log("Headers received", details.url)

    //   return details;
    // },
    editBeforeData: function(details) {
      console.log("Loaded html", details.url)
      if (details.tabId == -1 && uDark.connected_options_ports_count || uDark.connected_cs_ports["port-from-popup-" + details.tabId]) { // ^-1 Happens sometimes, like on https://www.youtube.com/ at the time i write this, stackoverflow talks about worker threads

        // Here we are covering the needs of the option page: Be able to frame any page
        let removeHeaders = ["content-security-policy", "x-frame-options", "content-security-policy-report-only"]
        details.responseHeaders = details.responseHeaders.filter(x => !removeHeaders.includes(x.name.toLowerCase()))
      }

      // Here we have to check the url or the documentUrl to know if this webpage is excluded
      // It already has passed the whitelist check, this is why we only check the blacklist
      // However this request happens before the content script is connected, so we can't check if it will connect or not
      // Even if we could do this, like sending some bytes and waiting for he content script to connect,
      // and it would be not so musch costyl in terms of time, some pages as YOurunbe as the time i write this, somehow manages
      // to send in this very first request tabID -1 and frameID 0, which is not a valid combination, and the content script will never be found
      // stackoverflow says it might be related to worker threads. I explored details in the search of somethign that could be used to detect this, but i found nothing
      if (
        //details.originUrl && details.originUrl.startsWith("moz-extension://") ||
        (details.documentUrl || details.url).match(uDark.userSettings.exclude_regex)) {
        // console.log("Excluding", details.url,"made by",details.documentUrl)

        delete uDark.connected_cs_ports["port-from-cs-" + details.tabId + "-" + details.frameId];
        // As bellow is marking as arriving soon
        // it will not be deleted. It is almost impossible, but still possible to have a page that starts loading, we mark it as arriving soon
        // loading stops, for whatever reason, and the content script does not connect
        // In this case, the port will not be erased, and all resources will darkened, even if the page is not eligible for uDark
        // It is testable by disablising the content script, assignation and line above; loading a darkened page, in a tab, to set the arriving soon flag, 
        // then loading an uneligible page in the same tab, and see if it not dakening.
        return {
          responseHeaders: details.responseHeaders
        }
      }
      if (details.tabId != -1) {
        // Lets be the MVP here, sometimes the content script is not connected yet, and the CSS will arrive in few milliseconds.
        // This page is eligible for uDark
        // console.log("I'm telling the world that",details.url,"is eligible for uDark", "on", details.tabId,details.frameId)
        uDark.connected_cs_ports["port-from-cs-" + details.tabId + "-" + details.frameId] = "ARRIVING_SOON";

      }

      var n = details.responseHeaders.length;
      details.headersLow = {}
      while (n--) {
        details.headersLow[details.responseHeaders[n].name.toLowerCase()] = details.responseHeaders[n].value;
      }
      if (!(details.headersLow["content-type"] || "text/html").includes("text/html")) return {}
      details.charset = ((details.headersLow["content-type"] || "").match(/charset=([0-9A-Z-]+)/i) || ["", "utf-8"])[1]
      // console.log(details.charset)
      
      details.responseHeaders = details.responseHeaders.filter(x => {
        var a_filter = uDark.headersdo[x.name.toLowerCase()];
        return a_filter ? a_filter(x) : true;
      })
      let filter = browser.webRequest.filterResponseData(details.requestId);
      let decoder = new TextDecoder(details.charset)
      let encoder = new TextEncoder();
      details.datacount = 0;
      details.writeEnd = "";

      filter.ondata = event => {
        details.datacount++
        details.writeEnd += decoder.decode(event.data, {
          stream: true
        });
        // must not return this closes filter//
      }
      filter.onstop = event => {
        details.datacount = 1;
        details.writeEnd = uDark.parse_and_edit_html3(details.writeEnd, details)
        filter.write(encoder.encode(details.writeEnd));
        filter.disconnect(); // Low perf if not disconnected !
      }
      return {
        responseHeaders: details.responseHeaders
      }
    }
  }
}
dark_object.all_levels.install();
dark_object.both.install()

if (browser.webRequest) {
  dark_object.background.install();
} else {
  dark_object.content_script.install();
  if(!uDark.direct_window_export)
  {
    dark_object.content_script.override_website();
  }
  dark_object.content_script.website_load();
  
}