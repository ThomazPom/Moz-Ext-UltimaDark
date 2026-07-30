// modules/bs5modals.js

import Alpine from 'alpinejs';
// Utility for showing Bootstrap 5 modals programmatically (no jQuery, pure JS)
window.bootstrap = window.bootstrap || require('bootstrap');

const modalBodyTags = new Set([
  'A', 'B', 'BR', 'CODE', 'DIV', 'EM', 'INPUT', 'LABEL',
  'LI', 'P', 'PRE', 'SMALL', 'SPAN', 'STRONG', 'UL'
]);
const modalBodyDropTags = new Set([
  'EMBED', 'IFRAME', 'MATH', 'OBJECT', 'SCRIPT', 'STYLE', 'SVG'
]);

function appendSafeModalBody(target, html) {
  const parsed = new DOMParser().parseFromString(String(html), 'text/html');

  [...parsed.body.querySelectorAll('*')].forEach(element => {
    if (!modalBodyTags.has(element.tagName)) {
      if (modalBodyDropTags.has(element.tagName)) {
        element.remove();
      } else {
        element.replaceWith(...element.childNodes);
      }
      return;
    }

    const classes = [...element.classList]
      .filter(className => /^[a-zA-Z0-9_-]+$/.test(className));
    const color = element.tagName === 'SPAN' ? element.style.color : '';
    const href = element.tagName === 'A' ? element.getAttribute('href') : '';
    const targetName = element.tagName === 'A' ? element.getAttribute('target') : '';
    const inputType = element.tagName === 'INPUT' ? element.getAttribute('type') : '';
    const inputIndex = element.tagName === 'INPUT' ? element.getAttribute('data-index') : '';
    const inputChecked = element.tagName === 'INPUT' && element.hasAttribute('checked');

    [...element.attributes].forEach(attribute => {
      element.removeAttribute(attribute.name);
    });

    if (classes.length) {
      element.classList.add(...classes);
    }
    if (color) {
      element.style.color = color;
    }
    if (
      href &&
      (
        href.startsWith('https://addons.mozilla.org/') ||
        href.startsWith('?')
      )
    ) {
      element.setAttribute('href', href);
    }
    if (targetName === '_blank') {
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noopener noreferrer');
    }
    if (inputType === 'checkbox') {
      element.setAttribute('type', 'checkbox');
      if (/^\d+$/.test(inputIndex)) {
        element.setAttribute('data-index', inputIndex);
      }
      if (inputChecked) {
        element.setAttribute('checked', 'checked');
        element.checked = true;
      }
    }
  });

  target.append(...parsed.body.childNodes);
}

function showBS5Modal({title = '', body = '', okText = 'OK', cancelText = 'Cancel', showCancel = true, onOk = null, onCancel = null, okClass = 'btn-primary', cancelClass = 'btn-secondary', extraText = '', onExtra = null, extraClass = 'btn-secondary'}) {
  const isShortcutToggleMode = new URLSearchParams(window.location.search).get('action') === 'toggleSite';
  // Remove any existing modal
  const existing = document.getElementById('bs5modal-ultimadark');
  if (existing) existing.remove();

  const createElement = (tagName, classNames = []) => {
    const element = document.createElement(tagName);
    element.classList.add(...classNames);
    return element;
  };
  const createButton = ({id, text, classes, dismiss = false, label = ''}) => {
    const button = createElement('button', classes);
    button.type = 'button';
    button.id = id;
    button.textContent = text;
    if (dismiss) button.dataset.bsDismiss = 'modal';
    if (label) button.setAttribute('aria-label', label);
    return button;
  };
  const safeClasses = value =>
    String(value)
      .split(/\s+/)
      .filter(className => /^[a-zA-Z0-9_-]+$/.test(className));

  const modalEl = createElement('div', ['modal', 'fade']);
  modalEl.id = 'bs5modal-ultimadark';
  modalEl.tabIndex = -1;
  modalEl.setAttribute('aria-labelledby', 'bs5modalLabel');
  modalEl.setAttribute('aria-hidden', 'true');

  const dialog = createElement('div', ['modal-dialog']);
  const content = createElement('div', ['modal-content']);
  const header = createElement('div', ['modal-header']);
  const titleElement = createElement('h5', ['modal-title']);
  titleElement.id = 'bs5modalLabel';
  titleElement.textContent = title;
  const closeButton = createButton({
    id: 'bs5modal-close',
    text: '',
    classes: ['btn-close'],
    dismiss: true,
    label: 'Close'
  });
  header.append(titleElement, closeButton);

  const bodyElement = createElement('div', ['modal-body']);
  appendSafeModalBody(bodyElement, body);

  const footer = createElement('div', ['modal-footer']);
  if (extraText) {
    footer.appendChild(createButton({
      id: 'bs5modal-extra',
      text: extraText,
      classes: ['btn', ...safeClasses(extraClass)]
    }));
  }
  if (showCancel) {
    footer.appendChild(createButton({
      id: 'bs5modal-cancel',
      text: cancelText,
      classes: ['btn', ...safeClasses(cancelClass)],
      dismiss: true
    }));
  }
  footer.appendChild(createButton({
    id: 'bs5modal-ok',
    text: okText,
    classes: ['btn', ...safeClasses(okClass)]
  }));

  content.append(header, bodyElement, footer);
  dialog.appendChild(content);
  modalEl.appendChild(dialog);
  document.body.appendChild(modalEl);

  // Bootstrap 5 modal instance
  const modal = new bootstrap.Modal(modalEl, {backdrop: 'static', keyboard: false});

  // Button handlers
  modalEl.querySelector('#bs5modal-ok').onclick = async () => {
    try {
      if (onOk) await onOk();
    } finally {
      modal.hide();
    }
  };
  if (showCancel) {
    modalEl.querySelector('#bs5modal-cancel').onclick = async () => {
      try {
        if (onCancel) await onCancel();
      } finally {
        modal.hide();
      }
    };
  }
  if (extraText) {
    modalEl.querySelector('#bs5modal-extra').onclick = async () => {
      try {
        if (onExtra) await onExtra();
      } finally {
        modal.hide();
      }
    };
  }
  modalEl.addEventListener('hidden.bs.modal', () => {
    modalEl.remove();
    if (isShortcutToggleMode) {
      window.close();
    }
  });
  modalEl.addEventListener('shown.bs.modal', () => {
    modalEl.querySelector('#bs5modal-ok')?.focus();
  });

  modal.show();
}
export { showBS5Modal };
