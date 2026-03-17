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
    //this.install_postLoadCheckCSSImages();

  }
  /* ============================================================
 * Background text overlap detection
 * (first-level function, no uDark.xxx assignment)
 * ------------------------------------------------------------
 * - IntersectionObserver driven
 * - No scroll listener
 * - elementsFromPoint for paint-order truth
 * - Sampling strategy:
 *   • center
 *   • vertical middle line
 *   • horizontal middle line
 *   • two diagonals
 * - Returns FULL element stack at sampled points
 * - Caches result in uDark.general_cache
 * - Supports callbackOnFound(result)
 * ============================================================ */

  registerPotentialBackgroundSelector(selector, options = {}) {

    /* ------------------------------
     * Global safety / cache init
     * ------------------------------ */
    if (!window.uDark) {
      window.uDark = {};
    }

    if (!(uDark.general_cache instanceof Map)) {
      uDark.general_cache = new Map();
    }

    if (!uDark._bgTextOverlapIO) {
      uDark._bgTextOverlapIO = null;
    }

    const cacheKey = options.cacheKey || ("bgText:" + selector);

    if (uDark.general_cache.has(cacheKey)) {
      return;
    }

    /* ------------------------------
     * Lazy IO init (once)
     * ------------------------------ */
    if (!uDark._bgTextOverlapIO) {

      uDark._bgTextOverlapIO = new IntersectionObserver(
        entries => {

          for (const entry of entries) {

            if (!entry.isIntersecting) {
              continue;
            }

            const elem = entry.target;
            const state = elem.__bgTextOverlapState;

            if (!state || state.resolved) {
              continue;
            }

            uDark.analyzeBackgroundTextOverlap(elem, state);
            uDark._bgTextOverlapIO.unobserve(elem);
          }
        },
        { root: null, threshold: 0 }
      );
    }

    /* ------------------------------
     * Attach elements
     * ------------------------------ */
    const elems = document.querySelectorAll(selector);
    if (!elems.length) {
      return;
    }

    elems.forEach(elem => {

      if (elem.__bgTextOverlapState) {
        return;
      }

      elem.__bgTextOverlapState = {
        selector,
        cacheKey,
        resolved: false,
        step: options.step || 40,
        callbackOnFound: options.callbackOnFound || null
      };

      uDark._bgTextOverlapIO.observe(elem);
    });
  }


  /* ============================================================
   * Core analyzer
   * ============================================================ */
  analyzeBackgroundTextOverlap(elem, state) {

    const rect = elem.getBoundingClientRect();

    // Must be in viewport
    if (
      rect.bottom <= 0 ||
      rect.right <= 0 ||
      rect.top >= innerHeight ||
      rect.left >= innerWidth
    ) {
      return;
    }

    const points = [];
    const step = state.step;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Center
    points.push([cx, cy]);

    // Vertical middle line
    for (let y = rect.top; y <= rect.bottom; y += step) {
      points.push([cx, y]);
    }

    // Horizontal middle line
    for (let x = rect.left; x <= rect.right; x += step) {
      points.push([x, cy]);
    }

    // Diagonal TL → BR
    for (let t = 0; t <= 1; t += step / Math.max(rect.width, rect.height)) {
      points.push([
        rect.left + rect.width * t,
        rect.top + rect.height * t
      ]);
    }

    // Diagonal BL → TR
    for (let t = 0; t <= 1; t += step / Math.max(rect.width, rect.height)) {
      points.push([
        rect.left + rect.width * t,
        rect.bottom - rect.height * t
      ]);
    }

    let hasTextOverlay = false;
    const stacks = [];

    for (const [x, y] of points) {

      if (
        x < 0 || y < 0 ||
        x > innerWidth || y > innerHeight
      ) {
        continue;
      }

      const stack = document.elementsFromPoint(x, y);

      stacks.push({
        x,
        y,
        stack
      });

      for (const node of stack) {

        if (node === elem || elem.contains(node)) {
          continue;
        }

        const text = node.innerText || node.textContent;

        if (text && text.trim().length > 0) {
          hasTextOverlay = true;
          break;
        }
      }

      if (hasTextOverlay) {
        break;
      }
    }

    const result = {
      selector: state.selector,
      element: elem,
      hasTextOverlay,
      stacks,               // FULL element stacks per sampled point
      checkedAt: performance.now()
    };

    uDark.general_cache.set(state.cacheKey, result);
    state.resolved = true;

    if (typeof state.callbackOnFound === "function") {
      try {
        state.callbackOnFound(result);
      } catch (_) {
        /* silent by design */
      }
    }
  }

  install_postLoadCheckCSSImages() {

    setTimeout(z => {
      uDark.registerPotentialBackgroundSelector(
        ".V2_global_navi .class1 dt.tab1",
        {
          callbackOnFound(result) {

            // result object
            // {
            //   selector,
            //   element,
            //   hasTextOverlay,
            //   checkedAt
            // }

            console.log(result)
          }
        }
      );
    }, 2000)

  }


}
