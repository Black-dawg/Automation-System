chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((e) => console.error('Sidepanel initialization error:', e));

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.action === "AUTOFILL_FORM") {
    handleFormAutofill(msg.cachedProfile, msg.model)
      .then(res => reply(res))
      .catch(err => reply({ error: err.message }));
    return true;
  }
});

async function handleFormAutofill(profile, model) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('No active browser tab detected.');

  // Inject content script if it's not present
  try {
    await chrome.tabs.sendMessage(tab.id, { action: "PING" });
  } catch (err) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  }

  const scraped = await chrome.tabs.sendMessage(tab.id, { action: "GATHER_FIELDS" });
  if (!scraped || !scraped.fields || scraped.fields.length === 0) {
    throw new Error('No input fields found on active tab.');
  }

  const res = await fetch('http://localhost:8081/api/autofill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cachedProfile: profile,
      formFields: scraped.fields,
      model: model
    })
  });

  if (!res.ok) {
    throw new Error('Spring Boot backend failed to generate answers.');
  }

  const payload = await res.json();
  if (!payload || !payload.filledFields) {
    throw new Error('Invalid answer map returned from server.');
  }

  await chrome.tabs.sendMessage(tab.id, {
    action: "INJECT_ANSWERS",
    answers: payload.filledFields
  });

  return { success: true };
}
