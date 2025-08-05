// modules/modals.js
// Modal logic for UltimaDark popup, using showBS5Modal utility

import Alpine from 'alpinejs';
import { showBS5Modal } from './bs5modals.js';
function confirmExcludeSite(site, onConfirm) {
  // Use the precision-based host from Alpine store if available
  const store = Alpine && Alpine.store ? Alpine.store('app') : (window.$store ? window.$store.app : null);
  const displayHost = (store && store.lastTargetHost) ? store.lastTargetHost : site.host;
  let matchingExclusions = '';
  if (site.exclusionMatches && site.exclusionMatches.length > 0) {
    const storePatterns = store ? store.exclusionPatterns.split('\n') : [];
    const patternHtml = site.exclusionMatches.map(p => {
      // Find the full pattern in store (with possible #ud_img)
      const fullPattern = storePatterns.find(sp => sp.split('#ud_')[0] === p);
      if (fullPattern && fullPattern.endsWith('#ud_img')) {
        return '<span style="color:#ffe066">' + fullPattern + '</span>';
      } else {
        return '<span class="text-danger">' + p + '</span>';
      }
    }).join(', ');
    matchingExclusions = '<br>Matching exclusion patterns:<br><code>' + patternHtml + '</code>';
  }
  let matchingInclusions = '';
  if (site.inclusionMatches && site.inclusionMatches.length > 0) {
    matchingInclusions = '<br>Matching inclusion patterns:<br><code>' + site.inclusionMatches.map(p => '<span style="color:#28a745">' + p + '</span>').join(', ') + '</code>';
  }
  // Get correct badge status
  const badge = store ? store.getSiteBadge() : { text: 'EXCLUDED' };
  let badgeHtml = '';
  if (badge.text === 'EXCLUDED') {
    badgeHtml = 'This site is currently <span class="text-danger">EXCLUDED</span>.';
  } else if (badge.text === 'PARTIAL (Images Only)') {
    badgeHtml = 'This site is currently <span class="text-warning">PARTIAL (Images Only)</span>.';
  } else {
    badgeHtml = 'This site is currently <span class="text-secondary">' + badge.text + '</span>.';
  }
  showBS5Modal({
    title: 'Exclude This Site',
    body: badgeHtml + '<br>Are you sure you want to exclude <strong>' + displayHost + '</strong>?' + matchingExclusions + matchingInclusions,
    okText: 'Exclude',
    okClass: 'btn-danger',
    cancelText: 'Cancel',
    showCancel: true,
    onOk: onConfirm
  });
}

function confirmIncludeSite(site, onConfirm) {
  // Get the Alpine store instance
  const store = Alpine && Alpine.store ? Alpine.store('app') : (window.$store ? window.$store.app : null);
  let matchingExclusions = '';
  let exclusionCheckboxes = '';
  if (site.exclusionMatches && site.exclusionMatches.length > 0) {
    const storePatterns = store ? store.exclusionPatterns.split('\n') : [];
    exclusionCheckboxes = site.exclusionMatches.map((p, i) => {
      const fullPattern = storePatterns.find(sp => sp.split('#ud_')[0] === p) || p;
      const label = (fullPattern.endsWith('#ud_img'))
        ? `<span style='color:#ffe066'>${fullPattern}</span>`
        : `<span class='text-danger'>${fullPattern}</span>`;
      return `<label style='display:block;'><input type='checkbox' class='excl-remove-checkbox' data-pattern='${encodeURIComponent(fullPattern)}' checked> ${label}</label>`;
    }).join('');
    matchingExclusions = `<br>Matching exclusion patterns:<br>${exclusionCheckboxes}`;
  }
  let matchingInclusions = '';
  if (site.inclusionMatches && site.inclusionMatches.length > 0) {
    matchingInclusions = '<br>Matching inclusion patterns:<br><code>' + site.inclusionMatches.map(p => '<span style="color:#28a745">' + p + '</span>').join(', ') + '</code>';
  }
  // Get correct badge status
  const badge = store ? store.getSiteBadge() : { text: 'EXCLUDED' };
  if(site.exclusionMatches.length > 0) {
    let badgeHtml = '';
    if (badge.text === 'EXCLUDED') {
      badgeHtml = 'This site is currently <span class="text-danger">EXCLUDED</span>.';
    } else if (badge.text === 'PARTIAL (Images Only)') {
      badgeHtml = 'This site is currently <span class="text-warning">PARTIAL (Images Only)</span>.';
    } else {
      badgeHtml = 'This site is currently <span class="text-secondary">' + badge.text + '</span>.';
    }
    showBS5Modal({
      title: 'Site is Excluded',
      body: badgeHtml + matchingExclusions + '<br><br>Uncheck any exclusion patterns you want to keep.<br>Do you want to <strong>remove</strong> the selected exclusion patterns and include the site?',
      okText: 'Remove Exclusions & Include',
      okClass: 'btn-success',
      cancelText: 'Cancel',
      showCancel: true,
      onOk: () => {
        if (store) {
          // Find checked checkboxes and remove only those patterns, silently
          const modal = document.querySelector('.modal.show');
          if (modal) {
            const checked = Array.from(modal.querySelectorAll('.excl-remove-checkbox:checked'));
            checked.forEach(cb => {
              const pattern = decodeURIComponent(cb.getAttribute('data-pattern'));
              if (typeof store.removeExclusionPattern === 'function') {
                store.removeExclusionPattern(pattern, true); // silent mode
              }
            });
          } else {
            // fallback: remove all silently
            site.exclusionMatches.forEach(p => {
              if (typeof store.removeExclusionPattern === 'function') {
                store.removeExclusionPattern(p, true);
              }
            });
          }
        }
        onConfirm();
      }
    });
  } else if(site.inclusionMatches.length > 0) {
    showBS5Modal({
      title: 'Already Included',
      body: 'This site is already <span class="text-success">INCLUDED</span>.' + matchingInclusions + '<br><br>Do you really want to add another include pattern for this site?',
      okText: 'Add Include Pattern',
      okClass: 'btn-success',
      cancelText: 'Cancel',
      showCancel: true,
      onOk: onConfirm
    });
  } else {
    // Show matching patterns even if none, for consistency
    showBS5Modal({
      title: 'Include This Site',
      body: 'Do you want to include this site?' + matchingExclusions + matchingInclusions,
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