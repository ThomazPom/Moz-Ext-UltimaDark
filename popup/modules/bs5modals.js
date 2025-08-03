// modules/bs5modals.js

import Alpine from 'alpinejs';
// Utility for showing Bootstrap 5 modals programmatically (no jQuery, pure JS)
window.bootstrap = window.bootstrap || require('bootstrap');
function showBS5Modal({title = '', body = '', okText = 'OK', cancelText = 'Cancel', showCancel = true, onOk = null, onCancel = null, okClass = 'btn-primary', cancelClass = 'btn-secondary'}) {
  // Remove any existing modal
  const existing = document.getElementById('bs5modal-ultimadark');
  if (existing) existing.remove();

  // Modal HTML
  const modalHtml = `
    <div class="modal fade" id="bs5modal-ultimadark" tabindex="-1" aria-labelledby="bs5modalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="bs5modalLabel">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            ${body}
          </div>
          <div class="modal-footer">
            ${showCancel ? `<button type="button" class="btn ${cancelClass}" data-bs-dismiss="modal" id="bs5modal-cancel">${cancelText}</button>` : ''}
            <button type="button" class="btn ${okClass}" id="bs5modal-ok">${okText}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Insert modal into DOM
  const div = document.createElement('div');
  div.innerHTML = modalHtml;
  document.body.appendChild(div.firstElementChild);

  // Bootstrap 5 modal instance
  const modalEl = document.getElementById('bs5modal-ultimadark');
  const modal = new bootstrap.Modal(modalEl, {backdrop: 'static', keyboard: false});

  // Button handlers
  modalEl.querySelector('#bs5modal-ok').onclick = () => {
    if (onOk) onOk();
    modal.hide();
  };
  if (showCancel) {
    modalEl.querySelector('#bs5modal-cancel').onclick = () => {
      if (onCancel) onCancel();
      modal.hide();
    };
  }
  modalEl.addEventListener('hidden.bs.modal', () => {
    modalEl.remove();
  });

  modal.show();
}
export { showBS5Modal };