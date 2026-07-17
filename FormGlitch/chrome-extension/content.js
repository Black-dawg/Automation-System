(() => {
  if (window.hasInjectedAutofillScript) return;
  window.hasInjectedAutofillScript = true;

  const style = document.createElement('style');
  style.id = 'autofill-pulse-style';
  style.textContent = `
    @keyframes autofillPulse {
      0% { background-color: rgba(59, 130, 246, 0.25); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.4); }
      100% { background-color: transparent; box-shadow: none; }
    }
    .autofill-highlighted {
      animation: autofillPulse 2.5s ease-out;
      transition: all 0.3s ease;
    }
  `;
  document.head.appendChild(style);

  const activeFieldsDb = new Map();

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "PING") {
      sendResponse({ status: "ALIVE" });
    } else if (message.action === "GATHER_FIELDS") {
      const fields = gatherFormFields();
      sendResponse({ fields });
    } else if (message.action === "INJECT_ANSWERS") {
      injectFormAnswers(message.answers);
      sendResponse({ success: true });
    }
  });

  function gatherFormFields() {
    activeFieldsDb.clear();
    const fields = [];

    // Google Forms Scraper
    const googleFormContainers = document.querySelectorAll('div[role="listitem"]');
    if (googleFormContainers.length > 0) {
      googleFormContainers.forEach((container, index) => {
        const heading = container.querySelector('div[role="heading"]');
        if (!heading) return;

        const label = heading.innerText.trim();
        const textInputs = container.querySelectorAll('input[type="text"], input[type="email"], input[type="url"], input[type="number"], textarea');
        const radios = container.querySelectorAll('div[role="radio"]');
        const checkboxes = container.querySelectorAll('div[role="checkbox"]');
        const dropdowns = container.querySelectorAll('div[role="listbox"]');

        let type = 'unknown';
        let elements = [];
        let options = [];

        if (textInputs.length > 0) {
          type = 'text';
          elements = Array.from(textInputs);
        } else if (radios.length > 0) {
          type = 'radio';
          elements = Array.from(radios);
          options = elements.map(el => el.getAttribute('data-value') || el.getAttribute('aria-label') || el.innerText);
        } else if (checkboxes.length > 0) {
          type = 'checkbox';
          elements = Array.from(checkboxes);
          options = elements.map(el => el.getAttribute('data-value') || el.getAttribute('aria-label') || el.innerText);
        } else if (dropdowns.length > 0) {
          type = 'dropdown';
          elements = Array.from(dropdowns);
        }

        if (elements.length === 0) return;

        const fieldId = `gform_${index}`;
        activeFieldsDb.set(fieldId, { type, elements });

        fields.push({
          fieldId,
          fieldLabel: label,
          fieldType: type,
          options: options.map(opt => opt.trim()).filter(Boolean)
        });
      });
      return fields;
    }

    // Generic HTML Forms Scraper
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'));
    inputs.forEach((el, index) => {
      if (!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)) return;

      const fieldId = `html_${index}`;
      const fieldLabel = getFieldLabel(el) || el.placeholder || el.name || `Field ${index + 1}`;
      let type = 'text';
      let options = [];

      if (el.tagName === 'SELECT') {
        type = 'dropdown';
        options = Array.from(el.options).map(opt => opt.text);
        activeFieldsDb.set(fieldId, { type, elements: [el] });
      } else if (el.type === 'radio') {
        type = 'radio';
        const groupName = el.getAttribute('name');
        if (groupName) {
          const group = Array.from(document.querySelectorAll(`input[type="radio"][name="${groupName}"]`));
          activeFieldsDb.set(fieldId, { type, elements: group });
          options = group.map(radio => getFieldLabel(radio) || radio.value);
          // Skip duplicates for radio lists
          if (fields.some(f => f.fieldLabel === fieldLabel && f.fieldType === 'radio')) return;
        } else {
          activeFieldsDb.set(fieldId, { type, elements: [el] });
          options = [el.value];
        }
      } else if (el.type === 'checkbox') {
        type = 'checkbox';
        activeFieldsDb.set(fieldId, { type, elements: [el] });
        options = [el.value];
      } else {
        type = 'text';
        activeFieldsDb.set(fieldId, { type, elements: [el] });
      }

      fields.push({
        fieldId,
        fieldLabel,
        fieldType: type,
        options: options.map(opt => opt.trim()).filter(Boolean)
      });
    });

    return fields;
  }

  function getFieldLabel(el) {
    const id = el.getAttribute('id');
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.innerText.trim();
    }
    const parentLabel = el.closest('label');
    if (parentLabel) return parentLabel.innerText.trim();
    
    return el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || null;
  }

  function injectFormAnswers(answers) {
    for (const [fieldId, value] of Object.entries(answers)) {
      const fieldData = activeFieldsDb.get(fieldId);
      if (!fieldData || fieldData.elements.length === 0) continue;

      const { type, elements } = fieldData;

      if (type === 'text') {
        const input = elements[0];
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        triggerHighlight(input);
      } else if (type === 'radio' || type === 'checkbox') {
        const target = elements.find(el => {
          const val = el.getAttribute('data-value') || el.getAttribute('aria-label') || el.innerText || el.value;
          return val && val.trim().toLowerCase() === value.trim().toLowerCase();
        });
        if (target) {
          target.click();
          triggerHighlight(target);
        }
      } else if (type === 'dropdown') {
        const select = elements[0];
        if (select.tagName === 'SELECT') {
          const match = Array.from(select.options).find(opt => 
            opt.text.toLowerCase().trim() === value.toLowerCase().trim() ||
            opt.value.toLowerCase().trim() === value.toLowerCase().trim()
          );
          if (match) {
            select.value = match.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            triggerHighlight(select);
          }
        } else {
          // Custom dropdown (Google Forms listbox)
          select.click();
          setTimeout(() => {
            const listOptions = Array.from(document.querySelectorAll('div[role="option"]'));
            const match = listOptions.find(opt => 
              opt.getAttribute('data-value') === value || 
              opt.innerText.trim() === value
            );
            if (match) {
              match.click();
              triggerHighlight(select);
            }
          }, 100);
        }
      }
    }
  }

  function triggerHighlight(el) {
    el.classList.add('autofill-highlighted');
    setTimeout(() => el.classList.remove('autofill-highlighted'), 2500);
  }
})();
