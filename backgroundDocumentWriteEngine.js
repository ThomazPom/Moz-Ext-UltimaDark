(() => {
  "use strict";

  uDark.createInclusiveDOMQueryScope = function (root, excludedSubtrees = false) {
    if (!root || typeof root.querySelectorAll !== "function") {
      return false;
    }

    const isInsideExcludedSubtree = node => {
      if (!excludedSubtrees) {
        return false;
      }

      for (
        let current = node;
        current && current !== root;
        current = current.parentNode
      ) {
        if (excludedSubtrees.has(current)) {
          return true;
        }
      }

      return false;
    };

    const querySelectorAll = selector => {
      const nodes = [];

      // Native querySelectorAll() never includes the query root itself.
      if (
        root instanceof Element &&
        typeof root.matches === "function" &&
        root.matches(selector)
      ) {
        nodes.push(root);
      }

      for (const node of root.querySelectorAll(selector)) {
        if (!isInsideExcludedSubtree(node)) {
          nodes.push(node);
        }
      }

      return nodes;
    };

    return {
      querySelectorAll,
      querySelector(selector) {
        return querySelectorAll(selector)[0] || null;
      }
    };
  };

  uDark.transformDOMSubtree = function (root, details, options = {}) {
    const result = {
      svgElements: []
    };

    if (!root || typeof root.querySelectorAll !== "function") {
      return result;
    }

    if (root instanceof SVGElement) {
      uDark.frontEditSVG(root, details);
      return result;
    }

    const scope = uDark.createInclusiveDOMQueryScope(
      root,
      options.excludedSubtrees
    );

    if (!scope) {
      return result;
    }

    result.svgElements = uDark.processSvgElements(scope, details);

    uDark.edit_styles_attributes(scope, details, options);
    uDark.edit_styles_elements(
      scope,
      details,
      "ud-edited-background",
      options
    );

    uDark.processLinks(scope);
    uDark.processImages(scope);
    uDark.processIframes(scope, details, options);
    uDark.processColoredItems(scope);

    if (!options.deferSvgRestore) {
      uDark.restoreSvgElements(result.svgElements);
    }

    if (!options.deferIntegrityRestore) {
      uDark.restoreIntegrityAttributes(scope);
    }

    return result;
  };

  uDark.frontEditHTML = function (elem, strO, details, options = {}) {
    if (!(strO instanceof String || typeof strO === "string")) {
      return strO;
    }

    let str = strO;

    if (elem instanceof HTMLScriptElement) {
      return strO;
    }

    if (elem instanceof HTMLStyleElement || elem instanceof SVGStyleElement) {
      return uDark.edit_str(str, false, false, undefined, false, options);
    }

    let parsedDocument;
    let aDocument;

    if (options.STRICT_XML) {
      parsedDocument = uDark.createDocumentFromHtml(str, options.STRICT_XML);
      aDocument = parsedDocument;
    } else {
      str = str.protect_simple(
        uDark.tagsToProtectRegex,
        "$1ud-tag-ptd-$2"
      );

      parsedDocument = uDark.createDocumentFromHtml("<html><head>" + str);

      options.ptd_head =
        parsedDocument.getElementsByTagName("ud-tag-ptd-head")[0];

      if (options.ptd_head) {
        parsedDocument.head.p_ud_innerHTML =
          parsedDocument.head.p_ud_innerHTML + options.ptd_head.innerHTML;

        options.ptd_head.remove();
      }

      aDocument = parsedDocument;
    }

    uDark.transformDOMSubtree(aDocument, details, options);

    let resultEdited;

    if (options.STRICT_XML) {
      resultEdited = aDocument.documentElement.outerHTML.trim();
    } else if (options.ptd_head) {
      resultEdited = aDocument.documentElement.outerHTML.trim();
    } else {
      resultEdited =
        aDocument.head.innerHTML + aDocument.body.innerHTML.trim();
    }

    return resultEdited.unprotect_simple("ud-tag-ptd-");
  };

  uDark.transformADocumentBackend = function (
    aDocument,
    parsedDocument,
    details
  ) {
    aDocument
      .querySelectorAll("meta[http-equiv=content-security-policy]")
      .forEach(meta => {
        const item = {
          value: meta.getAttribute("content")
        };

        if (item.value && item.value.trim().length) {
          uDark.headersDo["content-security-policy"](item, details, 1);
          meta.setAttribute("content", item.value);
        }
      });

    if (!details.debugParsing) {
      const transformedSubtree = uDark.transformDOMSubtree(
        aDocument,
        details,
        {
          deferSvgRestore: true,
          deferIntegrityRestore: true
        }
      );

      // Backend-only operation. Do not run it for document.write subtrees.
      uDark.injectStylesIfNeeded(parsedDocument, details);

      // Preserve the historical backend operation order.
      uDark.restoreSvgElements(transformedSubtree.svgElements);
      uDark.markUnclosedForms(parsedDocument);
    }

    // Historically this also runs when debugParsing is enabled.
    uDark.restoreIntegrityAttributes(aDocument);

    aDocument.querySelectorAll("template").forEach(template => {
      if (template.content instanceof DocumentFragment) {
        uDark.transformADocumentBackend(
          template.content,
          parsedDocument,
          details
        );
      }
    });
  };

  uDark.installDocumentWriteEngine = function () {
    if (uDark.documentWriteEngineInstalled) {
      return;
    }

    uDark.documentWriteEngineInstalled = true;

    const P = Document.prototype;

    const originalOpen = P.open;
    const originalWrite = P.write;
    const originalWriteln = P.writeln;
    const originalClose = P.close;

    const documentStates = new WeakMap();

    const createState = () => ({
      editedSubtrees: new WeakSet(),
      processing: false,
      closed: false
    });

    function getState(doc) {
      let state = documentStates.get(doc);

      if (!state) {
        state = createState();
        documentStates.set(doc, state);
      }

      return state;
    }

    function resetState(doc) {
      documentStates.set(doc, createState());
    }

    function frontEditDOMSubtree(root, state) {
      if (!(root instanceof Element)) {
        return;
      }

      if (state.editedSubtrees.has(root)) {
        return;
      }

      try {
        uDark.transformDOMSubtree(root, undefined, {
          fromDocumentWrite: true,
          excludedSubtrees: state.editedSubtrees
        });

        state.editedSubtrees.add(root);
      } catch (error) {
        console.error(
          "[UltimaDark document.write] Subtree edit failed",
          root,
          error
        );
      }
    }

    function processStableBranches(root, state) {
      let parent = root;

      while (parent instanceof Element) {
        const children = parent.children;
        const count = children.length;

        if (count === 0) {
          return;
        }

        for (let i = 0; i < count - 1; i++) {
          frontEditDOMSubtree(children[i], state);
        }

        parent = children[count - 1];
      }
    }

    function processWrittenDocument(doc, final = false) {
      const state = getState(doc);

      if (state.processing) {
        return;
      }

      state.processing = true;

      try {
        if (final) {
          if (doc.head) {
            for (const child of [...doc.head.children]) {
              frontEditDOMSubtree(child, state);
            }
          }

          if (doc.body) {
            for (const child of [...doc.body.children]) {
              frontEditDOMSubtree(child, state);
            }
          }

          state.closed = true;
          return;
        }

        if (doc.head) {
          processStableBranches(doc.head, state);
        }

        if (doc.body) {
          processStableBranches(doc.body, state);
        }
      } finally {
        state.processing = false;
      }
    }

    Object.defineProperty(P, "open", {
      configurable: true,
      writable: true,
      value: function open(...args) {
        const result = originalOpen.apply(this, args);
        resetState(this);
        return result;
      }
    });

    Object.defineProperty(P, "write", {
      configurable: true,
      writable: true,
      value: function write(...args) {
        const result = originalWrite.apply(this, args);
        processWrittenDocument(this, false);
        return result;
      }
    });

    Object.defineProperty(P, "writeln", {
      configurable: true,
      writable: true,
      value: function writeln(...args) {
        const result = originalWriteln.apply(this, args);
        processWrittenDocument(this, false);
        return result;
      }
    });

    Object.defineProperty(P, "close", {
      configurable: true,
      writable: true,
      value: function close(...args) {
        const result = originalClose.apply(this, args);
        processWrittenDocument(this, true);
        return result;
      }
    });

    uDark.log("document.write support installed");
  };

  uDark.installDocumentWriteEngine();
})();
