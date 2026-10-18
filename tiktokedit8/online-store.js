'use strict';
(() => {
  const endpoint = window.REVIEW_ONLINE.store;
  const deviceKey = 'paulqc:tiktokedit8:reviewer';
  let reviewer = localStorage.getItem(deviceKey);
  if (!reviewer) {
    reviewer = crypto.randomUUID();
    localStorage.setItem(deviceKey, reviewer);
  }
  let queue = Promise.resolve();
  async function read() {
    const response = await fetch(endpoint + '?t=' + Date.now(), {cache: 'no-store', headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(20000)});
    if (!response.ok) throw Error('feedback unavailable');
    let data = await response.json();
    if (typeof data === 'string') data = JSON.parse(data);
    if (data.roundId !== 'round-01' || !data.drafts || !Array.isArray(data.submissions)) throw Error('invalid feedback');
    return data;
  }
  function update(change) {
    const job = queue.catch(() => {}).then(async () => {
      // Do not write if the existing feedback cannot be read.
      const data = await read();
      change(data);
      const response = await fetch(endpoint, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data), signal: AbortSignal.timeout(20000)});
      if (!response.ok) throw Error('feedback could not save');
    });
    queue = job;
    return job;
  }
  window.REVIEW_STORE = {
    async loadDraft() {return (await read()).drafts[reviewer]?.state || {};},
    saveDraft(state, feedback) {
      const snapshot = structuredClone({state, feedback});
      return update(data => {
        const previous = data.drafts[reviewer];
        if (!previous || snapshot.state.updatedAt >= previous.state.updatedAt) {
          data.drafts[reviewer] = {...snapshot, reviewerId: reviewer};
        }
      });
    },
    saveSubmission(record) {
      const snapshot = structuredClone(record);
      return update(data => {
        data.submissions = data.submissions.filter(r => String(r.name || 'anonymous').trim().toLowerCase() !== snapshot.name.toLowerCase());
        data.submissions.unshift(snapshot);
      });
    },
    read
  };
})();
