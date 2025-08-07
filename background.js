// Listen for keyboard shortcut commands (e.g., Ctrl+Shift+U)
if (typeof browser !== 'undefined' && browser.commands && browser.commands.onCommand) {
    browser.commands.onCommand.addListener(async function(command) {
        if (command === 'toggle-site') {
            // Get the active tab
            let tabs = await browser.tabs.query({active: true, currentWindow: true});
            let tab = tabs[0];
            if (!tab || !tab.url) return;
            // Send a message to the popup or content script to toggle exclusion for this site
            // We'll use storage as a trigger for the popup logic
            let url = tab.url;
            // Use a custom event in storage to trigger popup logic
            await browser.storage.local.set({__udark_toggle_site: {url, time: Date.now()}});
            // Optionally, open the popup if not already open
            if (browser.browserAction && browser.browserAction.openPopup) {
                try { await browser.browserAction.openPopup(); } catch (e) {}
            }
        }
    });
}
class Common {
  static appCompat(res) {
    
    if (uDark.browserInfo.version < 105 && uDark.browserInfo.name == "Firefox") {
      res.disable_image_edition = true;
      console.warn("UltimaDark", "Image edition is disabled on Firefox versions below 105, as it is not supported");
      globalThis.browser.storage.local.set(res);
    }
  }
  static install() {
    
  }
};
class uDarkC extends uDarkExtended {
  exportFunction= f => f; // Emulate the exportFunction function of the content script to avoid many ternary operators
  logPrefix = "UltimaDark:";
  log(...args) {
    console.log("%c"+this.logPrefix,  "color:white;font-weight:bolder",...args);
  };
  warn(...args) {
    console.warn("%c"+this.logPrefix,  "color:yellow;font-weight:bolder",...args);
  }
  error(text,...args) {
    console.error("%c"+this.logPrefix,  "color:red;font-weight:bolder",...args,new Error(text));
  }
  info(...args) {
    console.info("%c"+this.logPrefix,  "color:lightblue;font-weight:bolder",...args);
  }

  success(...args) {
    console.log("%c"+this.logPrefix,  "color:lightgreen;font-weight:bolder",...args);
  }
  keypoint(...args) {
    console.info("%c"+this.logPrefix,  "color:lime;font-weight:bolder;font-size:14px",...args);
  }
  
