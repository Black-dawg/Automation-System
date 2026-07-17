document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab');
  const profileNameInput = document.getElementById('profileName');
  const resumeLinkInput = document.getElementById('resumeLink');
  const resumeFileInput = document.getElementById('resumeFile');
  const fileStatus = document.getElementById('fileStatus');
  const saveResumeBtn = document.getElementById('saveResumeBtn');
  const downloadJsonBtn = document.getElementById('downloadJsonBtn');
  const clearCacheBtn = document.getElementById('clearCacheBtn');
  const viewJsonBtn = document.getElementById('viewJsonBtn');
  const presetInfoInput = document.getElementById('presetInfo');
  const savePresetBtn = document.getElementById('savePresetBtn');
  const parseBtn = document.getElementById('parseAiBtn');
  const syncStatus = document.getElementById('syncIndicator');
  const fillBtn = document.getElementById('autofillBtn');
  const toastContainer = document.getElementById('toastContainer');
  const modal = document.getElementById('jsonModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalPre = document.getElementById('jsonDisplay');
  const openLinkBtn = document.getElementById('openLinkBtn');
  const fileLabel = document.querySelector('.file-upload-text');
  const themeBtn = document.getElementById('themeToggleBtn');
  const moonIcon = document.getElementById('moonIcon');
  const sunIcon = document.getElementById('sunIcon');
  const modelSelect = document.getElementById('modelSelect');

  const BACKEND_URL = 'http://localhost:8081';
  const OLLAMA_URL = 'http://localhost:11434';
  const activeTabId = '1';
  
  let profiles = {
    '1': createDefaultProfile('Profile 1'),
    '2': createDefaultProfile('Profile 2'),
    '3': createDefaultProfile('Profile 3')
  };
  let globalPreset = '';

  function createDefaultProfile(profileName) {
    return {
      name: profileName,
      link: '',
      base64: '',
      filename: '',
      cachedProfile: '',
      lastParsedBase64: '',
      lastParsedPreset: '',
      lastParsedLink: '',
      lastParsedModel: ''
    };
  }

  chrome.storage.local.get(['theme'], (result) => {
    const isLight = result.theme === 'light';
    document.documentElement.classList.toggle('light-theme', isLight);
    moonIcon.style.display = isLight ? 'none' : 'block';
    sunIcon.style.display = isLight ? 'block' : 'none';
  });

  themeBtn.addEventListener('click', () => {
    const isLight = document.documentElement.classList.toggle('light-theme');
    chrome.storage.local.set({ theme: isLight ? 'light' : 'dark' });
    moonIcon.style.display = isLight ? 'none' : 'block';
    sunIcon.style.display = isLight ? 'block' : 'none';
  });

  chrome.storage.local.get(['resumes', 'presetInfo', 'selectedModel'], (result) => {
    if (result.resumes) {
      Object.keys(profiles).forEach(key => {
        if (result.resumes[key]) {
          profiles[key] = { ...profiles[key], ...result.resumes[key] };
        }
      });
    }
    if (result.presetInfo !== undefined) {
      globalPreset = result.presetInfo;
      presetInfoInput.value = globalPreset;
    }
    if (result.selectedModel) {
      modelSelect.value = result.selectedModel;
    }
    refreshUI();
  });

  function checkSync() {
    const currentProfile = profiles[activeTabId];
    const currentPreset = presetInfoInput.value.trim();
    const currentLink = resumeLinkInput.value.trim();
    const currentModel = modelSelect.value;
    
    const isParsed = !!currentProfile.cachedProfile;
    const isPdfSynced = currentProfile.base64 === currentProfile.lastParsedBase64;
    const isPresetSynced = currentPreset === (currentProfile.lastParsedPreset || "");
    const isLinkSynced = currentLink === (currentProfile.lastParsedLink || "");
    const isModelSynced = currentModel === (currentProfile.lastParsedModel || "");

    const isSynced = isParsed && isPdfSynced && isPresetSynced && isLinkSynced && isModelSynced;
    if (isSynced) {
      syncStatus.classList.add('synced');
      syncStatus.setAttribute('title', 'Profile is synced with latest inputs');
    } else {
      syncStatus.classList.remove('synced');
      syncStatus.setAttribute('title', 'Profile has unsynced changes. Click Sync Profile to update.');
    }
  }

  function refreshUI() {
    const currentProfile = profiles[activeTabId];
    
    tabs.forEach(tab => {
      const tabId = tab.getAttribute('data-id');
      const profile = profiles[tabId];
      
      const nameEl = tab.querySelector('.tab-name');
      if (nameEl) nameEl.textContent = profile.name || `Profile ${tabId}`;
      
      const statusEl = tab.querySelector('.tab-status');
      if (statusEl) {
        if (profile.cachedProfile) {
          statusEl.innerHTML = '<span class="tab-sync-dot" title="Profile is synced"></span>';
        } else {
          statusEl.innerHTML = '';
        }
      }

      const isActive = tabId === activeTabId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    profileNameInput.value = currentProfile.name || `Profile ${activeTabId}`;
    resumeLinkInput.value = currentProfile.link || '';
    
    const hasLink = currentProfile.link && currentProfile.link.startsWith('http');
    openLinkBtn.href = hasLink ? currentProfile.link : '#';
    openLinkBtn.style.display = hasLink ? 'block' : 'none';

    if (currentProfile.filename) {
      fileLabel.textContent = currentProfile.filename;
      fileStatus.textContent = `Saved: ${currentProfile.filename}` + (currentProfile.cachedProfile ? " (Profile Cached)" : "");
    } else {
      fileLabel.textContent = "Drag & drop your resume here";
      fileStatus.textContent = "No file selected";
    }
    
    const showJsonActions = currentProfile.cachedProfile ? 'flex' : 'none';
    viewJsonBtn.style.display = showJsonActions;
    downloadJsonBtn.style.display = showJsonActions;
    clearCacheBtn.style.display = showJsonActions;
    
    resumeFileInput.value = '';
    checkSync();
  }

  async function fetchModels() {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/tags`);
      if (!response.ok) throw new Error("Connection failed");
      
      const data = await response.json();
      const modelsList = data.models || [];
      
      modelSelect.innerHTML = '';
      if (modelsList.length > 0) {
        modelsList.forEach(m => {
          const opt = document.createElement('option');
          opt.value = m.name;
          opt.textContent = m.name;
          modelSelect.appendChild(opt);
        });
        
        const store = await chrome.storage.local.get(['selectedModel']);
        const names = modelsList.map(m => m.name);
        if (store && store.selectedModel && names.includes(store.selectedModel)) {
          modelSelect.value = store.selectedModel;
        } else {
          modelSelect.selectedIndex = 0;
        }
        checkSync();
      } else {
        modelSelect.innerHTML = '<option value="">No models found. Please install a model on Ollama</option>';
      }
    } catch (error) {
      console.log("Direct Ollama fetch failed. Using fallback notice.", error);
      modelSelect.innerHTML = '<option value="">Connection failed. Please install / run Ollama</option>';
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activeTabId = tab.getAttribute('data-id');
      refreshUI();
    });
  });

  profileNameInput.addEventListener('input', (e) => {
    const val = e.target.value;
    profiles[activeTabId].name = val;
    chrome.storage.local.set({ resumes: profiles }, checkSync);
    
    const tabEl = document.querySelector(`.tab[data-id="${activeTabId}"]`);
    if (tabEl) {
      const nameEl = tabEl.querySelector('.tab-name');
      if (nameEl) nameEl.textContent = val || `Profile ${activeTabId}`;
    }
  });

  profileNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') profileNameInput.blur();
  });

  resumeLinkInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    profiles[activeTabId].link = val;
    const isLink = val.startsWith('http');
    openLinkBtn.href = isLink ? val : '#';
    openLinkBtn.style.display = isLink ? 'block' : 'none';
    checkSync();
  });

  resumeFileInput.addEventListener('change', () => {
    const file = resumeFileInput.files[0];
    if (file) {
      fileLabel.textContent = file.name;
      fileStatus.textContent = `Selected: ${file.name}`;
    } else {
      refreshUI();
    }
  });

  const dragDropZone = document.getElementById('dragDropZone');
  if (dragDropZone) {
    dragDropZone.addEventListener('click', () => {
      resumeFileInput.click();
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dragDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDropZone.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dragDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDropZone.classList.remove('drag-over');
      }, false);
    });

    dragDropZone.addEventListener('drop', (e) => {
      const dataTransfer = e.dataTransfer;
      const files = dataTransfer.files;
      if (files && files.length > 0) {
        resumeFileInput.files = files;
        resumeFileInput.dispatchEvent(new Event('change'));
      }
    }, false);
  }

  modelSelect.addEventListener('change', () => {
    chrome.storage.local.set({ selectedModel: modelSelect.value });
    checkSync();
  });

  saveResumeBtn.addEventListener('click', async () => {
    const file = resumeFileInput.files[0];
    profiles[activeTabId].link = resumeLinkInput.value.trim();

    if (file) {
      showLoading(saveResumeBtn, 'Saving...', true);
      try {
        const base64Str = await fileToBase64(file);
        profiles[activeTabId].base64 = base64Str;
        profiles[activeTabId].filename = file.name;
        profiles[activeTabId].cachedProfile = ''; 
        chrome.storage.local.set({ resumes: profiles }, checkSync);
        notify('Resume saved locally!', 'success');
      } catch (error) {
        notify(error.message, 'error');
      } finally {
        showLoading(saveResumeBtn, '', false);
        refreshUI();
      }
    } else {
      chrome.storage.local.set({ resumes: profiles }, checkSync);
      notify('Resume details updated!', 'success');
    }
  });

  savePresetBtn.addEventListener('click', () => {
    const text = presetInfoInput.value.trim();
    globalPreset = text;
    chrome.storage.local.set({ presetInfo: text }, () => {
      notify('Presets saved!', 'success');
      checkSync();
    });
  });

  presetInfoInput.addEventListener('input', checkSync);

  parseBtn.addEventListener('click', async () => {
    const currentProfile = profiles[activeTabId];
    const currentPreset = presetInfoInput.value.trim();
    const currentLink = resumeLinkInput.value.trim();
    const currentModel = modelSelect.value;
    
    if (!currentProfile?.base64) {
      notify('Please select and save a PDF resume first.', 'error');
      return;
    }

    const isParsed = !!currentProfile.cachedProfile;
    const isPdfSynced = currentProfile.base64 === currentProfile.lastParsedBase64;
    const isPresetSynced = currentPreset === (currentProfile.lastParsedPreset || "");
    const isLinkSynced = currentLink === (currentProfile.lastParsedLink || "");
    const isModelSynced = currentModel === (currentProfile.lastParsedModel || "");

    if (isParsed && isPdfSynced && isPresetSynced && isLinkSynced && isModelSynced) {
      notify('Profile details are already synced!', 'success');
      return;
    }

    showLoading(parseBtn, 'Reading details...', true);
    notify('Reading profile details. Please wait...', 'info');

    try {
      const response = await fetch(`${BACKEND_URL}/api/autofill/extract-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeBase64: currentProfile.base64,
          presetInfo: currentPreset,
          resumeLink: currentLink,
          model: currentModel
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Extraction failed');
      }

      const extractedJson = await response.text();
      profiles[activeTabId].cachedProfile = extractedJson;
      profiles[activeTabId].lastParsedBase64 = currentProfile.base64;
      profiles[activeTabId].lastParsedPreset = currentPreset;
      profiles[activeTabId].lastParsedLink = currentLink;
      profiles[activeTabId].lastParsedModel = currentModel;

      chrome.storage.local.set({ resumes: profiles }, checkSync);
      notify('Profile details updated successfully!', 'success');
    } catch (error) {
      notify(error.message === 'TypeError' ? 'Failed to connect to local helper.' : error.message, 'error');
    } finally {
      showLoading(parseBtn, '', false);
      refreshUI();
    }
  });

  viewJsonBtn.addEventListener('click', () => {
    const currentProfile = profiles[activeTabId];
    if (currentProfile?.cachedProfile) {
      try {
        const obj = JSON.parse(currentProfile.cachedProfile);
        modalPre.textContent = JSON.stringify(obj, null, 2);
      } catch (error) {
        modalPre.textContent = currentProfile.cachedProfile;
      }
      modal.style.display = 'flex';
    }
  });

  downloadJsonBtn.addEventListener('click', () => {
    const currentProfile = profiles[activeTabId];
    if (currentProfile?.cachedProfile) {
      const blob = new Blob([currentProfile.cachedProfile], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = (currentProfile.name || `Profile_${activeTabId}`).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${safeName}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  });

  clearCacheBtn.addEventListener('click', () => {
    profiles[activeTabId] = createDefaultProfile(profiles[activeTabId].name);
    chrome.storage.local.set({ resumes: profiles }, () => {
      refreshUI();
      notify('Profile cache cleared!', 'success');
    });
  });

  closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  fillBtn.addEventListener('click', () => {
    const currentProfile = profiles[activeTabId];
    if (!currentProfile.cachedProfile) {
      notify('No synchronized profile details found. Please sync your profile first.', 'error');
      return;
    }

    showLoading(fillBtn, 'Autofilling...', true);

    chrome.runtime.sendMessage({
      action: 'AUTOFILL_FORM',
      cachedProfile: currentProfile.cachedProfile,
      model: modelSelect.value
    }, (response) => {
      showLoading(fillBtn, '', false);
      if (chrome.runtime.lastError) {
        notify('Communication error with service worker.', 'error');
        return;
      }
      if (response?.error) {
        notify(response.error, 'error');
      } else {
        notify('Form filled successfully!', 'success');
      }
    });
  });

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result.split(',')[1]);
      reader.onerror = () => reject(new Error('Failed to parse file.'));
      reader.readAsDataURL(file);
    });
  }

  function showLoading(btn, loadingText, isLoading) {
    btn.disabled = isLoading;
    if (isLoading) {
      btn.dataset.original = btn.innerHTML;
      btn.innerHTML = `<span class="btn-spinner"></span> ${loadingText}`;
    } else {
      btn.innerHTML = btn.dataset.original || btn.innerHTML;
    }
  }

  function notify(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button style="background:none;border:none;color:#fff;cursor:pointer;font-size:1.1rem;line-height:1;">&times;</button>
    `;

    toast.querySelector('button').addEventListener('click', () => toast.remove());
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  fetchModels();
});
