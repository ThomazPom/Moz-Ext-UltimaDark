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
import 'bootstrap-icons/font/bootstrap-icons.css'; // Pour les icônes Bootstrap

// Import the store module
import "./modules/store.js";
// Import the modals module
import { showBS5Modal } from './modules/bs5modals.js';

// Import and register patternInput Alpine component


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
                alpineStore.autoRefreshIfEnabled();
            }
        });
        
        // Setup watchers for settings changes
        console.log('Popup loaded successfully');
    } catch (error) {
        console.error('Failed to load popup:', error);
    }
}


// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadPopup();
});