  static CSS_COLOR_NAMES = [
    //"currentcolor",
     "AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "DarkOrange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray", "Grey", "Green", "GreenYellow", "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "RebeccaPurple", "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen"]
  static SHORTHANDS = ["all", "animation", "animation-range", "background", "border", "border-block", "border-block-end", "border-block-start", "border-bottom", "border-color", "border-image", "border-inline", "border-inline-end", "border-inline-start", "border-left", "border-radius", "border-right", "border-style", "border-top", "border-width", "column-rule", "columns", "contain-intrinsic-size", "container", "flex", "flex-flow", "font", "font-synthesis", "font-variant", "gap", "grid", "grid-area", "grid-column", "grid-row", "grid-template", "inset", "inset-block", "inset-inline", "list-style", "margin", "margin-block", "margin-inline", "mask", "mask-border", "offset", "outline", "overflow", "overscroll-behavior", "padding", "padding-block", "padding-inline", "place-content", "place-items", "place-self", "position-try", "scroll-margin", "scroll-margin-block", "scroll-margin-inline", "scroll-padding", "scroll-padding-block", "scroll-padding-inline", "scroll-timeline", "text-decoration", "text-emphasis", "text-wrap", "transition"]
  static TAGS_TO_PROTECT = ["head", "html", "body", "frameset", "frame"]
  static CSS_COLOR_FUNCTIONS = ["rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "color", "color-mix", "oklch", "oklab"]
  shortHandRegex = new RegExp(`(?<![\\w-])(${uDarkC.SHORTHANDS.join("|")})([\s\t]*:)`, "gi") // The \t is probably not needed, as \s includes it
  tagsToProtectRegex = new RegExp(`(?<![\\w-])(${uDarkC.TAGS_TO_PROTECT.join("|")})(?![\\w-])`, "gi")
  // How much the color syntax can be complex: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#formal_syntax
  fastColorRegex = new RegExp(`(?<![\\w-])(${uDarkC.CSS_COLOR_FUNCTIONS.join("|")})\\(.*?\\)`, "gi")
  
  static colorWorkSource = {
    canvasWidth: 5,
    canvasHeight: 3,
  }
  colorWork = {
    canvasContext: (() => {
      let canvas = document.createElement("canvas");
      canvas.width = 5;
      canvas.height = 3;
      return canvas.getContext("2d");
    })()
    
  }
  attributes_function_map = {
    "color": (r, g, b, a, render, elem) => {
      elem.style.p_ud_setProperty("--ud-html4-color", uDark.revert_rgba(r, g, b, a, render));
      elem.setAttribute("ud-html4-support", true);
      elem.removeAttribute("color");
    },
    "text": "color",
    "bgcolor": this.rgba
  }
  
  colorRegex = new RegExp(`(?<![\\w-])(?:${uDarkC.CSS_COLOR_FUNCTIONS.join("|")})` + uDarkC.generateNestedParenthesisRegexNC(10), "gi")
  
  hexadecimalColorsRegex = /#[0-9a-f]{3,4}(?:[0-9a-f]{2})?(?:[0-9a-f]{2})?/gi // hexadecimal colors
  
  // Cant't use \b because of the possibility of a - next to the identifier, it's a word character
  namedColorsRegex = (new RegExp(`(?<![\\w-])(${uDarkC.CSS_COLOR_NAMES.join("|")})(?![\\w-])`, "gi"))
  
  regex_search_for_url = /url\("(.+?)(?<!\\)("\))/g
  regex_search_for_url_raw = /url\(\s*?(('.+?(?<!\\)'|(".+?(?<!\\)")|[^\)'"]*)\s*?)\)/gsi
  background_match = /background|sprite|(?<![a-z])(bg|box|panel|fond|fundo|bck)(?![a-z])/i
  logo_match = /nav|avatar|logo|icon|alert|notif|cart|menu|tooltip|dropdown|control/i
  background_color_css_properties_regex = /color|fill|(?:box|text)-shadow|border|^background(?:-image|-color)?$|^--ud-ptd-background/ // Background images can contain colors // css properties that are background colors
  
  exactAtRuleProtect = true
  matchAllCssCommentsRegex = /\/\*[^*]*\*+([^/*][^*]*\*+)*\/|\/\*[^*]*\*+([^/*][^*]*\*+)*|\/\*[^*]*(\*+[^/*][^*]*)*/g
  // At-rules : https://developer.mozilla.org/fr/docs/Web/CSS/At-rule
  
  // @charset, @import or @namespace, followed by some space or \n, followed by some content, followed by a code block a semicolon; or end of STRING
  // Surpisingly and fortunately end of LINE does not delimits the end of the at-rule and forces devs & minifers either to add a ; or end of STRING 
  // which and fortunately simplifies a LOT the handling 
  // See https://www.w3.org/TR/css-syntax-3/#block-at-rule ( Block at-rules )
  // 'm' flag is not set on purpose to avoid matching $ as a line end, and keeping it at end of STRING
  // Content must not be interupted while between quotes or parenthesis.
  // It wont break on string ("te\"st") or this one('te\'st') or @import ('abc\)d;s'); thanks to
  // priority matches (\\\)) and (\\') and (\\")  
  //-------------------v-Rule name----space or-CR--v-----v--Protected values-v----v-the content dot
  cssAtRulesRegex = /@(charset|import|namespace)(\n|\s)+((\((\\\)|.)+?\))|("(\\"|.)+?")|('(\\'|.)+?')|.)+?({.+?}|;|$)/gs
  
  direct_window_export = true
  general_cache = new Map()
  userSettings = {}
  imageSrcInfoMarker = "_uDark"
  imageWorkerJsFile = "imageWorker.js"
  min_bright_fg = 0.65 // Text with luminance  under this value will be brightened
  max_bright_fg = 1 // Text over this value will be darkened
  brightness_peak_editor_fg = 0.5 // Reduce the brightness of texts with intermediate luminace, tying to achieve better saturation
  hueShiftfg = 0 // Hue shift for text, 0 is fno shift, 360 is full shift
  min_bright_bg_trigger = 0.2 // backgrounds with luminace under this value will remain as is
  min_bright_bg = 0.1 // background with value over min_bright_bg_trigger will be darkened from this value up to max_bright_bg
  max_bright_bg = 0.4 // background with value over min_bright_bg_trigger will be darkened from min_bright_bg up to this value
  foreground_color_css_properties = ["color","caret-color"] // css properties that are foreground colors;, putting caret-color or any other property will edit the caret color with lightening and preventing the caret from being darkened
  // Gradients can be set in background-image
  
  static generateNestedParenthesisRegex(depth) { // Generates a regex that matches nested parenthesis
    if (depth === 1) {
      return "\\((.)*?\\)";
    }
    return `\\((${uDarkC.generateNestedParenthesisRegex(depth - 1)}|.)*?\\)`;
  }
  static generateNestedParenthesisRegexNC(depth) { // Generates a regex that matches nested parenthesis, non-capturing
    if (depth === 1) {
      return "\\(.*?\\)";
    }
    return `\\((?:${uDarkC.generateNestedParenthesisRegexNC(depth - 1)}|.)*?\\)`;
  }
  
  css_properties_wording_action_dict = {
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
      
      // TODO: Needs rework since we replaced prefix_fg_vars by prefix_vars
      callBacks: [(cssStyle, cssRule, details, options) => {
        
        let value = cssStyle.getPropertyValue("fill");
        this.edit_all_cssRule_colors_cb(cssRule, "color", value, options, {
          key_prefix:"--ud-fg--fill-",
          l_var: "--uDark_transform_lighten",
          fastValue0:true
        })
        
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
      callBacks: [this.edit_css_urls]
    },
    "background": {
      callBacks: [this.edit_css_urls]
    },
    "--ud-ptd-background": {
      variables: {
        property: "--ud-ptd-background",
        regex: this.regex_search_for_url_raw,
        use_other_property: "background-image",
        originalProperty: "background"
      },
      callBacks: [this.edit_css_urls]
    },
    
    // Not good for wayback machine time selector
    // "color":{ stickConcatToPropery: {sValue:"(",rKey:"mix-blend-mode", stick:"difference"}}, // Not good for wayback machine time selector
    // "position":{ stickConcatToPropery: {sValue:"fixed",rKey:"filter", stick:"contrast(110%)"}}, // Not good for wayback machine time selector
  }
  /* 
  Took comments from w3.org/csswg-drafts/css-syntax-3/#comments
  First part: \/\*[^*]*\*+([^/*][^*]*\*+)*\/ — This matches valid CSS comments.
  Second part: \/\*[^*]*\*+([^/*][^*]*\*+)* — This matches incomplete comments that look like they are improperly closed (badcomment1).
  Third part: \/\*[^*]*(\*+[^/*][^*]*)* — This also matches another form of incomplete comments (badcomment2).
  */
  edit_css(cssStyleSheet, details, options = {}) {
    if (!details) {
      details = {};
    }
    if (!details.transientCache) {
      details.transientCache = new Map();
    }
    uDark.edit_cssRules(cssStyleSheet.cssRules, details, options);
  }
  
  str_protect(str, regexSearch, protectWith) {
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
  }
  str_unprotect(str, protection) {
    if (protection.values) {
      protection.values.forEach((value, index) => {
        // I've learnt the hard way to care about some $' or $1 the protected value:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement
        // This is why we use a function to replace the protected value
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_function_as_the_replacement
        str = str.replace(protection.protectWith, () => value);
      })
    }
    return str;
  }
  str_protect_numbered(str, regexSearch, protectWith, condition = true) {
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
  }
  str_unprotect_numbered(str, protection, condition = true) {
    if (protection.values && condition) {
      protection.values.forEach((value, index) => {
        // I've learnt the hard way tto care about some $' or $1 the protected value:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement
        // This is why we use a function to replace the protected value
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_function_as_the_replacement
        
        str = str.replace(protection.protectWith.replace("{index}", index), () => value);
      })
    }
    return str;
  }
  sRGBtoLin(colorChannel) {
    // Send this function a decimal sRGB gamma encoded color value
    // between 0.0 and 1.0, and it returns a linearized value.
    
    if (colorChannel <= 0.04045) {
      return colorChannel / 12.92;
    } else {
      return Math.pow(((colorChannel + 0.055) / 1.055), 2.4);
    }
  }
  getLuminance(r, g, b) {
    return (0.2126 * uDark.sRGBtoLin(r / 255) + 0.7152 * uDark.sRGBtoLin(g / 255) + 0.0722 * uDark.sRGBtoLin(b / 255));
  }
  getPerceivedLigtness(r, g, b) {
    return uDark.YtoLstar(uDark.getLuminance(r, g, b));
  }
  YtoLstar(Y) {
    // Send this function a luminance value between 0.0 and 1.0,
    // and it returns L* which is "perceptual lightness"
    
    if (Y <= (216 / 24389)) { // The CIE standard states 0.008856 but 216/24389 is the intent for 0.008856451679036
      return Y * (24389 / 27); // The CIE standard states 903.3, but 24389/27 is the intent, making 903.296296296296296
    } else {
      return Math.pow(Y, (1 / 3)) * 116 - 16;
    }
  }
  search_container_logo(element, notableInfos) {
    
    let parent = (element.parentNode || element)
    parent = (parent.parentNode || parent)
    return uDark.logo_match.test(parent.outerHTML + notableInfos.uDark_cssClass)
  }
  search_clickable_parent(documentElement, selectorText) {
    return documentElement.querySelector(`a ${selectorText},button ${selectorText}`);
  }
  image_element_prepare_href(image, documentElement, src_override, options = {}) // Adds notable infos to the image element href, used by the image edition feature
  {
    // Do not parse url preventing adding context to it or interpreting it as a relative url or correcting its content by any way
    let imageTrueSrc = src_override || image.getAttribute("src")
    
    if (uDark.userSettings.disable_image_edition || !imageTrueSrc) {
      
      return imageTrueSrc;
    }
    
    if (!image.hasAttribute("data-ud-selector")) {
      image.setAttribute("data-ud-selector", Math.random());
    }
    let selectorText = image.tagName + `[data-ud-selector='${image.getAttribute("data-ud-selector")}']`;
    let notableInfos = {};
    for (const attribute of image.attributes) {
      if (attribute.value.length > 0 && !(/[.\/]/i).test(attribute.value) && !(["src", "data", "data-ud-selector"]).includes(attribute.name)) {
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
      usedChar = "#" + usedChar;
    }
    imageTrueSrc = uDark.send_data_image_to_parser(imageTrueSrc, false, {
      ...options,
      notableInfos,
      image
    });
    
    return imageTrueSrc + usedChar + new URLSearchParams(notableInfos).toString();
  }
  valuePrototypeEditor(leType, atName, setter = false, conditon = false, aftermath = false, getter = false) {
    
    uDark.info("Editing property :", leType, atName)

    if (leType.concat) {
      return leType.forEach(aType => uDark.valuePrototypeEditor(aType, atName, setter, conditon, aftermath, getter))
    }
    
    if (leType.wrappedJSObject) { // Cross compatibilty with content script
      leType = leType.wrappedJSObject;
    }
    
    var originalProperty = Object.getOwnPropertyDescriptor(leType.prototype, atName);
    if (!originalProperty) {
      console.error("No existing property for '", atName, "'", leType, leType.name, leType.prototype)
      return;
    }
    
    Object.defineProperty(leType.prototype, "o_ud_" + atName, originalProperty);
    let override_get_set = {};
    if (setter) {
      override_get_set.set = uDark.exportFunction(function(value) { // getters must be exported like regular functions
        var new_value = (!conditon || conditon(this, value) === true) ? setter(this, value) : value;
        let call_result = originalProperty.set.call(this, new_value || value);
        aftermath && aftermath(this, value, new_value);
        return call_result;
      }, window);
    }
    if (getter) {
      override_get_set.get = uDark.exportFunction(function() { // getters must be exported like regular functions
        let call_result = originalProperty.get.call(this);
        return getter(this, call_result);
      }, window);
    }
    // uDark.general_cache["o_ud_"+atName]=originalSet
    Object.defineProperty(leType.prototype, atName, override_get_set);
  }
  
  functionWrapper(leType, laFonction, fName, watcher = x => x, conditon = true, result_editor = x => x) {
    uDark.info("Wrapping function :", leType, laFonction, fName)
    let originalFunction = leType.prototype["o_ud_wrap_" + fName] = laFonction;
    leType.prototype[fName] = function(...args) {
      if (conditon === true || conditon(this, arguments) === true) {
        let watcher_result = watcher(this, arguments);
        let result = originalFunction.apply(...watcher_result)
        return result_editor(result, this, watcher_result);
      } else {
        return (originalFunction.apply(this, arguments));
      }
    }
  }
  functionPrototypeEditor(leType, laFonction, watcher = x => x, conditon = x => x, result_editor = x => x) {
    if (laFonction.concat) {
      return laFonction.forEach(aFonction => {
        uDark.functionPrototypeEditor(leType, aFonction, watcher, conditon, result_editor)
      })
    }
    if (leType.wrappedJSObject) { // Cross compatibilty with content script
      leType = leType.wrappedJSObject;
    }
    uDark.info("Editing function :", leType, laFonction)
    leType.prototype.count = (leType.prototype.count || 0) + 1;
    if (!Object.getOwnPropertyDescriptor(leType.prototype, laFonction.name)) {
      uDark.error("No getter for '", leType, laFonction, new Error(), leType.prototype.count, document.location.href)
      return;
    }
    let originalFunctionKey = "o_ud_" + laFonction.name
    var originalFunction = uDark.exportFunction(Object.getOwnPropertyDescriptor(leType.prototype, laFonction.name).value, window);
    Object.defineProperty(leType.prototype, originalFunctionKey, {
      value: originalFunction,
      writable: true
    });
    Object.defineProperty(leType.prototype, laFonction.name, {
      value: {
        [laFonction.name]: uDark.exportFunction(function() {
          if (conditon === true || conditon.apply(this, arguments)) { // if a standard function is provided, it will will be able to use the 'this' keyword
            let watcher_result = watcher(this, arguments);
            let result = originalFunction.apply(this, watcher_result) // if a standard function is provided, it will will be able to use the 'this' keyword
            return result_editor(result, this, arguments, watcher_result);
          } else {
            return (originalFunction.apply(this, arguments));
          }
        }, window)
      } [laFonction.name]
    });
  }
  
  edit_str_restore_imports_all_way(str, rules) {
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
    
  }
  send_data_image_to_parser(str, details, options) {
    
    // uDark.disable_data_image_edition=true;
    if (str.trim().toLowerCase().startsWith('data:') && !uDark.userSettings.disable_image_edition && !uDark.disable_data_image_edition) {
      let {
        b64,
        dataHeader,
        data,
        failure
      } = options.cut || uDark.decodeBase64DataURIifIsDataURI(str);
      let imageData = data;
      options.changed = true; // We have changed the image, notify calle, like edit_css_url action
      options.is_data_image = true;
      
      if (!failure && dataHeader.includes('svg')) // Synchronous edit for data SVGs images, we have some nice context and functions to work with
      { // This avoids loosing svg data including the size of the image, and the tags in the image
        uDark.disable_svg_data_url_edition = false;
        options.svgImage = true;
        options.svgDataImage = true;
        if (uDark.disable_svg_data_url_edition) {
          return str;
        }
        options.get_document = true;
        
        if (!b64) {
          
          // This replaces searches for unencoded % in image data, and replaces them by the equivalent %25.
          // Some websites uses % in their svg data eg for percentage value, while not encoding them.
          // This results in a probalby broken image, since we are in a dataURL image.
          // I dont care too much about this,but it can lead to decodeURI errors. and therefore to a broken page. 
          imageData = imageData.replace(/%(?![0-9a-z]{2})/gi, "%25")
          imageData = decodeURIComponent(imageData);
        }
        
        imageData = uDark.frontEditHTML(false, imageData, details, options).innerHTML;
        
        let encoded = undefined;
        // uDark.disable_reencode_data_svg_to_base64=true;
        if (uDark.disable_reencode_data_svg_to_base64) {
          if (b64) {
            dataHeader = dataHeader.replace("base64", "")
          };
          encoded = dataHeader + encodeURIComponent(imageData)
        } else if (uDark.respect_site_svgs_dataurls) {
          if (!b64) {
            imageData = encodeURIComponent(imageData);
          }
          let encoded = uDark.rencodeToURI(imageData, dataHeader, b64);
          if (encoded.message) {
            console.warn(encoded)
            encoded = encodeURIComponent(imageData);
          }
          str = encoded;
        } else {
          if (!b64) {
            encoded = uDark.rencodeToURI(imageData, dataHeader.split(",").join(";base64,"), true);
          } else {
            encoded = uDark.rencodeToURI(imageData, dataHeader, true);
          }
          if (encoded.message) {
            console.warn(encoded)
            encoded = encodeURIComponent(imageData);
            encoded = uDark.rencodeToURI(encoded, dataHeader.replace("base64", ""), false);
          }
          
        }
        
        str = encoded;
      } else {
        str = "https://data-image?base64IMG=" + str; // Sending other images to the parser via the worker,
        if (options.image) {
          options.image.removeAttribute("crossorigin"); // data images are not CORS with this domain, so we remove the attribute to avoid CORS errors
        }
      }
    }
    return str;
  }
  get_fill_for_svg_elem(fillElem, override_value = false, options = {}, class_name = "udark-fill", transform = true) {
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
      // Wont work with new mthod, will need to be updated
      let edit_result = uDark.eget_color(fillValue, is_text ? uDark.revert_rgba_rgb_raw : uDark.rgba_rgb_raw,false,true)
      return edit_result;
    }
    return "Not implemented";
  }
  frontEditSVG(svg, documentElement, details, options = {}) {
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
    
    svg.setAttribute("udark-guess", options.notableInfos.guessed_type);
    svg.setAttribute("udark-infos", new URLSearchParams(options.notableInfos).toString());
    
  }
  edit_styles_elements(parentElement, details, add_class = "ud-edited-background", options = {}) {
    parentElement.querySelectorAll(`style:not(.${add_class})`).forEach(astyle => {
      astyle.p_ud_innerHTML = uDark.edit_str(astyle.innerHTML, false, false, details, false, options);
      // astyle.innerHTML='*{fill:red!important;}'
      // According to https://stackoverflow.com/questions/55895361/how-do-i-change-the-innerhtml-of-a-global-style-element-with-cssrule ,
      // it is not possible to edit a style element innerHTML with its cssStyleSheet alone
      // As long as we are returing a STR, we have to edit the style element innerHTML;
      
      astyle.classList.add(add_class)
    });
  }
  parseAndEditHtmlContentBackend4(strO, details) {
    let str = strO;
    if (!str || !str.trim().length) {
      return str;
    }
    str = str.protect_simple(uDark.tagsToProtectRegex, "ud-tag-ptd-$1"
      // use word boundaries to avoid matching tags like "headings" or tbody or texts like innerHTML
      // Frame and frameset are obsolete, but there were meant to be in head, and will be removed from body, they need to be protected
      
    );
    
    let parsedDocument = uDark.createDocumentFromHtml("<body>" + str + "</body>"
      /* Re encapsulate str into a <body> is not an overkill : Exists something called unsafeHTML clid binding. I did not understood what it is, but it needs a body tag for proper parsing*/
    );
    
    const aDocument = parsedDocument.body;
    
    if (details.unspecifiedCharset) {
      // As we seen document.characterSet will default <meta http-equiv> we need to account the meta tag charset and re decode the document properly
      // It Falbacks from http header charset to meta tag charset, then to http-equiv charset then to OS charset.
      // We can use queryselector safely as it takes the first meta tag it finds
      let metaContentType = aDocument.querySelector("meta[charset],meta[http-equiv='Content-Type']");
      // If both charset and http-equiv attributes are set in the same tag , charset wins
      
      if (metaContentType) {
        let usedContentType = metaContentType.getAttribute("content");
        if (metaContentType.hasAttribute("charset")) {
          let usedCharset = metaContentType.getAttribute("charset");
          usedContentType = `text/html;charset=${usedCharset}`;
        }
        let metaDetails = {
          responseHeaders: [{
            name: "Content-Type",
            value: usedContentType
          }]
        }
        uDark.extractCharsetFromHeaders(metaDetails);
        if (metaDetails.charset != "utf-8") {
          details.metaContentType = usedContentType;
          details.unspecifiedCharset = false;
          details.charset = metaDetails.charset;
          const redDecoded = uDarkDecode(metaDetails.charset, details.writeEnd, {
            stream: true
          });
          return uDark.parseAndEditHtmlContentBackend4(redDecoded, details);
        }
      }
    }
    aDocument.querySelectorAll("meta[http-equiv=content-security-policy]").forEach(m => m.remove());
    if (!details.debugParsing) {
      
      // 4. Temporarily replace all SVG elements to avoid accidental style modifications
      const svgElements = uDark.processSvgElements(aDocument, details);
      // 5. Edit styles and attributes inline for background elements
      uDark.edit_styles_attributes(aDocument, details);
      uDark.edit_styles_elements(aDocument, details, "ud-edited-background");
      
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
    }
    
    // 15. Remove the integrity attribute from elements and replace it with a custom attribute
    uDark.restoreIntegrityAttributes(aDocument);
    
    // 16. Return the final edited HTML
    const outerEdited = aDocument.innerHTML.trim().unprotect_simple("ud-tag-ptd-");
    return "<!doctype html>" + outerEdited; // Once i tried to be funny and personalized the doctype, but it was a bad idea, it broke everything ! Doctype is a serious thing, very sensitive to any change outside of the standard
    
  }
  
  frontEditHTML(elem, strO, details, options = {}) {
    // 0. Return the original value if it's not a string
    if(!(strO instanceof String || typeof strO === "string")){
      return strO;
    }
    // 1. Ignore <script> elements to prevent unintended modifications to JavaScript
    let str = strO;
    if (elem instanceof HTMLScriptElement) {
      return strO;
    }
    // 2. Special handling for <style> and <svg> style elements (returns edited value directly)
    if (elem instanceof HTMLStyleElement || elem instanceof SVGStyleElement) {
      return uDark.edit_str(str, false, false, undefined, false, options);
    }
    // Cant use \b because of the possibility of a - next to the identifier, it's a word character
    str = str.protect_simple(uDark.tagsToProtectRegex, "ud-tag-ptd-$1");
    
    
    let parsedDocument = uDark.createDocumentFromHtml("<body>" + str + "</body>"
      /* Re encapsulate str into a <body> is not an overkill : Exists something called unsafeHTML clid binding. I did not understood what it is, but it needs a body tag for proper parsing*/
    );
    const aDocument = parsedDocument.body;
    
    
    // 4. Temporarily replace all SVG elements to avoid accidental style modifications
    const svgElements = uDark.processSvgElements(aDocument, details);
    
    // 5. Edit styles and attributes inline for background elements
    uDark.edit_styles_attributes(aDocument, details);
    uDark.edit_styles_elements(aDocument, details, "ud-edited-background");
    
    // 8. Add a custom identifier to favicon links to manage cache
    uDark.processLinks(aDocument);
    
    // 9. Process image sources and prepare them for custom modifications
    uDark.processImages(aDocument);
    
    // 10. Recursively process iframes using the "srcdoc" attribute by applying the same editing logic
    uDark.processIframes(aDocument, details, options);
    
    // 11. Handle elements with color attributes (color, bgcolor) and ensure proper color handling
    uDark.processColoredItems(aDocument);
    
    // 13. Restore the original SVG elements that were temporarily replaced
    uDark.restoreSvgElements(svgElements);
    
    // 15. Remove the integrity attribute from elements and replace it with a custom attribute
    uDark.restoreIntegrityAttributes(aDocument);
    
    // 18. After all the edits, return the final HTML output
    
    if (options.get_document) {
      return aDocument;
    }
    
    let resultEdited = aDocument.innerHTML.unprotect_simple("ud-tag-ptd-");
    return resultEdited;
  }
  
  createDocumentFromHtml(html) {
    // Use DOMParser to convert the HTML string into a DOM document
    const parser = new DOMParser();
    return parser.p_ud_parseFromString(html, "text/html");
  }
  
  processSvgElements(documentElement, details) {
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
  }
  
  processMetaTags(documentElement) {
    // Ensure that content-type meta tags are properly set to avoid charset issues
    documentElement.querySelectorAll("meta[http-equiv]").forEach(m => {
      if (m.httpEquiv && m.httpEquiv.toLowerCase().trim() === "content-type" && m.content.includes("charset")) {
        m.content = "text/html; charset=utf-8";
      }
    });
  }
  
  edit_styles_attributes(parentElement, details, options = {}) {
    parentElement.querySelectorAll("[style]").forEach(astyle => {
       astyle.setAttribute("style", uDark.edit_str(astyle.getAttribute("style"), false, false, details, false, {
        ...options,
        nochunk: true
      }));
    });
    
  }
  
  processLinks(documentElement) {
    // Append a custom identifier to favicon links to manage cache more effectively
    documentElement.querySelectorAll("link[rel*='icon' i][href]").forEach(link => {
      link.setAttribute("href", link.getAttribute("href") + "#ud_favicon");
    });
  }
  decodeBase64DataURIifIsDataURI(maybeBase64DataURI) {
    maybeBase64DataURI = maybeBase64DataURI.trim();
    if (!maybeBase64DataURI.startsWith("data:")) {
      return {
        b64: false,
        dataHeader: false,
        data: maybeBase64DataURI
      };
    }
    let commaIndex = maybeBase64DataURI.indexOf(","); // String.split is broken: It limits the number of elems in returned array instead of limiting the number of splits
    let [dataHeader, data] = [maybeBase64DataURI.substring(0, commaIndex + 1).toLowerCase().trim(), maybeBase64DataURI.substring(commaIndex + 1)]
    if (!dataHeader.includes("base64")) {
      return {
        b64: false,
        dataHeader,
        data
      }
    }
    try {
      return {
        b64: true,
        dataHeader,
        data: atob(data)
      }
    } catch {
      console.warn("Error decoding base64 data URI", maybeBase64DataURI)
      return {
        b64: true,
        dataHeader: false,
        data: false,
        failure: true
      }
    }
  }
  rencodeToURI(data, dataHeader, base64 = false) {
    if (!dataHeader) {
      return data;
    }
    if (base64) {
      try {
        return dataHeader + btoa(data);
      } catch {
        return new Error("Error encoding base64 data URI", data)
      }
    }
    return dataHeader + data;
  }
  processImages(documentElement) {
    // Process image sources to prepare them for custom modifications
    documentElement.querySelectorAll("img[src]").forEach(image => {
      
      image.setAttribute("src", uDark.image_element_prepare_href(image, documentElement));
    });
    
  }
  frontEditHTMLPossibleDataURL(elem, value, details, options, documentElement) {
    
    let {
      b64,
      dataHeader,
      data,
      failure
    } = uDark.decodeBase64DataURIifIsDataURI(value || ""); // Value can be null
    if (!failure && dataHeader) {
      if (dataHeader.includes("image")) {
        return uDark.image_element_prepare_href(elem, documentElement || document, value, {
          ...options,
          cut: {
            b64,
            dataHeader,
            data
          }
        });
      } else if (dataHeader.includes("html")) {
        data = uDark.frontEditHTML(elem, data, details, options)
        return uDark.rencodeToURI(data, dataHeader, b64);
      }
    }
    return value;
  }
  processIframes(documentElement, details, options) {
    // Recursively process iframes that use the "srcdoc" attribute by applying the same HTML processing function
    documentElement.querySelectorAll("iframe[srcdoc]").forEach(iframe => {
      iframe.setAttribute("srcdoc", uDark.frontEditHTML(false, iframe.srcdoc, details));
    });
    
    documentElement.querySelectorAll("object[data],embed[src],iframe[src]").forEach(object => {
      // Use GetAttribute to get the original value, as the src attribute may be changed by the context
      let src = object.getAttribute("src");
      let usedData = src ? src : object.getAttribute("data");
      
      object.setAttribute(src ? "src" : "data", uDark.frontEditHTMLPossibleDataURL(object, usedData, details, options, documentElement));
    });
  }
  
  processColoredItems(documentElement) {
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
          let callResult = afunction(...possibleColor, uDark.hex_val /* this kind of html4 attributes does not fully supports rgba vals, prefer use hex vals  */ , coloredItem);
          
          if (callResult) {
            coloredItem.setAttribute(key, callResult);
          }
        }
      }
    });
  }
  
  injectStylesIfNeeded(aDocument, details) {
    // Inject custom CSS and the dark color scheme meta tag if this is the first data load
    if (details.dataCount === 1) {
      
      // Stopped using inject_css_suggested as direct inection, as it was causing issues with some websites, like react ones that starts with a minimal body
      
      const udMetaDark = aDocument.querySelector("meta[name='color-scheme']") || document.createElement("meta");
      udMetaDark.id = "ud-meta-dark";
      udMetaDark.name = "color-scheme";
      udMetaDark.content = "dark";

      // Note : looking for a head first is not a problem since aDocument, in the last iteration of parsing is a body.
      let headElem = aDocument.head || aDocument.querySelector("ud-tag-ptd-head") || aDocument;
      headElem.prepend(udMetaDark);
    }
  }
  
  restoreSvgElements(svgElements) {
    // Restore the original SVG elements that were temporarily replaced
    svgElements.forEach(([svg, tempReplace]) => {
      tempReplace.replaceWith(svg);
    });
  }
  restoreNoscriptElements(aDocument) {
    // Restore <noscript> elements that were converted to <script>
    aDocument.querySelectorAll("script[secnoscript]").forEach(script => {
      let noScript = document.createElement("noscript");
      for (let node of script.attributes) {
        noScript.setAttribute(node.name, node.value)
      }
      let template = aDocument.createElement('template');
      template.innerHTML = script.innerHTML;
      noScript.append(template.content); // We cant put innerHTML directly in a noscript element, it would be html encoded. The template element is used to avoid this, it parse elements for us.
      script.replaceWith(noScript);
      
    });
  }
  restoreTemplateElements(aDocument) {
    // Restore <noscript> elements that were converted to <template>
    
    // Using replaceWith() instead of innerHTML to avoid issues with nested elements wich were HTMLencoded
    aDocument.querySelectorAll("template[secnoscript]").forEach(template => {
      let noScript = document.createElement("noscript");
      for (let node of template.attributes) {
        noScript.setAttribute(node.name, node.value)
      }
      noScript.append(template.content);
      template.replaceWith(noScript);
    });
  }
  
  restoreIntegrityAttributes(aDocument) {
    // Remove the integrity attribute from elements and store it as a custom attribute
    aDocument.querySelectorAll("[integrity]").forEach(integrityElem => {
      integrityElem.setAttribute("data-no-integ", integrityElem.getAttribute("integrity"));
      integrityElem.removeAttribute("integrity");
      integrityElem.setAttribute("onerror", "uDark.linkIntegrityErrorEvent(this)"); // Fix for reloading the resource if it fails to load, happened on graphene.org 
    });
  }
  
  str_protect_simple(str, regex, protectWith, condition = true) {
    if (condition) {
      str = str.replaceAll(regex, protectWith)
    }
    return str;
  }
  str_unprotect_simple(str, protectedWith, condition = true) {
    if (condition) {
      str = str.replaceAll(protectedWith, "")
    }
    return str;
  }
  
  edit_str_nochunk(strO) {
    if (strO.join) {
      strO = strO.join("");
    }
    return uDark.edit_str(strO, false, false, undefined, false, {
      nochunk: true
    });
  }
  
  edit_str(strO, cssStyleSheet, verifyIntegrity = false, details, options = {}) {
    
    if(!( typeof strO === "string" || strO instanceof String)){
      return strO; // Do not edit non string values to avoid errors, web is wide and wild
    }
    
    let str = strO;
    
    if (false && strO.includes("/*!sc*/")) { // TODO: Fix thins in abetter way; this is a temporary and specific fix; 
      console.warn("React incompatible css detectd", uDark.edit_str);
      uDark.edit_str.last_debugged = {
        strO,
        cssStyleSheet,
        verifyIntegrity,
        details,
        options
      };
      return strO;
    }

    
    // Protection of imports
    // Unfortunately, this could lead to a reparation of a broken css if the chunking splits the @import in two parts
    // We might someday encounter this very improbable case, and have to check if the last rule is an unclosed @rule, while having some rules before it and reject the CSS chunk
    // In the end the chunk would eventualy come back contatenated with the next chunk, and then we could edit it properly.
   
    let import_protection = strO.protect_numbered(uDark.cssAtRulesRegex, 'udarkAtRuleProtect { content: "{index}"; }', uDark.exactAtRuleProtect)
    
    str = import_protection.str;
    str = str.protect_simple(uDark.shortHandRegex, "--ud-ptd-$1:");
    
    if (!cssStyleSheet) {
      cssStyleSheet = new CSSStyleSheet()
      if (!options.nochunk) { // Avoiding a warning in the console when we know we are not chunking
        let valueReplace = str + (verifyIntegrity ? "\n.integrity_rule{}" : "");
        cssStyleSheet.p_ud_replaceSync(valueReplace);
      }
    } else if (!cssStyleSheet.rules.length) {
      return strO; // Empty styles from domparser can't be edited as they are not "constructed"
    }

    let rejected_str = false;
    
    // Protection of CSS shorthand properties, 
    // let protected_comments=str.protect(uDark.matchAllCssCommentsRegex,"");
    // str=protected_comments.str;
    
    let nochunk = options.nochunk || !verifyIntegrity && !cssStyleSheet.cssRules.length // if we want to check integrity, it means we have a chunked css
    
    if (nochunk) {

      // Here if :
      // - We only have properties like background: white; 
      if (import_protection.values) {
        return strO;
      }
      str = `z{${str}}`;
      cssStyleSheet.p_ud_replaceSync(str);
      uDark.edit_css(cssStyleSheet, details, options);
      str = cssStyleSheet.cssRules[0].cssText.slice(4, -2);
    } else {
      
      /* This does not exist anymore, as we are repairing import locations in the CSS with the import protection, integrity will allways be verifiable.
      // Exists the rare case where css only do imports, no rules with {} and integrity cant be verified because it does not close the import with a ";"
      let returnAsIs = (!cssStyleSheet.cssRules.length && !strO.includes("{")); // More reliable than checking if it starts with an a @ at it may starts with a comment 
      // let returnAsIs = (!cssStyleSheet.cssRules.length && import_protection.values); // More reliable than checking if it starts with an a @ at it may starts with a comment 
      
      if (returnAsIs) {
      uDark.info("Returning as is", strO);
      return strO; //don't even try to edit it .
      // Fortunately it is not a common case, easy to detect with zero cssRules, and it mostly are short strings testables with includes
      };
      */
      
      if (verifyIntegrity) {
        
        let last_rule = cssStyleSheet.cssRules[cssStyleSheet.cssRules.length - 1];
        let antp_ult_rule = cssStyleSheet.cssRules[cssStyleSheet.cssRules.length - 2];
        let is_rejected = !last_rule || last_rule.selectorText != ".integrity_rule"; // It must ne an exact match to avoid reparations of broken CSS in the middle of a css identifier
        let is_rejected_at_rule = !is_rejected && antp_ult_rule && antp_ult_rule.selectorText == "udarkAtRuleProtect"; // Our protection of @rules might have repaired a half cut @rule, we have to reject it if the last known rule is an @rule
        if (is_rejected || is_rejected_at_rule) {
          //
          let can_iterate = !is_rejected_at_rule && cssStyleSheet.cssRules.length > 1; // If there is only one rule, and it's rejected, we dont'have to find the previous one
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
              cssStyleSheet.p_ud_replaceSync(valueReplace); // Asumig only background script will edit CSS with integrity verification, using replaceSync is ok
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
            return new Error("Rejected integrity rule as a whole");
          }
        }
      }
      
      uDark.edit_css(cssStyleSheet, details, options);
      
      let rules = [...cssStyleSheet.cssRules].map(r => r.cssText);
      str = rules.join("\n");
      
    }
    str = str.unprotect_simple("--ud-ptd-").unprotect_numbered(import_protection, uDark.exactAtRuleProtect)
    if (rejected_str) {
      str = {
        str: str,
        rejected: rejected_str,
      }
    }
    
    return str || strO; // It's essential to return the original value if the CSS is broken, if e did not knew what to do with it, we should not have edited it. This is demostrated on hub.docker.com that looks into a comment only css
  }
  rgba_val(r, g, b, a) {
    a = typeof a == "number" ? a : 1;
    return "rgba(" + (r) + "," + (g) + "," + (b) + "," + (a) + ")";
  } // https://perf.link : Concatenation is better than foramting
  hsla_val(h, s, l, a) {
    a = typeof a == "number" ? a : 1;
    return "hsla(" + (h * 360) + " " + (s * 100) + "% " + (l * 100) + "% / " + (a) + ")";
  }
  hex_val(r, g, b, a) {
    a = typeof a == "number" ? a : 1
    return "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0") +
    (a == 1 ? "" : (a * 255).toString(16).padStart(2, "0"))
  }
  
