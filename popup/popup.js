// Import Alpine.js and Bootstrap
import Alpine from "alpinejs";
import 'bootstrap'; // Pour les composants JS (nécessite Popper.js)
import 'bootstrap/dist/css/bootstrap.min.css'; // Pour le CSS de Bootstrap
import 'bootstrap-icons/font/bootstrap-icons.css'; // Pour les icônes Bootstrap
import { renderLightnessPlot } from "./modules/lightnessPlot.js";

// Import the store module
import "./modules/store.js";
import "./modules/modals.js";




// Initialize Alpine and register patternInput
window.Alpine = Alpine;
Alpine.data('patternInput', () => ({
  customPattern: '',
  customFlag: '',
  get suggestions() {
    return Alpine.store('app').getSuggestedPatterns();
  },
  async add() {
    const pattern = this.customPattern + (this.customFlag ? this.customFlag : '');
    if (pattern.trim()) {
      await Alpine.store('app').addExclusionPattern(pattern);
      this.customPattern = '';
      this.customFlag = '';
    }
  }
}));

let myPort = browser.runtime.connect({name:"port-from-popup"});
console.log('Popup script loaded!');

Alpine.start();
let alpineStore = Alpine.store("app");

import { searchTabIDMatchingPatterns, isSiteProtected , getEmbedsOfTab} from './modules/tabutils.js';

function normalizeShortcutKey(key) {
    const aliases = {
        " ": "space",
        "arrowup": "up",
        "arrowdown": "down",
        "arrowleft": "left",
        "arrowright": "right",
        "escape": "esc",
    };
    const normalized = String(key || "").toLowerCase();
    return aliases[normalized] || normalized;
}

function eventMatchesShortcut(event, shortcut) {
    if (!shortcut) return false;

    const parts = shortcut.split("+").map(part => part.trim().toLowerCase()).filter(Boolean);
    const modifiers = new Set(parts.filter(part =>
        ["ctrl", "control", "macctrl", "command", "cmd", "meta", "alt", "option", "shift"].includes(part)
    ));
    const shortcutKey = parts.find(part => !modifiers.has(part));
    if (!shortcutKey) return false;

    const needsCtrl = modifiers.has("ctrl") || modifiers.has("control") || modifiers.has("macctrl");
    const needsMeta = modifiers.has("command") || modifiers.has("cmd") || modifiers.has("meta");
    const needsAlt = modifiers.has("alt") || modifiers.has("option");
    const needsShift = modifiers.has("shift");

    return event.ctrlKey === needsCtrl
        && event.metaKey === needsMeta
        && event.altKey === needsAlt
        && event.shiftKey === needsShift
        && normalizeShortcutKey(event.key) === normalizeShortcutKey(shortcutKey);
}

function installFocusedPopupShortcut() {
    window.addEventListener("keydown", async event => {
        const target = event.target;
        const isEditing = target instanceof HTMLInputElement
            || target instanceof HTMLTextAreaElement
            || target instanceof HTMLSelectElement
            || target?.isContentEditable;

        if (event.repeat || isEditing || document.querySelector(".modal.show")) return;
        if (!eventMatchesShortcut(event, alpineStore.toggleSiteShortcut)) return;

        event.preventDefault();
        event.stopPropagation();

        if (alpineStore.headlessShortcutToggleEnabled) {
            await alpineStore.applyReviewedShortcutToggle(alpineStore.getReviewedShortcutTogglePlan());
        } else {
            alpineStore.reviewShortcutToggle();
        }
    }, true);
}

installFocusedPopupShortcut();


// Hook for inclusion matches
alpineStore.addHook("update", "inclusionMatches", async function(hookData) {
    let {tab} = hookData;
    if (!tab) return [];
    
    try {
        const patterns = alpineStore.inclusionPatterns.trim().split("\n").filter(p => p.trim());
        return await searchTabIDMatchingPatterns(tab, patterns);
    } catch (error) {
        console.error("Inclusion matches hook error:", error);
        return [];
    }
});

// Hook for exclusion matches  
alpineStore.addHook("update", "exclusionMatches", async function(hookData) {
    let {tab} = hookData;
    if (!tab) return [];
    
    try {
        const patterns = alpineStore.exclusionPatterns.trim().split("\n").filter(p => p.trim());
        return await searchTabIDMatchingPatterns(tab, patterns);
    } catch (error) {
        console.error("Exclusion matches hook error:", error);
        return [];
    }
});

// Main popup initialization
async function loadPopup() {
    try {
        // Load version info
        await alpineStore.loadVersionInfo();
        
        // Load settings from storage first
        await alpineStore.loadSettings();
        await alpineStore.loadToggleSiteShortcut();
        

        // Get active tab
        let activeTab = await browser.tabs.query({active: true, currentWindow: true});
        let tab = activeTab[0];
        let url = tab.url;

        // Check if site is protected and set on Alpine store
        let protectedStatus = false;
        try {
            protectedStatus = await isSiteProtected(tab);
        } catch (e) {
            protectedStatus = false;
        }
        alpineStore.sites.main.isProtected = protectedStatus;

        console.log("Current tab :", tab);
        // Update current site
        alpineStore.updateUrl(url, "main", {tab});
        await alpineStore.recomputeCurrentSiteMatches();

        if (new URLSearchParams(window.location.search).get("action") === "toggleSite") {
            alpineStore.reviewShortcutToggle();
        }
        

        // Enable tab change listeners for real-time updates
        alpineStore.enableTabChangeListeners();

        // Update exclude button text initially
        setTimeout(() => {
            alpineStore.updateExcludeButtonText();
            // Debug current state
            alpineStore.debugState();
        }, 300);
     

        // Auto-refresh tab on toggle if enabled
        let lastIsEnabled = alpineStore.isEnabled;
        Alpine.effect(() => {
            if (alpineStore.isEnabled !== lastIsEnabled) {
                lastIsEnabled = alpineStore.isEnabled;
                alpineStore.autoRefreshIfEnabled("toggle");
            }
        });
        renderLightnessPlot();
        alpineStore.addHook("savedSettings", "renderLightnessPlot", renderLightnessPlot);
        alpineStore.addHook("savedSettings", "reloadOnAnySetting", () => {
            alpineStore.autoRefreshIfEnabled("anysetting");
        });
        if (browser.commands?.onChanged) {
            browser.commands.onChanged.addListener(changeInfo => {
                if (changeInfo.name === "toggle-site") {
                    alpineStore.toggleSiteShortcut = changeInfo.newShortcut;
                    alpineStore.toggleSiteShortcutDraft = changeInfo.newShortcut;
                }
            });
        }

        // Setup watchers for settings changes
        console.log('Popup loaded successfully');
    } catch (error) {
        console.error('Failed to load popup:', error);
    }
}


globalThis.uDarkExtended = class{}
window.addEventListener('load', function () {  
    loadPopup();
    
});
document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(Object.assign(document.createElement("script"), {src: "../background.js"}));
});
