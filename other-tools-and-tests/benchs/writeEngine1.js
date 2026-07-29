(async () => {
    const CFG = {
        tinyWrites: 250,
        manyRoots: 80,
        documents: 12,
        writesPerDocument: 30,

        testReentrancy: true,
        testFailureRecovery: true,

        /*
         * true permet d'inspecter ensuite :
         * __udWriteBenchArtifacts
         */
        keepArtifacts: false
    };

    const UD =
        globalThis.uDark ??
        (
            typeof uDark !== "undefined"
                ? uDark
                : null
        );

    if (!UD?.transformDOMSubtree) {
        throw new Error(
            "UltimaDark introuvable : " +
            "uDark.transformDOMSubtree n'est pas accessible."
        );
    }

    const hostId =
        `ud-write-bench-${Date.now().toString(36)}`;

    /*
     * Les styles éventuellement adoptés ciblent uniquement
     * cet élément caché, afin de ne pas modifier la page.
     */
    const host =
        document.createElement("div");

    host.id = hostId;
    host.hidden = true;

    host.setAttribute(
        "data-ud-write-bench-host",
        ""
    );

    document.documentElement.appendChild(
        host
    );

    const selector =
        `#${hostId}`;

    const docs = [];
    const results = [];

    const metrics = {
        transformCalls: 0,
        transformTimeMs: 0,
        maxTransformTimeMs: 0,

        expectedThrows: 0,
        reentrantWrites: 0,
        reentrantCloses: 0,

        totalWriteCalls: 0
    };

    /*
     * Instrumentation temporaire de transformDOMSubtree().
     */
    const originalTransform =
        UD.transformDOMSubtree;

    const originalTransformDescriptor =
        Object.getOwnPropertyDescriptor(
            UD,
            "transformDOMSubtree"
        );

    const throwTriggered =
        new WeakSet();

    const writeTriggered =
        new WeakSet();

    const closeTriggered =
        new WeakSet();

    const containsMarker = (
        root,
        attribute
    ) =>
        root instanceof Element &&
        (
            root.hasAttribute(attribute) ||
            Boolean(
                root.querySelector(
                    `[${attribute}]`
                )
            )
        );

    const instrumentedTransform =
        new Proxy(
            originalTransform,
            {
                apply(
                    target,
                    thisArg,
                    args
                ) {
                    const root =
                        args[0];

                    const doc =
                        root?.ownerDocument;

                    metrics.transformCalls++;

                    /*
                     * Échec volontaire, une seule fois
                     * pour ce Document.
                     */
                    if (
                        CFG.testFailureRecovery &&
                        doc &&
                        containsMarker(
                            root,
                            "data-ud-bench-throw-once"
                        ) &&
                        !throwTriggered.has(doc)
                    ) {
                        throwTriggered.add(doc);

                        metrics.expectedThrows++;

                        throw new Error(
                            "[UltimaDark write bench] " +
                            "erreur volontaire, une seule fois"
                        );
                    }

                    /*
                     * document.write() déclenché pendant
                     * transformDOMSubtree().
                     */
                    if (
                        CFG.testReentrancy &&
                        doc &&
                        containsMarker(
                            root,
                            "data-ud-bench-reentrant-write"
                        ) &&
                        !writeTriggered.has(doc)
                    ) {
                        writeTriggered.add(doc);

                        metrics.reentrantWrites++;
                        metrics.totalWriteCalls++;

                        doc.write(
                            `<span ` +
                            `data-ud-reentrant-result ` +
                            `style="background:#fff;color:#000">` +
                            `nested write` +
                            `</span>`
                        );
                    }

                    /*
                     * document.close() déclenché pendant
                     * transformDOMSubtree().
                     */
                    if (
                        CFG.testReentrancy &&
                        doc &&
                        containsMarker(
                            root,
                            "data-ud-bench-reentrant-close"
                        ) &&
                        !closeTriggered.has(doc)
                    ) {
                        closeTriggered.add(doc);

                        metrics.reentrantCloses++;

                        doc.close();
                    }

                    const start =
                        performance.now();

                    try {
                        return Reflect.apply(
                            target,
                            thisArg,
                            args
                        );
                    } finally {
                        const duration =
                            performance.now() -
                            start;

                        metrics.transformTimeMs +=
                            duration;

                        metrics.maxTransformTimeMs =
                            Math.max(
                                metrics.maxTransformTimeMs,
                                duration
                            );
                    }
                },

                get(
                    target,
                    property,
                    receiver
                ) {
                    if (
                        property ===
                        "toString"
                    ) {
                        return Function.prototype
                            .toString
                            .bind(target);
                    }

                    return Reflect.get(
                        target,
                        property,
                        receiver
                    );
                }
            }
        );

    UD.transformDOMSubtree =
        instrumentedTransform;

    const createDocument = name => {
        const doc =
            document.implementation
                .createHTMLDocument(name);

        docs.push(doc);

        return doc;
    };

    const write = (
        doc,
        ...chunks
    ) => {
        for (const chunk of chunks) {
            metrics.totalWriteCalls++;

            doc.write(chunk);
        }
    };

    const writeln = (
        doc,
        ...chunks
    ) => {
        for (const chunk of chunks) {
            metrics.totalWriteCalls++;

            doc.writeln(chunk);
        }
    };

    const noNestedTransform = text =>
        !/hsl\(from\s+hsl\(from/i.test(
            text ?? ""
        );

    const markerCount = text =>
        (
            text?.match(
                /\/\*edited\*\//g
            ) ?? []
        ).length;

    const styleChanged = (
        style,
        rawText
    ) =>
        style instanceof HTMLStyleElement &&
        style.textContent !== rawText;

    const inlineChanged = (
        element,
        rawText
    ) =>
        element instanceof Element &&
        element.getAttribute("style") !==
            rawText;

    const detailText = value => {
        if (
            typeof value === "string"
        ) {
            return value;
        }

        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    };

    const test = (
        name,
        callback
    ) => {
        const started =
            performance.now();

        try {
            const outcome =
                callback() ?? {};

            const passed =
                outcome.ok !== false;

            results.push({
                test: name,
                pass: passed,

                ms: Number(
                    (
                        performance.now() -
                        started
                    ).toFixed(3)
                ),

                details:
                    detailText(
                        outcome.details ?? ""
                    )
            });
        } catch (error) {
            results.push({
                test: name,
                pass: false,

                ms: Number(
                    (
                        performance.now() -
                        started
                    ).toFixed(3)
                ),

                details:
                    error?.stack ??
                    String(error)
            });
        }
    };

    const suiteStarted =
        performance.now();

    try {
        /*
         * 1. Écriture simple.
         */
        test(
            "write simple",
            () => {
                const doc =
                    createDocument(
                        "simple"
                    );

                const css =
                    `${selector}{` +
                    `background:#fff;` +
                    `color:#000` +
                    `}`;

                const inline =
                    "background:#fff;color:#000";

                write(
                    doc,

                    `<style data-ud-case="simple">` +
                    `${css}` +
                    `</style>`,

                    `<div ` +
                    `data-ud-simple ` +
                    `style="${inline}">` +
                    `simple` +
                    `</div>`
                );

                const style =
                    doc.querySelector(
                        'style[data-ud-case="simple"]'
                    );

                const div =
                    doc.querySelector(
                        "[data-ud-simple]"
                    );

                return {
                    ok:
                        styleChanged(
                            style,
                            css
                        ) &&
                        inlineChanged(
                            div,
                            inline
                        ) &&
                        noNestedTransform(
                            style?.textContent
                        ),

                    details: {
                        styleChanged:
                            styleChanged(
                                style,
                                css
                            ),

                        inlineChanged:
                            inlineChanged(
                                div,
                                inline
                            ),

                        markers:
                            markerCount(
                                style?.textContent
                            )
                    }
                };
            }
        );

        /*
         * 2. Un même style réparti sur trois write().
         */
        test(
            "style fragmenté",
            () => {
                const doc =
                    createDocument(
                        "fragmented-style"
                    );

                const css =
                    `${selector}{` +
                    `background:#fff;` +
                    `color:#000;` +
                    `border:1px solid #fff` +
                    `}`;

                write(
                    doc,

                    `<style ` +
                    `data-ud-case="fragmented">` +
                    `${selector}{background:#fff`,

                    `;color:#000`,

                    `;border:1px solid #fff}` +
                    `</style>`
                );

                const style =
                    doc.querySelector(
                        'style[data-ud-case="fragmented"]'
                    );

                return {
                    ok:
                        styleChanged(
                            style,
                            css
                        ) &&
                        noNestedTransform(
                            style?.textContent
                        ) &&
                        markerCount(
                            style?.textContent
                        ) <= 1,

                    details: {
                        changed:
                            styleChanged(
                                style,
                                css
                            ),

                        nested:
                            !noNestedTransform(
                                style?.textContent
                            ),

                        markers:
                            markerCount(
                                style?.textContent
                            ),

                        length:
                            style?.textContent.length
                    }
                };
            }
        );

        /*
         * 3. La racine quitte le Document temporaire,
         * puis le parser continue à écrire dedans.
         */
        test(
            "branche adoptée puis continuée",
            () => {
                const doc =
                    createDocument(
                        "adopted-branch"
                    );

                const css =
                    `${selector}{` +
                    `background:#fff;` +
                    `color:#000` +
                    `}`;

                const inline =
                    "background:#fff;color:#000";

                write(
                    doc,

                    `<div data-ud-exported>` +
                    `<style data-ud-case="adopted">` +
                    `${selector}{background:#fff`
                );

                const exported =
                    doc.body.firstElementChild;

                host.appendChild(
                    exported
                );

                write(
                    doc,

                    `;color:#000}` +
                    `</style>` +

                    `<span ` +
                    `data-ud-adopted-sibling ` +
                    `style="${inline}">` +
                    `sibling` +
                    `</span>` +

                    `</div>`
                );

                const style =
                    exported.querySelector(
                        'style[data-ud-case="adopted"]'
                    );

                const sibling =
                    exported.querySelector(
                        "[data-ud-adopted-sibling]"
                    );

                return {
                    ok:
                        exported.ownerDocument ===
                            document &&

                        style?.ownerDocument ===
                            document &&

                        sibling?.ownerDocument ===
                            document &&

                        styleChanged(
                            style,
                            css
                        ) &&

                        inlineChanged(
                            sibling,
                            inline
                        ) &&

                        noNestedTransform(
                            style?.textContent
                        ),

                    details: {
                        exported:
                            exported.ownerDocument ===
                            document,

                        siblingCreated:
                            Boolean(sibling),

                        styleChanged:
                            styleChanged(
                                style,
                                css
                            ),

                        siblingChanged:
                            inlineChanged(
                                sibling,
                                inline
                            )
                    }
                };
            }
        );

        /*
         * 4. Fin d'un style puis création d'un frère
         * dans le même chunk.
         */
        test(
            "fermeture style + frère même chunk",
            () => {
                const doc =
                    createDocument(
                        "style-and-sibling"
                    );

                const css =
                    `${selector}{` +
                    `background:#fff;` +
                    `color:#000` +
                    `}`;

                const inline =
                    "background:#fff";

                write(
                    doc,

                    `<div>` +
                    `<style data-ud-case="same-chunk">` +
                    `${selector}{background:#fff`,

                    `;color:#000}` +
                    `</style>` +

                    `<span ` +
                    `data-ud-same-chunk ` +
                    `style="${inline}">` +
                    `X` +
                    `</span>` +

                    `</div>`
                );

                const style =
                    doc.querySelector(
                        'style[data-ud-case="same-chunk"]'
                    );

                const sibling =
                    doc.querySelector(
                        "[data-ud-same-chunk]"
                    );

                return {
                    ok:
                        styleChanged(
                            style,
                            css
                        ) &&

                        inlineChanged(
                            sibling,
                            inline
                        ) &&

                        noNestedTransform(
                            style?.textContent
                        ),

                    details: {
                        styleChanged:
                            styleChanged(
                                style,
                                css
                            ),

                        siblingChanged:
                            inlineChanged(
                                sibling,
                                inline
                            )
                    }
                };
            }
        );

        /*
         * 5. writeln().
         */
        test(
            "writeln",
            () => {
                const doc =
                    createDocument(
                        "writeln"
                    );

                const css =
                    `${selector}{` +
                    `background:#fff;` +
                    `color:#000` +
                    `}`;

                writeln(
                    doc,

                    `<style data-ud-case="writeln">` +
                    `${css}` +
                    `</style>`
                );

                const style =
                    doc.querySelector(
                        'style[data-ud-case="writeln"]'
                    );

                return {
                    ok:
                        styleChanged(
                            style,
                            css
                        ) &&

                        noNestedTransform(
                            style?.textContent
                        ),

                    details: {
                        changed:
                            styleChanged(
                                style,
                                css
                            ),

                        markers:
                            markerCount(
                                style?.textContent
                            )
                    }
                };
            }
        );

        /*
         * 6. Frontières indépendantes du head et du body.
         */
        test(
            "head et body",
            () => {
                const doc =
                    createDocument(
                        "head-body"
                    );

                const headCss =
                    `${selector}{` +
                    `background:#fff;` +
                    `color:#000` +
                    `}`;

                const inline =
                    "background:#fff;color:#000";

                doc.open();

                write(
                    doc,

                    `<!doctype html>` +
                    `<html><head>`,

                    `<style data-ud-case="head">` +
                    `${selector}{background:#fff`,

                    `;color:#000}` +
                    `</style>` +
                    `</head><body>`,

                    `<div ` +
                    `data-ud-body ` +
                    `style="${inline}">` +
                    `body` +
                    `</div>`,

                    `</body></html>`
                );

                doc.close();

                const style =
                    doc.head.querySelector(
                        'style[data-ud-case="head"]'
                    );

                const bodyNode =
                    doc.body.querySelector(
                        "[data-ud-body]"
                    );

                return {
                    ok:
                        styleChanged(
                            style,
                            headCss
                        ) &&

                        inlineChanged(
                            bodyNode,
                            inline
                        ) &&

                        noNestedTransform(
                            style?.textContent
                        ),

                    details: {
                        headChanged:
                            styleChanged(
                                style,
                                headCss
                            ),

                        bodyChanged:
                            inlineChanged(
                                bodyNode,
                                inline
                            )
                    }
                };
            }
        );

        /*
         * 7. document.open() réinitialise la session.
         */
        test(
            "document.open reset",
            () => {
                const doc =
                    createDocument(
                        "open-reset"
                    );

                write(
                    doc,

                    `<style data-ud-old>` +
                    `${selector}{color:#fff}` +
                    `</style>`
                );

                doc.open();

                const css =
                    `${selector}{` +
                    `background:#fff;` +
                    `color:#000` +
                    `}`;

                write(
                    doc,

                    `<style data-ud-case="after-open">` +
                    `${css}` +
                    `</style>`
                );

                doc.close();

                const style =
                    doc.querySelector(
                        'style[data-ud-case="after-open"]'
                    );

                return {
                    ok:
                        !doc.querySelector(
                            "[data-ud-old]"
                        ) &&

                        styleChanged(
                            style,
                            css
                        ) &&

                        noNestedTransform(
                            style?.textContent
                        ),

                    details: {
                        oldRemoved:
                            !doc.querySelector(
                                "[data-ud-old]"
                            ),

                        newChanged:
                            styleChanged(
                                style,
                                css
                            )
                    }
                };
            }
        );

        /*
         * 8. Une transformation échoue une fois,
         * puis doit réussir au write suivant.
         */
        if (
            CFG.testFailureRecovery
        ) {
            test(
                "échec puis retry",
                () => {
                    const doc =
                        createDocument(
                            "failure-retry"
                        );

                    const css =
                        `${selector}{` +
                        `background:#fff;` +
                        `color:#000` +
                        `}`;

                    write(
                        doc,

                        `<div ` +
                        `data-ud-bench-throw-once>` +

                        `<style data-ud-case="retry">` +
                        `${css}` +
                        `</style>`
                    );

                    write(
                        doc,

                        `<span ` +
                        `data-ud-after-retry ` +
                        `style="color:#fff">` +
                        `retry` +
                        `</span>` +

                        `</div>`
                    );

                    const style =
                        doc.querySelector(
                            'style[data-ud-case="retry"]'
                        );

                    const span =
                        doc.querySelector(
                            "[data-ud-after-retry]"
                        );

                    return {
                        ok:
                            metrics.expectedThrows >=
                                1 &&

                            styleChanged(
                                style,
                                css
                            ) &&

                            inlineChanged(
                                span,
                                "color:#fff"
                            ) &&

                            noNestedTransform(
                                style?.textContent
                            ),

                        details: {
                            expectedThrows:
                                metrics.expectedThrows,

                            styleRecovered:
                                styleChanged(
                                    style,
                                    css
                                ),

                            followingNodeChanged:
                                inlineChanged(
                                    span,
                                    "color:#fff"
                                )
                        }
                    };
                }
            );
        }

        /*
         * 9. Réentrance.
         */
        if (
            CFG.testReentrancy
        ) {
            test(
                "write réentrant",
                () => {
                    const doc =
                        createDocument(
                            "reentrant-write"
                        );

                    write(
                        doc,

                        `<div ` +
                        `data-ud-bench-reentrant-write>` +

                        `<style>` +
                        `${selector}{` +
                        `background:#fff;` +
                        `color:#000` +
                        `}` +
                        `</style>` +

                        `</div>`
                    );

                    const nested =
                        doc.querySelector(
                            "[data-ud-reentrant-result]"
                        );

                    return {
                        ok:
                            metrics.reentrantWrites >=
                                1 &&

                            inlineChanged(
                                nested,
                                "background:#fff;color:#000"
                            ),

                        details: {
                            reentrantWrites:
                                metrics.reentrantWrites,

                            nestedCreated:
                                Boolean(nested),

                            nestedChanged:
                                inlineChanged(
                                    nested,
                                    "background:#fff;color:#000"
                                )
                        }
                    };
                }
            );

            test(
                "close réentrant",
                () => {
                    const doc =
                        createDocument(
                            "reentrant-close"
                        );

                    write(
                        doc,

                        `<div ` +
                        `data-ud-bench-reentrant-close>` +

                        `<style>` +
                        `${selector}{background:#fff}` +
                        `</style>` +

                        `</div>`
                    );

                    /*
                     * Nouvelle session après le close réentrant.
                     */
                    const css =
                        `${selector}{` +
                        `color:#fff;` +
                        `background:#000` +
                        `}`;

                    write(
                        doc,

                        `<style ` +
                        `data-ud-case="after-reentrant-close">` +
                        `${css}` +
                        `</style>`
                    );

                    const style =
                        doc.querySelector(
                            'style[' +
                            'data-ud-case=' +
                            '"after-reentrant-close"' +
                            ']'
                        );

                    return {
                        ok:
                            metrics.reentrantCloses >=
                                1 &&

                            styleChanged(
                                style,
                                css
                            ) &&

                            noNestedTransform(
                                style?.textContent
                            ),

                        details: {
                            reentrantCloses:
                                metrics.reentrantCloses,

                            nextSessionChanged:
                                styleChanged(
                                    style,
                                    css
                                )
                        }
                    };
                }
            );
        }

        /*
         * 10. Beaucoup de racines ajoutées d'un coup.
         */
        test(
            "beaucoup de racines",
            () => {
                const doc =
                    createDocument(
                        "many-roots"
                    );

                const rawInline =
                    "background:#fff;color:#000";

                const html =
                    Array.from(
                        {
                            length:
                                CFG.manyRoots
                        },

                        (
                            _,
                            index
                        ) =>
                            `<div ` +
                            `data-ud-many="${index}" ` +
                            `style="${rawInline}">` +
                            `${index}` +
                            `</div>`
                    ).join("");

                write(
                    doc,
                    html
                );

                const nodes = [
                    ...doc.querySelectorAll(
                        "[data-ud-many]"
                    )
                ];

                const changed =
                    nodes.filter(
                        node =>
                            inlineChanged(
                                node,
                                rawInline
                            )
                    ).length;

                return {
                    ok:
                        nodes.length ===
                            CFG.manyRoots &&

                        changed ===
                            CFG.manyRoots,

                    details: {
                        expected:
                            CFG.manyRoots,

                        found:
                            nodes.length,

                        changed
                    }
                };
            }
        );

        /*
         * 11. Beaucoup de minuscules writes dans un style.
         */
        test(
            "bench petits writes",
            () => {
                const doc =
                    createDocument(
                        "tiny-writes"
                    );

                const rawCss =
                    `${selector}{` +

                    Array.from(
                        {
                            length:
                                CFG.tinyWrites
                        },

                        (
                            _,
                            index
                        ) =>
                            `--ud-bench-${index}:${index};`
                    ).join("") +

                    `background:#fff;` +
                    `color:#000` +
                    `}`;

                const started =
                    performance.now();

                write(
                    doc,

                    `<style data-ud-case="tiny">` +
                    `${selector}{`
                );

                for (
                    let index = 0;
                    index < CFG.tinyWrites;
                    index++
                ) {
                    write(
                        doc,

                        `--ud-bench-${index}:${index};`
                    );
                }

                write(
                    doc,

                    `background:#fff;` +
                    `color:#000}` +
                    `</style>`
                );

                const duration =
                    performance.now() -
                    started;

                const style =
                    doc.querySelector(
                        'style[data-ud-case="tiny"]'
                    );

                return {
                    ok:
                        styleChanged(
                            style,
                            rawCss
                        ) &&

                        noNestedTransform(
                            style?.textContent
                        ) &&

                        markerCount(
                            style?.textContent
                        ) <= 1,

                    details: {
                        writes:
                            CFG.tinyWrites + 2,

                        durationMs:
                            Number(
                                duration.toFixed(3)
                            ),

                        writesPerSecond:
                            Number(
                                (
                                    (
                                        CFG.tinyWrites +
                                        2
                                    ) /
                                    duration *
                                    1000
                                ).toFixed(1)
                            ),

                        markers:
                            markerCount(
                                style?.textContent
                            ),

                        nested:
                            !noNestedTransform(
                                style?.textContent
                            )
                    }
                };
            }
        );

        /*
         * 12. Plusieurs Documents avec chacun beaucoup
         * de petits writes.
         */
        test(
            "plusieurs documents",
            () => {
                const started =
                    performance.now();

                let changed = 0;

                for (
                    let documentIndex = 0;
                    documentIndex <
                        CFG.documents;
                    documentIndex++
                ) {
                    const doc =
                        createDocument(
                            `multi-${documentIndex}`
                        );

                    const css =
                        `${selector}{` +

                        Array.from(
                            {
                                length:
                                    CFG.writesPerDocument
                            },

                            (
                                _,
                                index
                            ) =>
                                `--d${documentIndex}-${index}:` +
                                `${index};`
                        ).join("") +

                        `background:#fff` +
                        `}`;

                    write(
                        doc,

                        `<style ` +
                        `data-ud-multi="${documentIndex}">` +
                        `${selector}{`
                    );

                    for (
                        let writeIndex = 0;
                        writeIndex <
                            CFG.writesPerDocument;
                        writeIndex++
                    ) {
                        write(
                            doc,

                            `--d${documentIndex}-${writeIndex}:` +
                            `${writeIndex};`
                        );
                    }

                    write(
                        doc,

                        `background:#fff}` +
                        `</style>`
                    );

                    const style =
                        doc.querySelector(
                            `style[` +
                            `data-ud-multi="${documentIndex}"` +
                            `]`
                        );

                    if (
                        styleChanged(
                            style,
                            css
                        ) &&
                        noNestedTransform(
                            style?.textContent
                        )
                    ) {
                        changed++;
                    }
                }

                const duration =
                    performance.now() -
                    started;

                return {
                    ok:
                        changed ===
                        CFG.documents,

                    details: {
                        documents:
                            CFG.documents,

                        writesPerDocument:
                            CFG.writesPerDocument +
                            2,

                        changed,

                        durationMs:
                            Number(
                                duration.toFixed(3)
                            )
                    }
                };
            }
        );

        /*
         * Audit global de tous les styles produits.
         */
        const allStyles = [
            ...host.querySelectorAll(
                "style"
            ),

            ...docs.flatMap(
                doc => [
                    ...doc.querySelectorAll(
                        "style"
                    )
                ]
            )
        ];

        const nestedStyles =
            allStyles.filter(
                style =>
                    !noNestedTransform(
                        style.textContent
                    )
            );

        const repeatedMarkerStyles =
            allStyles.filter(
                style =>
                    markerCount(
                        style.textContent
                    ) > 1
            );

        results.push({
            test:
                "audit transformations imbriquées",

            pass:
                nestedStyles.length === 0 &&
                repeatedMarkerStyles.length ===
                    0,

            ms: 0,

            details:
                detailText({
                    styles:
                        allStyles.length,

                    nestedStyles:
                        nestedStyles.length,

                    repeatedMarkerStyles:
                        repeatedMarkerStyles.length
                })
        });
    } finally {
        /*
         * Toujours restaurer la vraie méthode UltimaDark.
         */
        if (
            originalTransformDescriptor
        ) {
            Object.defineProperty(
                UD,
                "transformDOMSubtree",
                originalTransformDescriptor
            );
        } else {
            UD.transformDOMSubtree =
                originalTransform;
        }
    }

    const totalDuration =
        performance.now() -
        suiteStarted;

    const failed =
        results.filter(
            result =>
                !result.pass
        );

    const summary = {
        passed:
            results.length -
            failed.length,

        failed:
            failed.length,

        tests:
            results.length,

        totalDurationMs:
            Number(
                totalDuration.toFixed(3)
            ),

        totalWriteCalls:
            metrics.totalWriteCalls,

        transformCalls:
            metrics.transformCalls,

        transformTimeMs:
            Number(
                metrics.transformTimeMs
                    .toFixed(3)
            ),

        maxTransformTimeMs:
            Number(
                metrics.maxTransformTimeMs
                    .toFixed(3)
            ),

        expectedThrows:
            metrics.expectedThrows,

        reentrantWrites:
            metrics.reentrantWrites,

        reentrantCloses:
            metrics.reentrantCloses
    };

    console.group(
        failed.length
            ? (
                `%cUltimaDark document.write bench: ` +
                `${failed.length} FAIL`
            )
            : (
                "%cUltimaDark document.write bench: PASS"
            ),

        `color:${
            failed.length
                ? "#ff5252"
                : "#00c853"
        };font-weight:bold;font-size:14px`
    );

    console.table(
        results
    );

    console.table(
        summary
    );

    if (
        failed.length
    ) {
        console.warn(
            "Tests en échec :",
            failed
        );
    }

    console.log(
        "Configuration :",
        CFG
    );

    console.groupEnd();

    const report = {
        config: CFG,
        results,
        summary,
        metrics,
        failed
    };

    /*
     * Résultat toujours disponible après exécution.
     */
    globalThis.__udWriteBenchResult =
        report;

    if (
        CFG.keepArtifacts
    ) {
        globalThis.__udWriteBenchArtifacts = {
            host,
            docs
        };

        console.log(
            "Artefacts conservés dans " +
            "__udWriteBenchArtifacts"
        );
    } else {
        host.remove();

        docs.length = 0;
    }

    return report;
})();