  hslToRgb(h, s, l) {
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
  }
  
  hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  rgbToHsl(r, g, b) {
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
  }
  RGBToLightness_old(r, g, b) {
    
    const l = Math.max(r, g, b);
    const s = l - Math.min(r, g, b);
    return (2 * l - s) / 2;
  }
  RGBToLightness(r, g, b) {
    return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
  }
  RGBToLightness_fast(r, g, b) {
    /**
    * The optimized version is faster because it avoids the overhead of `Math.max` and `Math.min`
    * by using simple conditional comparisons with 3 params. This reduces function call overhead, leading to
    * better performance, especially when executed many times.
    */
    return (r > g ? (r > b ? r : b) : (g > b ? g : b)) +
    (r < g ? (r < b ? r : b) : (g < b ? g : b)) / 2;
  }
  
  eget_color(anycolor, editColorF = false, cssRule = false, no_color = false, fill = false) {
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
    
  }
  is_color(possiblecolor, as_float = true, fill = false, cssRule, spanp = false) {
    let cache_key = `${possiblecolor}${as_float}${fill}`
    if (!uDark.userSettings.disable_cache && !spanp && uDark.general_cache.has(cache_key)) { // See https://jsben.ch/aXxCT for cache effect on performance
      return uDark.general_cache.get(cache_key);
    }
    if (!possiblecolor || possiblecolor === "none") { // none is not a color, and it not usefull to create a style element for it
      return false
    }
    if (!uDark.is_background && possiblecolor.includes("var(")) {
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
        uDark.general_cache.set(cache_key, result);
      }
      return result;
      
    }
    
  }
  is_color_var(possiblecolor, as_float = true, fill = false, cssRule, spanp = false, use_cache = true) {
    // Must restore spanp feature and use it in frontend capture with flood-color css attribute
    // to catch correctly assignments like style.color=rgba(var(--flood-color),0.5) instead of returning [0,0,0,0]
    
    // Helped by is_color_var and regexpes, we should not need this block
    if (!possiblecolor || possiblecolor === "none") { // none is not a color, and it not usefull to create a style element for it
      return false
    }
    
    let cache_key = `${possiblecolor}${as_float}${fill}`
    if (!uDark.userSettings.disable_cache && !spanp && use_cache && uDark.general_cache.has(cache_key)) { // See https://jsben.ch/aXxCT for cache effect on performance
      return uDark.general_cache.get(cache_key);
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
      // I D K how much else it can repair colors, but it is a good thing to know
      // Best solution i ffound i to remove the rightiests parenthesis and compare them
      // It does not affects spaces, it only appends parenthesis at the end of the string as far as I know
      
      // Browser said it is a color but doubt it is a valid one, we need a further check.
      document.head.appendChild(option);
      
      style.p_ud_backgroundColor = possiblecolor;
      
      let computedStyle = getComputedStyle(option); // On invalid colors, background will be none here
      result = computedStyle.floodColor || possiblecolor; // Sometimes on frontend, computedStyle is empty, i d k why. Looks like a bug in browser 
      
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
        uDark.general_cache.set(cache_key, result);
      }
    }
    return result;
  }
  revert_rgba_rgb_raw(r, g, b, a, render = false) {
    render = (render || uDark.rgba_val)
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
    }
    rgba_rgb_raw(r, g, b, a, render = false) {
      render = (render || uDark.rgba_val)
      a = typeof a == "number" ? a : 1
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
    }
    rgba(r, g, b, a, render = false) {
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
        // Same; Use a ternary operator to avoid calc twice the value of l line in min for comparison
        l = (l < 0.5) ? (2 * A * l) : (A + 2 * (B - A) * (l - 0.5));
        
        // with l on a scale of 100 : in CSS relative colors
        // l = l<50? (2*A*l): ( 2 * (B - A) * l + 100 * (2 * A - B));
        
        // 2 * (B - A) * l + 100 * (2 * A - B)
        // Old way to do it, but accuracy is not as good as the above one
        // https://www.desmos.com/calculator/oqqi9nzonh
        // if (l > 0.5) {
        //   l = 1 - l; // Invert the lightness for bightest colors
        // }
        // l = Math.min(2 * l, -2 * l + 2) * (A - B) + B;
        
        [r, g, b] = uDark.hslToRgb(h, s, l);
      }
      
      return render(...[r, g, b], a);
    }
    revert_rgba(r, g, b, a, render) {
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
      
      if (h > 0.61 && h < 0.72 && l > .60) {
        // FIXME: EXPERIMENTAL:
        h += 0.61 - h; // Avoid blueish colors being purple by sending them back into blues
      }
      
      // i dont like how saturation boost gives a blue color to some texts like gitlab's ones.
      // s=1-Math.pow(1-s,1/E); // Boost saturation proportionnaly as brightness decrease, but we could have a separate setting for saturation boost
      
      // h=h-(l-ol)/4; // Keep the same hue, but we could have a separate setting for hue shift
      
      [r, g, b] = uDark.hslToRgb(h, s, l);
      
      return render(...[r, g, b], a);
    }
    edit_prefix_vars(value, actions) {
      if (!value.includes("var(")) {
        return value; // No variables to edit;
      }
      return value.replace(/(?<![\w-])--([\w-])/gi, "--ud-" + actions.prefix_vars + "--$1")
    }
    restore_vars(value) {
      return value.replaceAll("..1..", "var(").replaceAll("..2..", ")").replaceAll("..3..", "calc(");
    }
    wrapIntoColor(color, actions) {
      let l_var = actions.l_var? `var(${actions.l_var})` : "l";
      let h_var = actions.h_var? `var(${actions.h_var})` : "h";
      return `hsl(from ${color} ${h_var} s ${l_var} / alpha)`
    }
    edit_fastValue0( value, actions, cssRule) {
      if(actions.js_static_transform){
        if(!value.includes("var(")){
          return uDark.eget_color(value, actions.js_static_transform, cssRule, true, true);
        }
      }
      return uDark.wrapIntoColor(value, actions);
    }
    edit_with_regex(key, value, regex, actions, cssRule) {
      return value.replaceAll(regex, (match) => {
        return uDark.edit_fastValue0(match, actions, cssRule);
      });
    }
    
    edit_all_cssRule_colors_cb(cssRule, key, value, options, actions) {
    
      // 0. Return the original value if it's not a string
      if(!(value instanceof String || typeof value === "string")){
        return value;
      }
      // if ((value.match(/\(/g) || []).length !== (value.match(/\)/g) || []).length) {
      //   console.error("Unbalanced parenthesis in value", key, value);
      // }


      let alreadyEditedTestResult = value.match("NotImplemented" + uDark.alreadyEditedTestRegex);
      let key_prefix = actions.key_prefix || "";
      if (alreadyEditedTestResult) {
        uDark.info("Already edited", key, value, alreadyEditedTestResult)
        return value; // Take care of no_edit here, dont forget to return value
      }
      let cssStyle = cssRule.style;
      if (actions.fastValue0) {
        let wrapped=uDark.edit_fastValue0(value, actions, cssRule);
        if(actions.no_edit || wrapped==value && !key_prefix){
          return wrapped;
        }
        cssStyle.p_ud_setProperty(key_prefix + key, wrapped, cssStyle.getPropertyPriority(key));
        return;
      }
      
      let url_protected = uDark.str_protect(value, actions.raw_text ? uDark.regex_search_for_url_raw : uDark.regex_search_for_url, "url_protected");
    
      // url_protected=value.protect(/DISABLED/,"url_protected");
      let new_value = url_protected.str;
      
      let fastValue1 = !value.match(/\([^\)]+\(/)
      
      let usedColorRegex = fastValue1 ? uDark.fastColorRegex : uDark.colorRegex;
      if (actions.prefix_vars) {
        new_value = uDark.edit_prefix_vars(new_value, actions);
      }
      new_value = uDark.edit_with_regex(key, new_value, usedColorRegex, actions);
      new_value = uDark.edit_with_regex(key, new_value, uDark.namedColorsRegex, actions); // edit_named_colors
      new_value = uDark.edit_with_regex(key, new_value, uDark.hexadecimalColorsRegex, actions); // edit_hex_colors // The browser auto converts hex to rgb, but some times not like in  var(--123,#00ff00) as it cant resolve the var
      new_value = uDark.str_unprotect(new_value, url_protected);
      
      if (!actions.no_edit && value != new_value || key_prefix) {
        // Edit the value only if necessary:  setting bacground image removes bacground property for intance
        cssStyle.p_ud_setProperty(key_prefix + key, new_value, cssStyle.getPropertyPriority(key)); // Once we had  an infinite loop here when uDark was loaded twice and redefining setProperty.
      }
      return new_value;
    }
    edit_all_cssRule_colors(cssRule, keys, options,  actions = {}, callBack = uDark.edit_all_cssRule_colors_cb) {
      
      keys.forEach(key => {
        let value = cssRule.style.getPropertyValue(key);
        if(actions.raw_text_prefix){
          // clone actions to avoid changing the original object, while adding a new property
          actions = Object.assign({raw_text:key.startsWith(actions.raw_text_prefix)}, actions);
        }
        if (actions.replaces) {
          for (let replace of actions.replaces) {
            value = value.replaceAll(...replace);
          }
        }
        if (value) {
          callBack(cssRule, key, value, options, actions);
        }
      });
    }
    
    edit_cssProperties(cssRule, details, options) {
      let foregroundFastItems = [],
      variablesItems = [],
      backgroundItems = [],
      wordingActions = [];
      for (let x of cssRule.style) {
        if (x.startsWith("--")) {
          if (x.match(/^--ud-[bf]g--/)) {
            continue
          }
          if (!x.startsWith("--ud-ptd-")) { // Now using protection strategy for shorthands, but matching them properly with the regex <3
            variablesItems.push(x);
            continue; // Eliminate Variables, i don't think its usefull to test them againt regexes
          }
        }
        if (uDark.css_properties_wording_action_dict[x]) {
          wordingActions.push(x);
        } // Check if some wording action is needed
        if (uDark.foreground_color_css_properties.includes(x)) {
          foregroundFastItems.push(x);
          continue;
        } // Do foreground items first as its faster to check a list
        if (x.match(uDark.background_color_css_properties_regex)) {
          backgroundItems.push(x);
          continue;
        } // Do background regex match
        
      }

      wordingActions.length && uDark.css_properties_wording_action(cssRule.style, wordingActions, details, cssRule, options);
      
      backgroundItems.length && uDark.edit_all_cssRule_colors(cssRule, backgroundItems, options, 
        uDark.overrideBGColorActions || {
          prefix_vars: "bg",
          raw_text_prefix: "--",
          l_var:"--uDark_transform_darken",
          js_static_transform: uDark.rgba,
        })
        
        foregroundFastItems.length && uDark.edit_all_cssRule_colors(cssRule, foregroundFastItems, options, {
          fastValue0: true,
          l_var:"--uDark_transform_lighten",
          h_var:"--uDark_transform_text_hue",
          js_static_transform: uDark.revert_rgba,
        })
        
        variablesItems.length && uDark.edit_all_cssRule_colors(cssRule, variablesItems, options,
          {
            prefix_vars: "bg",
            raw_text: true,
            l_var:"--uDark_transform_darken",
            key_prefix:"--ud-bg",
            js_static_transform: uDark.rgba,
          })
          
        }
        edit_cssRules(cssRules, details, options = {}, callBack = uDark.edit_cssProperties) {
          [...cssRules].forEach(cssRule => {
            
            if (cssRule.cssRules && cssRule.cssRules.length) {
              uDark.edit_cssRules(cssRule.cssRules, details, options, callBack);
            }
            if (cssRule.style && cssRule.constructor.name != "CSSFontFaceRule") {
              callBack(cssRule, details, options);
            }
            
          })
        }
        addNocacheToStrLink(linkP1) {
          let linkP2 = "";
          
          let hashIndex = linkP1.indexOf("#");
          if (hashIndex != -1) {
            linkP2 = linkP1.substring(hashIndex);
            linkP1 = linkP1.substring(0, hashIndex);
          }
          let paramsIndex = linkP1.indexOf("?");
          if (paramsIndex != -1) {
            linkP2 = linkP1.substring(paramsIndex + 1) + linkP2;
            linkP1 = linkP1.substring(0, paramsIndex + 1);
            return linkP1 + "uDnCcK=" + Math.random() + "&" + linkP2;
          }
          return linkP1 + "?uDnCcK=" + Math.random() + linkP2;
          
        }
        edit_css_urls(cssStyle, cssRule, details, options, vars) {
          if (uDark.userSettings.disable_image_edition) {
            return;
          }
          vars = vars || {};
          vars.property = vars.property || "background-image";
          let oValue = cssStyle.getPropertyValue(vars.property);
          let value = oValue;
          
          // Its very neccessary to not edit property if they dont contain a url, as it changes a lot the CSS if there are shorthand properties involved : setting bacground image removes bacground property
          
          // Instead of registering the image as a background, we will encode the selector in the URL 
          // and register the image as a background image only when it is downloaded, in the filter script
          options = {
            ...options,
            changed: false
          }; // Do not edit the options object, it is shared between all calls
          let used_regex = vars.regex || uDark.regex_search_for_url
          
          if (vars.use_other_property) {
            let transientCSSStylesheet = new CSSStyleSheet();
            vars.transientCSSStylesheet = transientCSSStylesheet;
            transientCSSStylesheet.p_ud_insertRule(["z{", cssStyle.cssText, "}"].join(""));
            transientCSSStylesheet.cssRules[0].style.p_ud_setProperty(vars.originalProperty, value);
            vars.originalBackgroundRepeat = transientCSSStylesheet.cssRules[0].style.backgroundRepeat;
          }
          let alSeenCSSImageUrls = details.transientCache.get("CSSImageUrls");
          if (!alSeenCSSImageUrls) {
            alSeenCSSImageUrls = new Set();
            details.transientCache.set("CSSImageUrls", alSeenCSSImageUrls);
          }
          value = value.replace(used_regex, (match, g1) => {
            
            if (vars.use_other_property) {
              vars.transientCSSStylesheet.cssRules[0].style.p_ud_setProperty(vars.use_other_property, match);
              let newMatch = vars.transientCSSStylesheet.cssRules[0].style.getPropertyValue(vars.use_other_property);
              if (newMatch.startsWith("url(")) {
                g1 = newMatch.slice(5, -2);
              }
            }
            
            //changed = true;
            let link = g1.trim();
            
            options.changed = true;
            let notableInfos = {
              "uDark_cssClass": encodeURI(cssRule.selectorText),
              "uDark_backgroundRepeat": cssStyle.backgroundRepeat || vars.originalBackgroundRepeat, // Curently broken, we need to fix it
            };
            options.notableInfos = notableInfos;
            link = uDark.send_data_image_to_parser(link, false, options);
            if (!options.svgImage) {
              let oLink = link;
              if (!options.is_data_image && alSeenCSSImageUrls.has(link)) {
                // On the same request (same details), the browser will not request the same image twice, and therefore use one it fetched without sending it to imageWorker.
                link = uDark.addNocacheToStrLink(link);
              }
              alSeenCSSImageUrls.add(oLink);
              
              let usedChar = (link.includes("#") ? "" : "#") + uDark.imageSrcInfoMarker
              link += usedChar + new URLSearchParams(notableInfos).toString();
              
            }
            
            return 'url("' + link + '")';
          })
          
          if (options.changed) {
            cssStyle.p_ud_setProperty(vars.property, value);
          }
          
        }
        
        css_properties_wording_action(cssStyle, keys, details, cssRule, options) {
          // cssRule.style, wording_action, details, cssRule, options
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
                let new_value = vars.stick(value, cssStyle, cssRule, details, options);
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
                  callBack(cssStyle, cssRule, details, options, action.variables);
                });
              }
            }
            
          });
        }
        createInternalProperty = function(leType, atName, condition = true) {
          // We can search in the code for unsafe looping use of the property, and replace it by the internal property with the regex [.](?<!(o|p)_ud_)innerHTML[\s+]*?[+]?= in VSCode
          if (condition) {
            
            uDark.info("Creating internal property for", leType, atName)
            
            var originalProperty = Object.getOwnPropertyDescriptor(leType.prototype, atName);
            if (!originalProperty) {
              console.error("No existing property for '", atName, "'", leType, leType.name, leType.prototype, condition)
              return;
            }
            
            Object.defineProperty(leType.prototype, "p_ud_" + atName, originalProperty);
          }
        }
        
      }
      
      let uDark = new uDarkC();
      class AllLevels {
        
        static install=function() {
          {
            
            // Any level protected proptotypes for safe intenal use without ternaries or worries.
            CSS2Properties.prototype.p_ud_setProperty = CSS2Properties.prototype.setProperty;
            CSSStyleSheet.prototype.p_ud_replaceSync = CSSStyleSheet.prototype.replaceSync;
            CSSStyleSheet.prototype.p_ud_insertRule = CSSStyleSheet.prototype.insertRule;
            
            DOMParser.prototype.p_ud_parseFromString = DOMParser.prototype.parseFromString;
            
            uDark.createInternalProperty(Element, "innerHTML");
            uDark.createInternalProperty(ShadowRoot, "innerHTML");
            uDark.createInternalProperty(CSS2Properties, "backgroundColor");
            uDark.createInternalProperty(Navigator, "serviceWorker", navigator.serviceWorker != undefined);
            
          }
          
          {
            
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
          }
          
        }
      };
      
      
      
      
      AllLevels.install();
      Common.install();
      
      uDark.install();
      uDark.keypoint("Installed");