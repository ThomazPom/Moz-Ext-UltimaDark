(() => {
    /*
     * Manual coverage matrix for ways websites can mutate <style> elements.
     *
     * Run from DevTools on a disposable page with UltimaDark enabled. The
     * original cases used to live behind `if (false)` in
     * websitesOverrideScript.js. Keeping them here prevents dead diagnostic
     * code from shipping while retaining the unusual APIs for future testing.
     */
    const host = document.createElement("div");
    host.hidden = true;
    host.dataset.udStyleMutationBench = "";
    document.documentElement.appendChild(host);

    let textNode;
    let testStyle = document.createElement("style");

    try {
        /*
         * Replacing outerHTML detaches the original node. Exercise it on a
         * separate style so the remaining cases can continue on testStyle.
         */
        const outerHTMLStyle = document.createElement("style");
        host.appendChild(outerHTMLStyle);
        outerHTMLStyle.outerHTML +=
            outerHTMLStyle.outerHTML +
            outerHTMLStyle.outerHTML.slice(0, -8) +
            ".ud-style-mutation-outerhtml-a { color: red !important; }" +
            "</style>";

        host.appendChild(testStyle);
        testStyle.classList.add("ud-style-mutation-test");
        testStyle.append(
            textNode = document.createTextNode("invalid")
        );
        testStyle.replaceChildren(
            document.createTextNode(
                ".ud-style-mutation-1 { color: red !important; }"
            )
        );

        testStyle.textContent +=
            ".ud-style-mutation-16 { color: red !important; }";
        testStyle.innerHTML +=
            ".ud-style-mutation-17 { color: red !important; }";
        testStyle.innerText +=
            ".ud-style-mutation-18 { color: red !important; }";

        /*
         * outerText replaces the element, so merely reading it documents the
         * API without terminating the rest of the matrix.
         */
        void testStyle.outerText;

        testStyle.append(
            textNode = document.createTextNode("invalid")
        );
        testStyle.replaceChild(
            document.createTextNode(
                ".ud-style-mutation-2 { color: red !important; }"
            ),
            textNode
        );
        testStyle.append(
            textNode = document.createTextNode(
                ".ud-style-mutation-3 { color: red !important; }"
            )
        );
        testStyle.prepend(
            textNode = document.createTextNode(
                ".ud-style-mutation-4 { color: red !important; }"
            )
        );

        textNode.before(
            document.createTextNode(
                ".ud-style-mutation-5 { color: red !important; }"
            )
        );
        textNode.after(
            document.createTextNode(
                ".ud-style-mutation-6 { color: red !important; }"
            )
        );
        testStyle.appendChild(
            textNode = document.createTextNode(
                ".ud-style-mutation-7 { color: red !important; }"
            )
        );
        testStyle.insertBefore(
            document.createTextNode(
                ".ud-style-mutation-8 { color: red !important; }"
            ),
            textNode
        );

        testStyle.append(
            textNode = document.createTextNode("")
        );
        testStyle.append(
            textNode = document.createTextNode("invalid")
        );
        textNode.replaceWith(
            document.createTextNode(
                ".ud-style-mutation-11 { color: red !important; }"
            )
        );

        testStyle.append(
            textNode = document.createTextNode("")
        );
        textNode.insertData(
            0,
            ".ud-style-mutation-9 { color: red !important; }"
        );
        textNode.appendData(
            ".ud-style-mutation-10 { color: red !important; }"
        );
        textNode.replaceData(
            0,
            0,
            ".ud-style-mutation-12 { color: red !important; }"
        );
        textNode.data +=
            ".ud-style-mutation-13 { color: red !important; }";
        textNode.nodeValue +=
            ".ud-style-mutation-14 { color: red !important; }";
        textNode.textContent +=
            ".ud-style-mutation-15 { color: red !important; }";

        const finalOuterHTMLStyle =
            document.createElement("style");
        host.appendChild(finalOuterHTMLStyle);
        finalOuterHTMLStyle.outerHTML +=
            finalOuterHTMLStyle.outerHTML +
            finalOuterHTMLStyle.outerHTML.slice(0, -8) +
            ".ud-style-mutation-outerhtml-b { color: red !important; }" +
            "</style>";

        const styles = [
            ...host.querySelectorAll("style"),
        ];
        const cssRuleCount = styles.reduce(
            (count, style) =>
                count +
                (
                    style.sheet
                        ? style.sheet.cssRules.length
                        : 0
                ),
            0
        );

        const result = {
            styles: styles.length,
            cssRuleCount,
            textLength: styles.reduce(
                (length, style) =>
                    length + style.textContent.length,
                0
            ),
        };

        console.table(result);
        console.log(
            "UltimaDark style mutation cases completed.",
            host
        );

        globalThis.__udStyleMutationBench = {
            host,
            result,
            cleanup() {
                host.remove();
                delete globalThis.__udStyleMutationBench;
            },
        };
    } catch (error) {
        host.remove();
        throw error;
    }
})();
