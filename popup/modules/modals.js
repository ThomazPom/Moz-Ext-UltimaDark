// modules/modals.js
// Modal logic for UltimaDark popup, using showBS5Modal utility

import Alpine from 'alpinejs';
import { showBS5Modal } from './bs5modals.js';

// Create safe HTML with DOM methods instead of string concatenation
function createSafePatternHTML(patterns, color) {
  const container = document.createElement('div');
  patterns.forEach((pattern, index) => {
    if (index > 0) container.appendChild(document.createTextNode(', '));
    const span = document.createElement('span');
    span.style.color = color;
    span.textContent = pattern; // Safe - browser handles escaping
    container.appendChild(span);
  });
  return container.innerHTML; // Now safe because we used textContent
}

// Get Alpine store with fallback
function getStore() {
  return Alpine && Alpine.store ? Alpine.store('app') : (window.$store ? window.$store.app : null);
}

// Create safe host element for display
function createSafeHostElement(displayHost) {
  const hostSpan = document.createElement('strong');
  hostSpan.textContent = displayHost;
  return hostSpan.outerHTML;
}

// Generate badge HTML based on site status
function generateBadgeHTML(badge) {
  const badgeMap = {
    'EXCLUDED': 'This site is currently <span class="text-danger">EXCLUDED</span>.',
    'PARTIAL (Images Only)': 'This site is currently <span class="text-warning">PARTIAL (Images Only)</span>.',
    'DEFAULT': `This site is currently <span class="text">${badge.text}</span>.`
  };
  
  return badgeMap[badge.text] || `This site is currently <b class="text">${badge.text}</b>.`;
}

// Generate exclusion patterns display
function generateExclusionPatternsHTML(site, store) {
  if (!site.exclusionMatches || site.exclusionMatches.length === 0) {
    return '';
  }

  const storePatterns = store ? store.exclusionPatterns.split('\n') : [];
  const patternData = site.exclusionMatches.map(p => {
    const fullPattern = storePatterns.find(sp => sp.split('#ud_')[0] === p);
    return {
      pattern: fullPattern || p,
      isImageOnly: fullPattern && fullPattern.endsWith('#ud_img')
    };
  });
  
  const regularPatterns = patternData.filter(p => !p.isImageOnly).map(p => p.pattern);
  const imagePatterns = patternData.filter(p => p.isImageOnly).map(p => p.pattern);
  
  let patternHtml = '';
  if (regularPatterns.length > 0) {
    patternHtml += createSafePatternHTML(regularPatterns, '#dc3545');
  }
  if (imagePatterns.length > 0) {
    if (regularPatterns.length > 0) patternHtml += ', ';
    patternHtml += createSafePatternHTML(imagePatterns, '#ffe066');
  }
  
  return `<br>Matching exclusion patterns:<br><code>${patternHtml}</code>`;
}

// Generate inclusion patterns display
function generateInclusionPatternsHTML(site) {
  if (!site.inclusionMatches || site.inclusionMatches.length === 0) {
    return '';
  }

  const inclusionHtml = createSafePatternHTML(site.inclusionMatches, '#28a745');
  return `<br>Matching inclusion patterns:<br><code>${inclusionHtml}</code>`;
}

// Create checkbox element for pattern removal
function createPatternCheckbox(fullPattern, index) {
  const label = document.createElement('label');
  label.style.display = 'block';
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'excl-remove-checkbox';
  checkbox.setAttribute('data-index', index);
  checkbox.setAttribute('checked', 'checked');
  checkbox.checked = true;
  
  const span = document.createElement('span');
  span.style.color = fullPattern.endsWith('#ud_img') ? '#ffe066' : '#dc3545';
  span.textContent = fullPattern;
  
  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(' '));
  label.appendChild(span);
  
  return label.outerHTML;
}

// Generate exclusion checkboxes for pattern removal
function generateExclusionCheckboxes(site, store, patternsToRemove) {
  if (!site.exclusionMatches || site.exclusionMatches.length === 0) {
    return '';
  }

  const storePatterns = store ? store.exclusionPatterns.split('\n') : [];
  
  const checkboxes = site.exclusionMatches.map((p, i) => {
    const fullPattern = storePatterns.find(sp => sp.split('#ud_')[0] === p) || p;
    patternsToRemove.push(fullPattern);
    return createPatternCheckbox(fullPattern, i);
  }).join('');
  
  return `<br>Matching exclusion patterns:<br>${checkboxes}`;
}

