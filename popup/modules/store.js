
import { showBS5Modal } from "./bs5modals.js";
import { getEmbedsOfTab, searchTabIDMatchingPatterns } from "./tabutils.js";
document.addEventListener("alpine:init", () => {
    Alpine.store("app", {
        // Set exclusion pattern type (all/img) by adding ##img or ##all suffix
        setExclusionPatternType(idx, type) {
            let patterns = this.exclusionPatterns.split('\n');
            let base = patterns[idx].split('##')[0];
            if (type === 'img') {
                patterns[idx] = base + '##img';
            } else {
                patterns[idx] = base + '##all';
            }
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
        
        // Feature toggles
        cacheEnabled: true,
        imageEditionEnabled: true,
        serviceWorkersEnabled: true,
        autoRefreshOnSetting: false,

        
        // Pattern lists
        inclusionPatterns: "",
        exclusionPatterns: "",
        
        // Hooks system
        updateHooks: {},
        
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

        // Hook system methods
        addHook(key, hook) {
            this.updateHooks[key] = hook;
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
            
            // Execute hooks
            Object.entries(this.updateHooks).forEach(async ([key, hook]) => {
                try {
                    let value = await hook({ ...extra, url, site, tab: this.sites[site].tab });
                    this.sites[site][key] = value;
                    console.log("Hooked", key, value);
                } catch (error) {
                    console.error("Hook error for", key, error);
                }
            });

            this.loadEmbedsInStore();
        },
        
        currentSite() {
            return this.sites[this.activeSite];
        },

        // Pattern management methods
        editExclusionPattern(idx, newValue) {
            let patterns = this.exclusionPatterns.split('\n');
            patterns[idx] = newValue;
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
            const patterns = this.exclusionPatterns.split('\n').filter(p => p.trim());
            // Use searchTabIDMatchingPatterns for accurate match
            let alreadyCovered = false;
            if (checkAlreadyCovered && this.currentSite()?.tab) {
                const matches = await searchTabIDMatchingPatterns(this.currentSite().tab, patterns);
                alreadyCovered = matches.length > 0;
            }
            const doAdd = async () => {
                if (!patterns.includes(trimmedPattern)) {
                    patterns.push(trimmedPattern);
                    this.exclusionPatterns = patterns.join('\n');
                    this.saveSettings();
                    this.recomputeCurrentSiteMatches();
                    console.log('Added exclusion pattern:', trimmedPattern);
                } else {
                    console.log('Pattern already exists:', trimmedPattern);
                }
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
                // Get all embeds of the current tab (pass full tab object)
                let embeds = await getEmbedsOfTab(tab);
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
                let embeds = await getEmbedsOfTab(tab);
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
                return await getEmbedsOfTab(tab);
            } catch (error) {
                console.error("Failed to get embeds of current site:", error);
                return [];
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
                return new RegExp("^" + regexStr + "$", "i");
            } catch (e) {
                return null;
            }
        },
        
        removeExclusionPattern(pattern) {
            showBS5Modal({
                title: 'Remove Exclusion Pattern',
                body: `Remove exclusion pattern: <code>${pattern}</code>?`,
                okText: 'Remove',
                okClass: 'btn-danger',
                cancelText: 'Cancel',
                showCancel: true,
                onOk: () => {
                    const patterns = this.exclusionPatterns.split('\n').filter(p => p.trim() && p !== pattern);
                    this.exclusionPatterns = patterns.join('\n');
                    this.saveSettings();
                    this.recomputeCurrentSiteMatches();
                    console.log('Removed exclusion pattern:', pattern);
                }
            });
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
        recomputeCurrentSiteMatches() {
            const site = this.currentSite();
            if (!site || !site.url) return;
            // Re-run all updateHooks for the current site
            Object.entries(this.updateHooks).forEach(async ([key, hook]) => {
                try {
                    let value = await hook({ url: site.url, site: this.activeSite, tab: site.tab });
                    this.sites[this.activeSite][key] = value;
                } catch (error) {
                    console.error("Hook error for", key, error);
                }
            });
            if (window.Alpine) {
                window.Alpine.nextTick(() => {
                    this.sites = { ...this.sites };
                    this.activeSite = this.activeSite;
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
                    this.recomputeCurrentSiteMatches();
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
            const excludeBtn = document.getElementById('donotdarken');
            if (excludeBtn) {
                excludeBtn.textContent = `Exclude ${targetHost}`;
            }
        },

        // Settings management
        async saveSettings() {
            const settings = {
                whitelist: this.inclusionPatterns,
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
                console.log('Settings saved', settings);
            } catch (error) {
                console.error('Failed to save settings:', error);
            }
        },
        
        async loadSettings() {
            try {
                const result = await browser.storage.local.get(null);
                
                // Load patterns
                this.inclusionPatterns = result.whitelist || "<all_urls>\n*://*/*\nhttps://*.w3schools.com/*";
                this.exclusionPatterns = result.black_list || "*://example.com/*";
                this.precisionNumber = result.precision_number || 2;
                
                // Load feature toggles - Note: storage uses disable_ prefixes, so we invert
                this.isEnabled = !result.disable_webext;
                this.cacheEnabled = !result.disable_cache;
                this.imageEditionEnabled = !result.disable_image_edition;
                this.serviceWorkersEnabled = result.keep_service_workers;
                this.autoRefreshOnSetting = result.autoRefreshOnSetting;
                
                console.log('Settings loaded:', result);
                console.log('Current state:', {
                    isEnabled: this.isEnabled,
                    cacheEnabled: this.cacheEnabled,
                    imageEditionEnabled: this.imageEditionEnabled,
                    serviceWorkersEnabled: this.serviceWorkersEnabled
                });
                
                // Trigger UI updates
                this.updateToggleDisplays();
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        },

        // Update toggle displays after loading settings
        updateToggleDisplays() {
            // Force reactivity update
            console.log('Toggle states updated');
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