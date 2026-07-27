/*
 * Keep the backend-only page style injection outside transformDOMSubtree().
 *
 * transformDOMSubtree() is also used for document.write() subtrees, where the
 * global page styles must not be injected repeatedly. The backend entry point
 * still needs its original injectStylesIfNeeded() call once the complete
 * parsed document has been transformed.
 */
{
  const transformADocumentBackend = uDark.transformADocumentBackend.bind(uDark);

  uDark.transformADocumentBackend = function (aDocument, parsedDocument, details) {
    const result = transformADocumentBackend(aDocument, parsedDocument, details);

    if (
      !details.debugParsing &&
      aDocument === parsedDocument.documentElement
    ) {
      uDark.injectStylesIfNeeded(parsedDocument, details);
    }

    return result;
  };
}
