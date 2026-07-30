(async () => {
    const CFG = {
        stressRules: 1500,
        repeatedPasses: 20,
    };

    const UD =
        globalThis.uDark ??
        (
            typeof uDark !== "undefined"
                ? uDark
                : null
        );

    if (
        !UD?.CSSCommentAnchors ||
        typeof UD.edit_str !== "function"
    ) {
        throw new Error(
            "UltimaDark CSS preservation engine is not available."
        );
    }

    const results = [];
    const originalPreserveComments =
        UD.userSettings.preserve_comments;

    const detailText = value => {
        if (typeof value === "string") {
            return value;
        }

        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    };

    const test = (name, callback) => {
        const started = performance.now();

        try {
            const outcome = callback() ?? {};

            results.push({
                test: name,
                pass: outcome.ok !== false,
                ms: Number(
                    (performance.now() - started).toFixed(3)
                ),
                details: detailText(outcome.details ?? ""),
            });
        } catch (error) {
            results.push({
                test: name,
                pass: false,
                ms: Number(
                    (performance.now() - started).toFixed(3)
                ),
                details: error?.stack ?? String(error),
            });
        }
    };

    const transform = css => {
        const result = UD.edit_str(
            css,
            false,
            false,
            undefined,
            {}
        );

        if (result instanceof Error) {
            throw result;
        }

        if (typeof result !== "string") {
            throw new Error(
                `Unexpected edit_str result: ${typeof result}`
            );
        }

        return result;
    };

    const occurrences = (text, token) =>
        text.split(token).length - 1;

    const inOrder = (text, tokens) => {
        let cursor = -1;

        for (const token of tokens) {
            cursor = text.indexOf(token, cursor + 1);

            if (cursor === -1) {
                return false;
            }
        }

        return true;
    };

    const noAnchorLeak = text =>
        !text.includes("data-ud-comment-anchor");

    const parseAndMerge = css => {
        const anchors =
            new UD.CSSCommentAnchors(css);

        const sheet =
            new CSSStyleSheet();

        sheet.replaceSync(
            anchors.cleanCss
        );

        return {
            anchors,
            parsedRuleCount:
                sheet.cssRules.length,
            output:
                anchors
                    .mergeWithCssRules(
                        [...sheet.cssRules]
                    )
                    .map(rule => rule.cssText)
                    .join("\n"),
        };
    };

    const suiteStarted =
        performance.now();

    try {
        UD.userSettings.preserve_comments = true;

        test(
            "top-level comments survive in exact order",
            () => {
                const css = [
                    "/* first */",
                    ".a { color: #000; }",
                    "/* second */ /* third */",
                    ".b { background: #fff; }",
                    "/* last */",
                ].join("\n");

                const output = transform(css);
                const comments = [
                    "/* first */",
                    "/* second */",
                    "/* third */",
                    "/* last */",
                ];

                return {
                    ok:
                        comments.every(
                            comment =>
                                occurrences(
                                    output,
                                    comment
                                ) === 1
                        ) &&
                        inOrder(output, comments) &&
                        noAnchorLeak(output),

                    details: {
                        length: output.length,
                        anchorLeak:
                            !noAnchorLeak(output),
                    },
                };
            }
        );

        test(
            "CSSOM-dropped rules do not shift comments",
            () => {
                const css = [
                    "/* before */",
                    ".kept-before { color: #000; }",
                    "/* before-invalid */",
                    ":is( { color: red; }",
                    "/* after-invalid */",
                    ".kept-after { background: #fff; }",
                    "/* end */",
                ].join("\n");

                const {
                    output,
                    parsedRuleCount,
                } = parseAndMerge(css);

                const sequence = [
                    "/* before */",
                    ".kept-before",
                    "/* before-invalid */",
                    "/* after-invalid */",
                    ".kept-after",
                    "/* end */",
                ];

                return {
                    ok:
                        inOrder(output, sequence) &&
                        noAnchorLeak(output),

                    details: {
                        parsedRuleCount,
                        output,
                    },
                };
            }
        );

        test(
            "vBulletin legacy popup CSS remains structured",
            () => {
                const css = [
                    "/* CSS Document */",
                    ".popupmenu {",
                    "  *z-index: 999;",
                    "  position: relative;",
                    "}",
                    "/* see PopupMenu.set_control_style() */",
                    ".popupmenu a.popupctrl {",
                    "  _padding-right: 25px;",
                    "  background: #FFFFFF; // no stylevar",
                    "}",
                    "/* popup body */",
                    ".popupbody {",
                    "  display: none;",
                    "  position: absolute;",
                    "}",
                    ".popupmenu:hover ul.popuphover {",
                    "  display: block;",
                    "}",
                ].join("\n");

                const output = transform(css);
                const sequence = [
                    "/* CSS Document */",
                    ".popupmenu",
                    "/* see PopupMenu.set_control_style() */",
                    ".popupmenu a.popupctrl",
                    "/* popup body */",
                    ".popupbody",
                    ".popupmenu:hover ul.popuphover",
                ];

                return {
                    ok:
                        inOrder(output, sequence) &&
                        occurrences(
                            output,
                            ".popupbody"
                        ) >= 1 &&
                        noAnchorLeak(output),

                    details: {
                        length: output.length,
                        anchorLeak:
                            !noAnchorLeak(output),
                    },
                };
            }
        );

        test(
            "nested comments are not promoted",
            () => {
                const css = [
                    "/* top */",
                    ".a {",
                    "  color: #000; /* declaration comment */",
                    "}",
                    "@media screen {",
                    "  /* nested media comment */",
                    "  .b { background: #fff; }",
                    "}",
                    "/* bottom */",
                ].join("\n");

                const output = transform(css);

                return {
                    ok:
                        output.includes("/* top */") &&
                        output.includes("/* bottom */") &&
                        !output.includes(
                            "declaration comment"
                        ) &&
                        !output.includes(
                            "nested media comment"
                        ) &&
                        noAnchorLeak(output),

                    details: {
                        length: output.length,
                    },
                };
            }
        );

        test(
            "comment-looking strings and URLs stay data",
            () => {
                const css = [
                    "/* real */",
                    ".a::before {",
                    "  content: \"/* not a comment */\";",
                    "}",
                    ".b {",
                    "  background-image: url(\"data:text/plain,/*still-data*/\");",
                    "}",
                ].join("\n");

                const anchors =
                    new UD.CSSCommentAnchors(css);

                return {
                    ok:
                        anchors.comments.length === 1 &&
                        anchors.comments[0] ===
                            "/* real */" &&
                        anchors.cleanCss.includes(
                            "/* not a comment */"
                        ) &&
                        anchors.cleanCss.includes(
                            "/*still-data*/"
                        ),

                    details: {
                        preserved:
                            anchors.comments.length,
                    },
                };
            }
        );

        test(
            "selector comments remain token separators",
            () => {
                const css =
                    ".menu/**/.popup { color: #000; }";

                const anchors =
                    new UD.CSSCommentAnchors(css);

                return {
                    ok:
                        anchors.comments.length === 0 &&
                        /\.menu\s+\.popup/.test(
                            anchors.cleanCss
                        ),

                    details:
                        anchors.cleanCss,
                };
            }
        );

        test(
            "site-defined anchor-like selectors cannot collide",
            () => {
                const css = [
                    '[data-ud-comment-anchor="7"] {}',
                    '[data-ud-comment-anchor-x="8"] {}',
                    "/* preserved */",
                    ".real { color: #000; }",
                ].join("\n");

                const anchors =
                    new UD.CSSCommentAnchors(css);

                const {
                    output,
                } = parseAndMerge(css);

                return {
                    ok:
                        anchors.anchorAttribute ===
                            "data-ud-comment-anchor-x-x" &&
                        output.includes(
                            '[data-ud-comment-anchor="7"]'
                        ) &&
                        output.includes(
                            '[data-ud-comment-anchor-x="8"]'
                        ) &&
                        output.includes(
                            "/* preserved */"
                        ),

                    details: {
                        anchorAttribute:
                            anchors.anchorAttribute,
                    },
                };
            }
        );

        test(
            "unterminated comment fails without invented anchor",
            () => {
                const css =
                    ".a { color: #000; }\n/* unfinished";

                const anchors =
                    new UD.CSSCommentAnchors(css);

                return {
                    ok:
                        anchors.comments.length === 0 &&
                        anchors.cleanCss.endsWith(
                            "/* unfinished"
                        ),

                    details: {
                        preserved:
                            anchors.comments.length,
                    },
                };
            }
        );

        test(
            "repeated transformations do not leak or multiply",
            () => {
                const comments = [
                    "/* repeat-a */",
                    "/* repeat-b */",
                ];

                let output = [
                    comments[0],
                    ".a { color: #000; }",
                    comments[1],
                    ".b { background: #fff; }",
                ].join("\n");

                for (
                    let pass = 0;
                    pass < CFG.repeatedPasses;
                    pass++
                ) {
                    output = transform(output);
                }

                return {
                    ok:
                        comments.every(
                            comment =>
                                occurrences(
                                    output,
                                    comment
                                ) === 1
                        ) &&
                        noAnchorLeak(output),

                    details: {
                        passes:
                            CFG.repeatedPasses,
                        length:
                            output.length,
                    },
                };
            }
        );

        test(
            "disabled preservation leaves no machinery",
            () => {
                UD.userSettings.preserve_comments = false;

                const output = transform(
                    "/* disposable */ .a { color: #000; }"
                );

                UD.userSettings.preserve_comments = true;

                return {
                    ok:
                        !output.includes(
                            "/* disposable */"
                        ) &&
                        noAnchorLeak(output),

                    details: {
                        length: output.length,
                    },
                };
            }
        );

        test(
            "high-volume top-level comment stress",
            () => {
                const chunks = [];

                for (
                    let index = 0;
                    index < CFG.stressRules;
                    index++
                ) {
                    chunks.push(
                        `/* stress-${index} { } \" ' */`,
                        `.stress-${index}{` +
                            `color:rgb(${index % 255},0,0);` +
                            `background:#fff` +
                        "}"
                    );
                }

                const output = transform(
                    chunks.join("\n")
                );

                return {
                    ok:
                        occurrences(
                            output,
                            "/* stress-"
                        ) === CFG.stressRules &&
                        output.includes(
                            `/* stress-${CFG.stressRules - 1} `
                        ) &&
                        noAnchorLeak(output),

                    details: {
                        rules: CFG.stressRules,
                        outputLength:
                            output.length,
                    },
                };
            }
        );
    } finally {
        UD.userSettings.preserve_comments =
            originalPreserveComments;
    }

    const totalDuration =
        performance.now() -
        suiteStarted;

    const failed =
        results.filter(
            result => !result.pass
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
            Number(totalDuration.toFixed(3)),
        stressRules:
            CFG.stressRules,
        repeatedPasses:
            CFG.repeatedPasses,
    };

    console.group(
        failed.length
            ? (
                "%cUltimaDark CSS preservation bench: " +
                `${failed.length} FAIL`
            )
            : (
                "%cUltimaDark CSS preservation bench: PASS"
            ),
        `color:${failed.length ? "#ff5252" : "#00c853"};` +
            "font-weight:bold;font-size:14px"
    );

    console.table(results);
    console.table(summary);

    if (failed.length) {
        console.warn(
            "Failed tests:",
            failed
        );
    }

    console.log(
        "Configuration:",
        CFG
    );
    console.groupEnd();

    globalThis.__udCSSPreserveBench = {
        results,
        summary,
    };

    if (failed.length) {
        throw new Error(
            "UltimaDark CSS preservation stress test failed."
        );
    }
})();
