
import { showBS5Modal } from "./bs5modals.js";
import { getEmbedsOfTab, searchTabIDMatchingPatterns } from "./tabutils.js";
document.addEventListener("alpine:init", () => {
    Alpine.store("app", {
        // ...existing code...
        // Set exclusion pattern type (all/img) by adding #ud_img or #ud_all suffix
        setExclusionPatternType(idx, type) {
            let patterns = this.exclusionPatterns.split('\n');
            let base = patterns[idx].split('#ud_')[0];
            // Update only the selected pattern's type, keep order
            patterns = patterns.map((p, i) => {
                if (i === idx) {
                    return base + (type === 'img' ? '#ud_img' : '#ud_all');
                }
                // If another pattern has the same base, skip it
                if (i !== idx && p.split('#ud_')[0] === base) {
                    return null;
                }
                return p;
            }).filter(Boolean);
            this.exclusionPatterns = patterns.join('\n');
            this.saveSettings();
            this.recomputeCurrentSiteMatches();
        },
        // Embeds for current tab
        embeds: [],
        embedsLoading: false,
        // Core state
        activeSite: "main",
        version: "1.6.12",
        productionMode: "Loading...",
        isEnabled: true,
        precisionNumber: 2,
        lastTargetHost: "",
        excludeButtonText: "Exclude",
        
        // Internal state
        settingsSaveTimeout: null,
        tabChangeListenersEnabled: false,
        
        // Feature toggles
        cacheEnabled: true,
        imageEditionEnabled: true,
        serviceWorkersEnabled: true,
        autoRefreshOnSetting: false,
        
        
        // Pattern lists
        inclusionPatterns: "",
        exclusionPatterns: "",
        
        // Hooks system
        hooks: {},
        
        // Sites data
        sites: {
            main: {
                url: "https://www.google.com",
                host: "www.google.com", 
                path: "/",
                exclusionMatches: [],
                inclusionMatches: [],
                tab: null
            },
        },
        
        
        getSiteBadge: function() {
            const site = this.sites[this.activeSite];
            const exclusionMatches = site.exclusionMatches;
            const inclusionMatches = site.inclusionMatches;
            const patterns = this.exclusionPatterns.split('\n').filter(p => p.trim());
            // Find which exclusionMatches are resource-specific
            const imgExclusions = patterns.filter(p => p.endsWith('#ud_img') && exclusionMatches.includes(p.split('#ud_')[0]));
            const cssExclusions = patterns.filter(p => p.endsWith('#ud_css') && exclusionMatches.includes(p.split('#ud_')[0]));
            const imgrExclusions = patterns.filter(p => p.endsWith('#ud_imgr') && exclusionMatches.includes(p.split('#ud_')[0]));
            const resExclusions = patterns.filter(p => p.endsWith('#ud_res') && exclusionMatches.includes(p.split('#ud_')[0]));
            const allExclusions = patterns.filter(p => (!p.includes('#ud_') || p.endsWith('#ud_all')) && exclusionMatches.includes(p.split('#ud_')[0]));

            let processedBageValue = { text: 'DEFAULT', class: 'bg-secondary', title: 'Default behavior.' };

            if (allExclusions.length > 0) {
                // Any full exclusion (all resources) takes priority
                processedBageValue = { text: 'EXCLUDED', class: 'bg-danger', title: 'This site is fully excluded.' };
            } else if (exclusionMatches.length > 0 && imgExclusions.length === exclusionMatches.length) {
                // All exclusions are img-only
                processedBageValue = { text: 'PARTIAL (Images Only)', class: 'bg-warning text-dark', title: 'This site is not fully excluded, but images are.' };
            } else if (exclusionMatches.length > 0 && cssExclusions.length === exclusionMatches.length) {
                // All exclusions are css-only
                processedBageValue = { text: 'PARTIAL (CSS Only)', class: 'bg-warning text-dark', title: 'This site is not fully excluded, but CSS is.' };
            } else if (exclusionMatches.length > 0 && imgrExclusions.length === exclusionMatches.length) {
                // All exclusions are image-resource only
                processedBageValue = { text: 'PARTIAL (Image Resource Only)', class: 'bg-warning text-dark', title: 'This site is not fully excluded, but image resources are.' };
            } else if (exclusionMatches.length > 0 && resExclusions.length === exclusionMatches.length) {
                // All exclusions are resources-only
                processedBageValue = { text: 'PARTIAL (Resources Only)', class: 'bg-warning text-dark', title: 'This site is not fully excluded, but resources (CSS, JS, images) are.' };
            } else if (exclusionMatches.length > 0) {
                // Mixed exclusions
                processedBageValue = { text: 'PARTIAL', class: 'bg-warning text-dark', title: 'This site is partially excluded (mixed resources).' };
            } else if (exclusionMatches.length === 0 && inclusionMatches.length > 0) {
                processedBageValue = { text: 'INCLUDED', class: 'bg-success', title: 'This site is included.' };
            }

            if (this._lastSiteBadge != processedBageValue.text) {
                this.activate_hooks('badge_change', { prevBadge: this._lastSiteBadge, newBadge: processedBageValue.text, site: this.sites[this.activeSite] });
            }
            this._lastSiteBadge = processedBageValue.text; // Store last badge state
            return processedBageValue;
        },
        
        // Hook system methods
        // Add a hook to a named hook group
        addHook(hookGroup, key, hook) {
            if (!this.hooks[hookGroup]) {
                this.hooks[hookGroup] = {};
            }
            this.hooks[hookGroup][key] = hook;
        },
        
        // Activate all hooks in a named group
        async activate_hooks(hookGroup, context = {}) {
            if (!this.hooks[hookGroup]) return;
            if(context.do) {
                context.do(context);
            }
            for (const [key, hook] of Object.entries(this.hooks[hookGroup])) {
                try {
                    let value = await hook(context);
                    if (this.sites && this.activeSite && this.sites[this.activeSite]) {
                        this.sites[this.activeSite][key] = value;
                    }
                } catch (error) {
                    console.error(`Hook error for [${hookGroup}]`, key, error);
                }
            }
        },
        
        // Site management
        updateUrl(url, site, extra = {}) {
            this.sites[site].url = url;
            let parsed = new URL(url);
            this.sites[site].host = parsed.host;
            this.sites[site].path = parsed.pathname;
            if (extra.tab) {
                this.sites[site].tab = extra.tab;
            }
            // Activate hooks for 'update' group
            this.activate_hooks('update', { ...extra, url, site, tab: this.sites[site].tab });
            this.loadEmbedsInStore();
        },
        
        currentSite() {
            return this.sites[this.activeSite];
        },
        
        // Pattern management methods
        editExclusionPattern(idx, newValue) {
            let patterns = this.exclusionPatterns.split('\n');
            const base = newValue.split('#ud_')[0];
            // Remove any pattern with the same base except the one being edited
            patterns = patterns.filter((p, i) => i === idx || p.split('#ud_')[0] !== base);
            patterns[idx] = newValue;
            // Remove any other duplicate base
            patterns = patterns.filter((p, i, arr) => arr.findIndex(q => q.split('#ud_')[0] === p.split('#ud_')[0]) === i);
            this.exclusionPatterns = patterns.join('\n');
            this.saveSettings();
            this.recomputeCurrentSiteMatches();
        },
        deleteExclusionPattern(idx) {
            let patterns = this.exclusionPatterns.split('\n');
            patterns.splice(idx, 1);
            this.exclusionPatterns = patterns.join('\n');
            this.saveSettings();
            this.recomputeCurrentSiteMatches();
        },
        editInclusionPattern(idx, newValue) {
            let patterns = this.inclusionPatterns.split('\n');
            patterns[idx] = newValue;
            this.inclusionPatterns = patterns.join('\n');
            this.saveSettings();
            this.recomputeCurrentSiteMatches();
        },
        deleteInclusionPattern(idx) {
            let patterns = this.inclusionPatterns.split('\n');
            patterns.splice(idx, 1);
            this.inclusionPatterns = patterns.join('\n');
            this.saveSettings();
            this.recomputeCurrentSiteMatches();
        },
        async addExclusionPattern(pattern, checkAlreadyCovered = true) {
            if (!pattern || !pattern.trim()) return;
            const trimmedPattern = pattern.trim();
            // Validate pattern format
            let isValid = await this.isValidPattern(trimmedPattern);
            console.log("Adding exclusion pattern:", trimmedPattern, "Valid:", isValid);
            if (!isValid) {
                showBS5Modal({
                    title: 'Invalid Pattern',
                    body: 'Invalid pattern format. Please use match patterns like: <code>*://example.com/*</code>',
                    okText: 'OK',
                    showCancel: false
                });
                return;
            }
            let patterns = this.exclusionPatterns.split('\n').filter(p => p.trim());
            // Remove any pattern with the same base
            const base = trimmedPattern.split('#ud_')[0];
            patterns = patterns.filter(p => p.split('#ud_')[0] !== base);
            // Use searchTabIDMatchingPatterns for accurate match
            let alreadyCovered = false;
            if (checkAlreadyCovered && this.currentSite()?.tab) {
                const matches = await searchTabIDMatchingPatterns(this.currentSite().tab, patterns);
                alreadyCovered = matches.length > 0;
            }
            const doAdd = async () => {
                patterns.push(trimmedPattern);
                this.exclusionPatterns = patterns.join('\n');
                this.saveSettings();
                this.recomputeCurrentSiteMatches();
                console.log('Added/updated exclusion pattern:', trimmedPattern);
            };
            if (alreadyCovered && checkAlreadyCovered) {
                showBS5Modal({
                    title: 'Site Already Excluded',
                    body: 'A broader exclusion pattern already matches this site. Do you really want to add this exclusion anyway?',
                    okText: 'Add Anyway',
                    okClass: 'btn-warning',
                    cancelText: 'Cancel',
                    showCancel: true,
                    onOk: doAdd
                });
                return;
            }
            await doAdd();
        },
        loadEmbedsInStore: async function() {
            let tab = this.currentSite().tab;
            if (!tab || typeof tab.id === 'undefined') {
                this.embeds = [];
                this.embedsLoading = false;
                return;
            }
            this.embedsLoading = true;
            try {
                // Get all embeds of the current tab with size filter
                let embeds = await getEmbedsOfTab(tab, (embed) => embed.width > 10 && embed.height > 10);
                this.embeds = embeds;
            } catch (error) {
                console.error("Failed to load embeds:", error);
                this.embeds = [];
            } finally {
                this.embedsLoading = false;
            }
        },
        getEmbedsOfTab: async function(tabId) {
            try {
                let tab = this.currentSite().tab;
                if (!tab || typeof tab.id === 'undefined') return [];
                let embeds = await getEmbedsOfTab(tab, (embed) => embed.width > 10 && embed.height > 10);
                return embeds;
            } catch (error) {
                console.error("Failed to get embeds of tab:", error);
                return [];
            }
        },
        getEmbedsOfCurrentSite: async function() {
            let tab = this.currentSite().tab;
            if (!tab || typeof tab.id === 'undefined') return [];
            try {
                return await getEmbedsOfTab(tab, (embed) => embed.width > 10 && embed.height > 10);
            } catch (error) {
                console.error("Failed to get embeds of current site:", error);
                return [];
            }
        },
        
        // Embed helper methods
        async excludeAllEmbedDomains() {
            if (this.embeds.length === 0) return;
            
            const domains = [...new Set(this.embeds.map(embed => {
                try {
                    return (new URL(embed.href)).host;
                } catch (e) {
                    return null;
                }
            }).filter(Boolean))];
            
            if (domains.length === 0) return;
            
            const patterns = domains.map(domain => `*://${domain}/*`);
            
            // Add all patterns
            for (const pattern of patterns) {
                await this.addExclusionPattern(pattern, false); // Don't check for already covered
            }
            
            console.log('Excluded all embed domains:', domains);
        },
        
        copyEmbedUrls() {
            if (this.embeds.length === 0) return;
            
            const urls = this.embeds.map(embed => embed.href).join('\n');
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(urls).then(() => {
                    showBS5Modal({
                        title: 'URLs Copied',
                        body: `Copied ${this.embeds.length} embed URL(s) to clipboard`,
                        okText: 'OK',
                        showCancel: false
                    });
                }).catch(err => {
                    console.error('Failed to copy to clipboard:', err);
                    this.fallbackCopyToClipboard(urls);
                });
            } else {
                this.fallbackCopyToClipboard(urls);
            }
        },
        
        fallbackCopyToClipboard(text) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.top = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                showBS5Modal({
                    title: 'URLs Copied',
                    body: `Copied ${this.embeds.length} embed URL(s) to clipboard`,
                    okText: 'OK',
                    showCancel: false
                });
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
                showBS5Modal({
                    title: 'Copy Failed',
                    body: 'Failed to copy URLs to clipboard. Please copy manually from the console.',
                    okText: 'OK',
                    showCancel: false
                });
                console.log('Embed URLs:', text);
            } finally {
                document.body.removeChild(textArea);
            }
        },
        
        // Convert a match pattern to a RegExp (simple version)
        patternToRegex(pattern) {
            if (!pattern) return null;
            // Escape regex special chars except *
            let regexStr = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
            regexStr = regexStr.replace(/\*/g, ".*");
            // Support <all_urls>
            if (pattern === '<all_urls>') return /^.*$/;
            // Remove trailing slashes for matching
            if (!regexStr.endsWith(".*")) regexStr += ".*";
            try {
                return new RegExp(`^${regexStr}$`, "i");
            } catch (e) {
                return null;
            }
        },
        
        removeExclusionPattern(pattern) {
            // Remove any pattern with the same base (with or without flag)
            const base = pattern.split('#ud_')[0];
            const patterns = this.exclusionPatterns.split('\n').filter(p => p.trim() && p.split('#ud_')[0] !== base);
            this.exclusionPatterns = patterns.join('\n');
            this.saveSettings();
            this.recomputeCurrentSiteMatches();
            console.log('Removed exclusion pattern:', pattern);
        },
        
        addInclusionPattern(pattern) {
            if (!pattern || !pattern.trim()) return;
            // Validate pattern format
            if (!this.isValidPattern(pattern.trim())) {
                showBS5Modal({
                    title: 'Invalid Pattern',
                    body: 'Invalid pattern format. Please use match patterns like: <code>*://example.com/*</code>',
                    okText: 'OK',
                    showCancel: false
                });
                return;
            }
            const patterns = this.inclusionPatterns.split('\n').filter(p => p.trim());
            if (!patterns.includes(pattern.trim())) {
                patterns.push(pattern.trim());
                this.inclusionPatterns = patterns.join('\n');
                this.saveSettings();
                this.recomputeCurrentSiteMatches();
                console.log('Added inclusion pattern:', pattern.trim());
            } else {
                console.log('Pattern already exists:', pattern.trim());
            }
        },
        
        removeInclusionPattern(pattern) {
            showBS5Modal({
                title: 'Remove Inclusion Pattern',
                body: `Remove inclusion pattern: <code>${pattern}</code>?`,
                okText: 'Remove',
                okClass: 'btn-danger',
                cancelText: 'Cancel',
                showCancel: true,
                onOk: () => {
                    const patterns = this.inclusionPatterns.split('\n').filter(p => p.trim() && p !== pattern);
                    this.inclusionPatterns = patterns.join('\n');
                    this.saveSettings();
                    this.recomputeCurrentSiteMatches();
                    console.log('Removed inclusion pattern:', pattern);
                }
            });
        },
        // Force recalc of matches for current site after any pattern change
        async   recomputeCurrentSiteMatches() {
            const site = this.currentSite();
            if (!site || !site.url) return;
            // Store previous badge state
            const prevBadge = this._lastSiteBadge;
            // Activate hooks for 'update' group, passing prevBadge and newBadge
            await this.activate_hooks('update', { url: site.url,
                site: this.activeSite,
                tab: site.tab,
                prevBadge,
                newBadge:this.getSiteBadge().text
            });
            if(this._lastSiteBadge != prevBadge)
            {
                await this.autoRefreshIfEnabled();
            }
            this._lastSite=site;
            if (window.Alpine) {
                window.Alpine.nextTick(() => {
                    this.sites = { ...this.sites };
                    this.activeSite = this.activeSite;
                    // Check if badge changed
                });
            }
        },
        
        toggleSiteExclusion(pattern) {
            const patterns = this.exclusionPatterns.split('\n').filter(p => p.trim());
            const fullPattern = `*://${pattern}`;
            
            if (patterns.includes(fullPattern)) {
                this.removeExclusionPattern(fullPattern);
            } else {
                this.addExclusionPattern(fullPattern);
            }
        },
        
        // Pattern validation helper
        async isValidPattern(pattern) {
            // Basic validation for match patterns
            if (!pattern) return false;
            try{
                await browser.tabs.query({url: pattern})
                return true;
            }catch(e){
                console.warn("Invalid pattern:", pattern, e);
                return false;
            }
        },
        
        // Get suggested patterns for current site
        getSuggestedPatterns() {
            const site = this.currentSite();
            if (!site.host) return [];
            
            const hostParts = site.host.split('.');
            const suggestions = [];
            
            // Add exact host
            suggestions.push(`*://${site.host}/*`);
            
            // Add with wildcard subdomain
            if (hostParts.length > 2) {
                const rootDomain = hostParts.slice(-2).join('.');
                suggestions.push(`*://*.${rootDomain}/*`);
            }
            
            // Add specific page pattern if not root
            if (site.path && site.path !== '/') {
                suggestions.push(`*://${site.host}${site.path}*`);
            }
            
            return suggestions;
        },
        
        // Current site actions
        async excludeCurrentSite() {
            const site = this.currentSite();
            if (!site.host) return;
            const hostParts = site.host.split('.');
            const precision = Math.min(this.precisionNumber, hostParts.length);
            const targetHost = hostParts.slice(-precision).join('.');
            this.lastTargetHost = targetHost;
            await this.addExclusionPatternsForCurrentSite(targetHost);
            this.updateExcludeButtonText();
        },
        // Add both exclusion patterns for the current site, with grouped validation and modal
        async addExclusionPatternsForCurrentSite(targetHost) {
            const patternsToAdd = [`*://${targetHost}/*`, `*://*.${targetHost}/*`];
            const patterns = this.exclusionPatterns.split('\n').filter(p => p.trim());
            // Validate all patterns
            for (const pat of patternsToAdd) {
                if (!await this.isValidPattern(pat)) {
                    showBS5Modal({
                        title: 'Invalid Pattern',
                        body: 'Invalid pattern format. Please use match patterns like: <code>*://example.com/*</code>',
                        okText: 'OK',
                        showCancel: false
                    });
                    return;
                }
            }
            // Use searchTabIDMatchingPatterns for accurate match
            let alreadyCovered = false;
            if (this.currentSite()?.tab) {
                const matches = await searchTabIDMatchingPatterns(this.currentSite().tab, patterns);
                alreadyCovered = matches.length > 0;
            }
            const doAdd = async () => {
                let added = false;
                for (const pat of patternsToAdd) {
                    if (!patterns.includes(pat)) {
                        patterns.push(pat);
                        added = true;
                    }
                }
                if (added) {
                    this.exclusionPatterns = patterns.join('\n');
                    this.saveSettings();
                    await this.recomputeCurrentSiteMatches();
                    console.log('Added exclusion patterns:', patternsToAdd);
                } else {
                    console.log('Patterns already exist:', patternsToAdd);
                }
            };
            if (alreadyCovered) {
                showBS5Modal({
                    title: 'Site Already Excluded',
                    body: 'An exclusion pattern already matches this site. Do you really want to add these exclusions anyway?',
                    okText: 'Add Anyway',
                    okClass: 'btn-warning',
                    cancelText: 'Cancel',
                    showCancel: true,
                    onOk: doAdd
                });
                return;
            }
            await doAdd();
        },
        
        includeCurrentSite() {
            const site = this.currentSite();
            if (!site.host) return;
            const hostParts = site.host.split('.');
            const precision = Math.min(this.precisionNumber, hostParts.length);
            const targetHost = hostParts.slice(-precision).join('.');
            this.lastTargetHost = targetHost;
            // Add both with and without wildcard subdomain
            this.addInclusionPattern(`*://${targetHost}/*`);
            this.addInclusionPattern(`*://*.${targetHost}/*`);
        },
        
        updatePrecision() {
            this.updateExcludeButtonText();
            this.saveSettings();
        },
        
        updateExcludeButtonText() {
            const site = this.currentSite();
            if (!site.host) return;
            const hostParts = site.host.split('.');
            const precision = Math.min(this.precisionNumber, hostParts.length);
            const targetHost = hostParts.slice(-precision).join('.');
            this.lastTargetHost = targetHost;
            // Remove direct DOM manipulation - use reactive data instead
            this.excludeButtonText = `Exclude ${targetHost}`;
        },
        
        // Tab change detection functionality
        enableTabChangeListeners() {
            if (this.tabChangeListenersEnabled) return;
            this.tabChangeListenersEnabled = true;
            
            // Listen for tab activation changes
            browser.tabs.onActivated.addListener(this.handleTabActivated.bind(this));
            
            // Listen for tab updates (URL changes, etc.)
            browser.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
            
            console.log('Tab change listeners enabled');
        },
        
        disableTabChangeListeners() {
            if (!this.tabChangeListenersEnabled) return;
            this.tabChangeListenersEnabled = false;
            
            // Remove listeners
            browser.tabs.onActivated.removeListener(this.handleTabActivated.bind(this));
            browser.tabs.onUpdated.removeListener(this.handleTabUpdated.bind(this));
            
            console.log('Tab change listeners disabled');
        },
        
        async handleTabActivated(activeInfo) {
            console.log('Active tab changed to:', activeInfo.tabId);
            
            try {
                const tab = await browser.tabs.get(activeInfo.tabId);
                console.log('New active tab:', tab);
                
                if (tab.url) {
                    await this.updateToNewTab(tab);
                }
            } catch (error) {
                console.error('Failed to handle tab activation:', error);
            }
        },
        
        async handleTabUpdated(tabId, changeInfo, tab) {
            // Only process if this is the active tab and URL changed
            if (changeInfo.url && tab.active) {
                console.log('Active tab URL updated:', changeInfo.url);
                
                try {
                    await this.updateToNewTab(tab);
                } catch (error) {
                    console.error('Failed to handle tab update:', error);
                }
            }
        },
        
        async updateToNewTab(tab) {
            // Check if site is protected
            let protectedStatus = false;
            try {
                protectedStatus = await isSiteProtected(tab);
            } catch (e) {
                protectedStatus = false;
            }
            this.sites.main.isProtected = protectedStatus;
            
            // Update the current site in the store
            this.updateUrl(tab.url, "main", {tab});
            
            // Update button text
            this.updateExcludeButtonText();
            
            console.log('Store updated for new tab:', tab.url);
        },
        
        // Auto-refresh functionality
        async autoRefreshIfEnabled() {
            if (!this.autoRefreshOnSetting) return;
            let tab = this.sites[this.activeSite].tab;
            if (!tab || typeof tab.id === 'undefined') return;
            console.log("Auto-refreshing tab:", tab.id);
            try { 
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve(browser.tabs.reload(tab.id));
                    }, 200); // Delay to ensure any changes are applied
                });
            } catch(e) {
                console.error("Failed to refresh tab:", e);
            }
        },
        
        // Settings management
        async saveSettings() {
            const settings = {
                white_list: this.inclusionPatterns,
                black_list: this.exclusionPatterns,
                precision_number: this.precisionNumber,
                disable_webext: !this.isEnabled,
                disable_cache: !this.cacheEnabled,
                disable_image_edition: !this.imageEditionEnabled,
                keep_service_workers: this.serviceWorkersEnabled,
                autoRefreshOnSetting: this.autoRefreshOnSetting
            }
            try {
                await browser.storage.local.set(settings);
                console.log('Settings saved');
            } catch (error) {
                console.error('Failed to save settings:', error);
            }
        },
        
        async loadSettings() {
            try {
                const result = await browser.storage.local.get(null);
                
                // Load patterns
                this.inclusionPatterns = result.white_list || "<all_urls>\n*://*/*\nhttps://*.w3schools.com/*";
                this.exclusionPatterns = result.black_list || "*://example.com/*";
                this.precisionNumber = result.precision_number || 2;
                
                // Load feature toggles - Note: storage uses disable_ prefixes, so we invert
                this.isEnabled = !result.disable_webext;
                this.cacheEnabled = !result.disable_cache;
                this.imageEditionEnabled = !result.disable_image_edition;
                this.serviceWorkersEnabled = result.keep_service_workers;
                this.autoRefreshOnSetting = result.autoRefreshOnSetting;
                
                console.log('Settings loaded');
                console.log('Current state:', {
                    isEnabled: this.isEnabled,
                    cacheEnabled: this.cacheEnabled,
                    imageEditionEnabled: this.imageEditionEnabled,
                    serviceWorkersEnabled: this.serviceWorkersEnabled
                });
                
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        },
        
        
        // Advanced actions
        clearAllData() {
            showBS5Modal({
                title: 'Clear All Settings',
                body: 'Are you sure you want to clear all UltimaDark settings? This cannot be undone.',
                okText: 'Clear All',
                okClass: 'btn-danger',
                cancelText: 'Cancel',
                showCancel: true,
                onOk: () => {
                    browser.storage.local.clear().then(() => {
                        this.inclusionPatterns = "<all_urls>\n*://*/*\nhttps://*.w3schools.com/*";
                        this.exclusionPatterns = "*://example.com/*";
                        this.precisionNumber = 2;
                        this.isEnabled = true;
                        this.cacheEnabled = true;
                        this.imageEditionEnabled = true;
                        this.serviceWorkersEnabled = true;
                        this.autoRefreshOnSetting = false;
                        this.saveSettings();
                        showBS5Modal({
                            title: 'Settings Cleared',
                            body: 'All settings have been cleared and reset to defaults.',
                            okText: 'OK',
                            showCancel: false
                        });
                    });
                }
            });
        },
        
        exportSettings() {
            const settings = {
                inclusionPatterns: this.inclusionPatterns,
                exclusionPatterns: this.exclusionPatterns,
                precisionNumber: this.precisionNumber,
                isEnabled: this.isEnabled,
                cacheEnabled: this.cacheEnabled,
                imageEditionEnabled: this.imageEditionEnabled,
                serviceWorkersEnabled: this.serviceWorkersEnabled,
                autoRefreshOnSetting: this.autoRefreshOnSetting,
                exportDate: new Date().toISOString(),
                version: this.version
            };
            
            const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ultimadark-settings-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        },
        
        importSettings() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const settings = JSON.parse(e.target.result);
                        
                        // Validate and import settings
                        if (settings.inclusionPatterns !== undefined) this.inclusionPatterns = settings.inclusionPatterns;
                        if (settings.exclusionPatterns !== undefined) this.exclusionPatterns = settings.exclusionPatterns;
                        if (settings.precisionNumber !== undefined) this.precisionNumber = settings.precisionNumber;
                        if (settings.isEnabled !== undefined) this.isEnabled = settings.isEnabled;
                        if (settings.cacheEnabled !== undefined) this.cacheEnabled = settings.cacheEnabled;
                        if (settings.imageEditionEnabled !== undefined) this.imageEditionEnabled = settings.imageEditionEnabled;
                        if (settings.serviceWorkersEnabled !== undefined) this.serviceWorkersEnabled = settings.serviceWorkersEnabled;
                        if (settings.autoRefreshOnSetting !== undefined) this.autoRefreshOnSetting = settings.autoRefreshOnSetting;
                        
                        this.saveSettings();
                        showBS5Modal({
                            title: 'Import Complete',
                            body: 'Settings imported successfully!',
                            okText: 'OK',
                            showCancel: false
                        });
                    } catch (error) {
                        console.error('Import failed:', error);
                        showBS5Modal({
                            title: 'Import Failed',
                            body: 'Failed to import settings. Please check the file format.',
                            okText: 'OK',
                            showCancel: false
                        });
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        },
        
        // Initialize version and production mode
        async loadVersionInfo() {
            try {
                const response = await fetch("../manifest.json");
                const manifest = await response.json();
                this.version = manifest.version;
                
                const production = manifest.browser_specific_settings?.gecko?.id;
                this.productionMode = production ? "Production mode" : "Development mode";
            } catch (error) {
                console.error('Failed to load version info:', error);
                this.productionMode = "Unknown mode";
            }
        },
        
        // Debug method to check current state
        debugState() {
            console.log('=== Current Store State ===');
            console.log('isEnabled:', this.isEnabled);
            console.log('cacheEnabled:', this.cacheEnabled);
            console.log('imageEditionEnabled:', this.imageEditionEnabled);
            console.log('serviceWorkersEnabled:', this.serviceWorkersEnabled);
            console.log('precisionNumber:', this.precisionNumber);
            console.log('inclusionPatterns:', this.inclusionPatterns);
            console.log('exclusionPatterns:', this.exclusionPatterns);
            console.log('========================');
        }
    });
});

console.log('Store script loaded!');