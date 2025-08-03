// modules/modals.js
// Modal logic for UltimaDark popup, using showBS5Modal utility

import Alpine from 'alpinejs';
import { showBS5Modal } from './bs5modals.js';
function confirmExcludeSite(site, onConfirm) {
  // Use the precision-based host from Alpine store if available
  const store = Alpine && Alpine.store ? Alpine.store('app') : (window.$store ? window.$store.app : null);
  const displayHost = (store && store.lastTargetHost) ? store.lastTargetHost : site.host;
  let matchingExclusions = (site.exclusionMatches && site.exclusionMatches.length > 0)
    ? '<br><span class="text-danger">Matching exclusion patterns:</span><br><code>' + site.exclusionMatches.join(', ') + '</code>'
    : '';
  let matchingInclusions = (site.inclusionMatches && site.inclusionMatches.length > 0)
    ? '<br><span class="text-success">Matching inclusion patterns:</span><br><code>' + site.inclusionMatches.join(', ') + '</code>'
    : '';
  showBS5Modal({
    title: 'Exclude This Site',
    body: 'Are you sure you want to exclude <strong>' + displayHost + '</strong>?' + matchingExclusions + matchingInclusions,
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
  let matchingExclusions = (site.exclusionMatches && site.exclusionMatches.length > 0)
    ? '<br><span class="text-danger">Matching exclusion patterns:</span><br><code>' + site.exclusionMatches.join(', ') + '</code>'
    : '';
  let matchingInclusions = (site.inclusionMatches && site.inclusionMatches.length > 0)
    ? '<br><span class="text-success">Matching inclusion patterns:</span><br><code>' + site.inclusionMatches.join(', ') + '</code>'
    : '';
  if(site.exclusionMatches.length > 0) {
    showBS5Modal({
      title: 'Site is Excluded',
      body: 'This site is currently <span class="text-danger">EXCLUDED</span>.' + matchingExclusions + '<br><br>Do you want to <strong>remove</strong> these exclusion patterns and include the site?',
      okText: 'Remove Exclusions & Include',
      okClass: 'btn-success',
      cancelText: 'Cancel',
      showCancel: true,
      onOk: () => {
        if(store) site.exclusionMatches.forEach(p => store.removeExclusionPattern(p));
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