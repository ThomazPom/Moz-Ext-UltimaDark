// Define default values for the popup
var defaultValues = {
    white_list: ["<all_urls>", "*://*/*", "https://*.w3schools.com/*"].join('\n'),
    black_list: ["*://example.com/*"].join('\n'),
    precision_number: 2,
}

// Import Alpine.js and Bootstrap
import Alpine from "alpinejs";
import 'bootstrap'; // Pour les composants JS (nécessite Popper.js)
import 'bootstrap/dist/css/bootstrap.min.css'; // Pour le CSS de Bootstrap

// Import the store module
import "./modules/store.js";
// Import the modals module
import { showBS5Modal } from './modules/bs5modals.js';


import "./modules/modals.js";

// Initialize Alpine
window.Alpine = Alpine;

let myPort = browser.runtime.connect({name:"port-from-popup"});
console.log('Popup script loaded!');

Alpine.start();
let alpineStore = Alpine.store("app");

import { searchTabIDMatchingPatterns, isSiteProtected , getEmbedsOfTab} from './modules/tabutils.js';

// Hook for inclusion matches
alpineStore.addHook("inclusionMatches", async function(hookData) {
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
alpineStore.addHook("exclusionMatches", async function(hookData) {
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

        console.log("Current tab embed:", tab);
        // Update current site
        alpineStore.updateUrl(url, "main", {tab});
        
        // Setup watchers for settings changes
        setupSettingsWatchers();

        // Update exclude button text initially
        setTimeout(() => {
            alpineStore.updateExcludeButtonText();
            // Debug current state
            alpineStore.debugState();
        }, 300);
        // Update protected status reactively if tab changes
        Alpine.effect(async () => {
            let tab = alpineStore.sites[alpineStore.activeSite].tab;
            if (tab && typeof tab.id !== 'undefined') {
                let protectedStatus = false;
                try {
                    protectedStatus = await isSiteProtected(tab);
                } catch (e) {
                    protectedStatus = false;
                }
                alpineStore.sites.main.isProtected = protectedStatus;
            }
        });

        // Auto-refresh tab on toggle if enabled
        // Helper: reload tab if auto-refresh is enabled
        async function autoRefreshIfEnabled() {
            if (!alpineStore.autoRefreshOnSetting) return;
            let tab = alpineStore.sites[alpineStore.activeSite].tab;
            if (!tab || typeof tab.id === 'undefined') return;
            try { await browser.tabs.reload(tab.id); } catch(e) {}
        }
        // Watch isEnabled changes
        let lastIsEnabled = alpineStore.isEnabled;
        Alpine.effect(() => {
            if (alpineStore.isEnabled !== lastIsEnabled) {
                lastIsEnabled = alpineStore.isEnabled;
                autoRefreshIfEnabled();
            }
        });
        // Watch current site inclusion/exclusion status changes
        let lastExcl = (alpineStore.sites[alpineStore.activeSite].exclusionMatches || []).join(',');
        let lastIncl = (alpineStore.sites[alpineStore.activeSite].inclusionMatches || []).join(',');
        Alpine.effect(() => {
            let excl = (alpineStore.sites[alpineStore.activeSite].exclusionMatches || []).join(',');
            let incl = (alpineStore.sites[alpineStore.activeSite].inclusionMatches || []).join(',');
            if (excl !== lastExcl || incl !== lastIncl) {
                lastExcl = excl;
                lastIncl = incl;
                autoRefreshIfEnabled();
            }
        });
        // Expose for popup.html button events
        window.autoRefreshIfEnabled = autoRefreshIfEnabled;
        
        console.log('Popup loaded successfully');
    } catch (error) {
        console.error('Failed to load popup:', error);
    }
}

// Setup watchers for automatic saving
function setupSettingsWatchers() {
    // Clear any existing timeout
    if (window.settingsSaveTimeout) {
        clearTimeout(window.settingsSaveTimeout);
    }
    
    // Watch for changes in settings and auto-save with debounce
    Alpine.effect(() => {
        // These properties will trigger the watcher when they change
        const watchedSettings = {
            isEnabled: alpineStore.isEnabled,
            cacheEnabled: alpineStore.cacheEnabled,
            imageEditionEnabled: alpineStore.imageEditionEnabled,
            serviceWorkersEnabled: alpineStore.serviceWorkersEnabled,
            precisionNumber: alpineStore.precisionNumber,
            inclusionPatterns: alpineStore.inclusionPatterns,
            exclusionPatterns: alpineStore.exclusionPatterns,
            autoRefreshOnSetting: alpineStore.autoRefreshOnSetting
        };
        
        console.log('Settings changed, scheduling save...', watchedSettings);
        
        // Debounce the save operation
        clearTimeout(window.settingsSaveTimeout);
        window.settingsSaveTimeout = setTimeout(() => {
            console.log('Auto-saving settings...');
            alpineStore.saveSettings();
        }, 500);
    });
}

// Handle keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Close popup on Escape
   
    
    // Quick exclude current site with Ctrl+E
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        alpineStore.excludeCurrentSite();
    }
    
});
// Handle action from URL parameters (for keyboard shortcuts)
const urlParams = new URLSearchParams(window.location.search);
const action = urlParams.get('action');

if (action === 'toggleSite') {
    // Mimic user clicking the include/exclude button in the UI
    setTimeout(() => {
        const site = alpineStore.sites[alpineStore.activeSite];
        let btn;
        if (site.exclusionMatches && site.exclusionMatches.length > 0) {
            // Find the include button
            btn = document.querySelector('.btn-success.flex-fill');
        } else {
            // Find the exclude button
            btn = document.querySelector('.btn-danger.flex-fill');
        }
        if (btn) {
            btn.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}));
        }
    }, 500);
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', loadPopup);

