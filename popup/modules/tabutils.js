/**
* Determines if a site is protected by browser policies (cannot be modified by extensions)
* by attempting to execute a trivial script in the tab. If it fails, the site is protected.
* @param {object} tab - The browser tab object (must have .id).
* @returns {Promise<boolean>} True if the site is protected, false otherwise.
*/
export async function isSiteProtected(tab) {
    if (!tab || typeof tab.id === 'undefined') return false;
    try {
        // Try to execute a trivial script; if it throws, the site is protected
        await browser.scripting.executeScript(tab.id, { code: '1+1', runAt: 'document_start' });
        return false;
    } catch (e) {
        // Most likely protected by browser policy
        return true;
    }
}
// modules/tabutils.js
// Utilities for tab pattern matching and manipulation

export async function searchTabIDMatchingPatterns(tab, patterns, remove_flags = true) {
    if(remove_flags) {
        patterns = patterns.map(pattern => {
            // Remove any flags like "#ud_#all" or "#ud_#ud"
            return pattern.split("#ud_")[0].trim();
        });
    }
    let matchingPatterns = [];
    for (let pattern of patterns) {
        try {
            let matchingTabs = await browser.tabs.query({url: pattern}).catch(console.warn) || [];
            matchingTabs = matchingTabs.filter(x => x.id == tab.id);
            if (matchingTabs.length) {
                matchingPatterns.push(pattern);
            }
        } catch (error) {
            console.warn("Pattern matching error for", pattern, error);
        }
    }
    return matchingPatterns;
}
export async function getEmbedsOfTab(tab,filterfunction) {
    if (!tab || typeof tab.id === 'undefined') return [];
    let hrefResponse = await browser.tabs.executeScript(tab.id, {
        code: `(function(){return {
            href: document.location.href,
            width: window.innerWidth,
            height: window.innerHeight
        }})()`,
        allFrames: true
    }).catch(console.warn);
    if (!Array.isArray(hrefResponse)) hrefResponse = [];
    // Remove the first one (main frame)
    if (hrefResponse.length > 0) hrefResponse = hrefResponse.slice(1);
    if (filterfunction) {
        hrefResponse = hrefResponse.filter(filterfunction);
    }
    console.log("Embeds of tab:", hrefResponse);
    return hrefResponse;
}