// Handle pattern removal from checkboxes
function handlePatternRemoval(store, patternsToRemove, onConfirm) {
  if (!store) {
    onConfirm();
    return;
  }

  const modal = document.querySelector('.modal.show');
  if (modal) {
    const checked = Array.from(modal.querySelectorAll('.excl-remove-checkbox:checked'));
    checked.forEach(cb => {
      const index = parseInt(cb.getAttribute('data-index'));
      const pattern = patternsToRemove[index];
      if (pattern && typeof store.removeExclusionPattern === 'function') {
        console.log('Removing exclusion pattern:', pattern);
        store.removeExclusionPattern(pattern, true); // silent mode
      }
    });
  } else {
    // fallback: remove all silently
    patternsToRemove.forEach(pattern => {
      if (typeof store.removeExclusionPattern === 'function') {
        console.log('Removing exclusion pattern (fallback):', pattern);
        store.removeExclusionPattern(pattern, true);
      }
    });
  }
  onConfirm();
}
function confirmExcludeSite(site, onConfirm) {
  const store = getStore();
  const displayHost = (store && store.lastTargetHost) ? store.lastTargetHost : site.host;
  
  const matchingExclusions = generateExclusionPatternsHTML(site, store);
  const matchingInclusions = generateInclusionPatternsHTML(site);
  
  const badge = store ? store.getSiteBadge() : { text: 'EXCLUDED' };
  const badgeHtml = generateBadgeHTML(badge);
  const hostElement = createSafeHostElement(displayHost);
  
  showBS5Modal({
    title: 'Exclude This Site',
    body: `${badgeHtml}<br>Are you sure you want to exclude ${hostElement}?${matchingExclusions}${matchingInclusions}`,
    okText: 'Exclude',
    okClass: 'btn-danger',
    cancelText: 'Cancel',
    showCancel: true,
    onOk: onConfirm
  });
}

function confirmIncludeSite(site, onConfirm) {
  const store = getStore();
  const patternsToRemove = [];
  
  const matchingExclusions = generateExclusionCheckboxes(site, store, patternsToRemove);
  const matchingInclusions = generateInclusionPatternsHTML(site);
  const badge = store ? store.getSiteBadge() : { text: 'EXCLUDED' };

  if (site.exclusionMatches.length > 0) {
    const badgeHtml = `This site is currently <b>${badge.text}</b>.`;
    showBS5Modal({
      title: 'Site is Excluded',
      body: `${badgeHtml}${matchingExclusions}<br><br>Uncheck any exclusion patterns you want to keep.<br>Do you want to <strong>remove</strong> the selected exclusion patterns and include the site?`,
      okText: 'Remove Exclusions & Include',
      okClass: 'btn-success',
      cancelText: 'Cancel',
      showCancel: true,
      onOk: () => handlePatternRemoval(store, patternsToRemove, onConfirm)
    });
  } else if (site.inclusionMatches.length > 0) {
    showBS5Modal({
      title: 'Already Included',
      body: `This site is already <span class="text-success">INCLUDED</span>.${matchingInclusions}<br><br>Do you really want to add another include pattern for this site?`,
      okText: 'Add Include Pattern',
      okClass: 'btn-success',
      cancelText: 'Cancel',
      showCancel: true,
      onOk: onConfirm
    });
  } else {
    showBS5Modal({
      title: 'Include This Site',
      body: `Do you want to include this site?${matchingExclusions}${matchingInclusions}`,
      okText: 'Include',
      okClass: 'btn-success',
      cancelText: 'Cancel',
      showCancel: true,
      onOk: onConfirm
    });
  }
}

function showExclusionPriorityInfo() {
  showBS5Modal({
    title: 'Exclusion Priority',
    body: '<strong>Note:</strong> If a site matches both the <span class="fw-bold text-danger">exclusion</span> and <span class="fw-bold text-success">inclusion</span> lists, <span class="fw-bold text-danger">exclusion</span> always takes priority.',
    okText: 'OK',
    showCancel: false
  });
}
// Register $modals as an Alpine magic property and also on window for global access
document.addEventListener("alpine:init", () => {
  Alpine.magic("modals", () => ({
    confirmExcludeSite,
    confirmIncludeSite,
    showExclusionPriorityInfo
  }));
});