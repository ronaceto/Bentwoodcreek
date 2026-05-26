const app = document.getElementById('directoryApp');
const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const setMessage = (id, text, type = 'error') => {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text || '';
  el.className = `form-message ${type} ${text ? 'show' : ''}`;
};

const contactRows = (contacts) => contacts.map((contact, index) => `
  <div class="household-contact-row" data-contact-row="${index}">
    <input data-contact-name="${index}" value="${escapeHtml(contact.name || '')}" placeholder="Household member name">
    <input data-contact-phone="${index}" value="${escapeHtml(contact.phone || '')}" placeholder="Phone number">
    <input data-contact-email="${index}" value="${escapeHtml(contact.email || '')}" placeholder="Email address">
    <button class="secondary danger" type="button" data-remove-contact="${index}">Remove Contact</button>
  </div>
`).join('');

const readContacts = () => [...document.querySelectorAll('[data-contact-row]')].map((row) => {
  const index = row.dataset.contactRow;
  return {
    name: BWC.sanitize(document.querySelector(`[data-contact-name="${index}"]`).value, 120),
    phone: BWC.sanitize(document.querySelector(`[data-contact-phone="${index}"]`).value, 40),
    email: BWC.sanitize(document.querySelector(`[data-contact-email="${index}"]`).value, 120).toLowerCase()
  };
}).filter((contact) => contact.name || contact.phone || contact.email);

const contactDisplay = (entry) => BWC.normalizeHouseholdContacts(entry).map((contact) => `
  <div class="directory-contact">
    <strong>${escapeHtml(contact.name || 'Resident')}</strong>
    ${contact.phone ? `<span>${escapeHtml(contact.phone)}</span>` : ''}
    ${contact.email ? `<a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>` : ''}
  </div>
`).join('');

(async () => {
  await BWC.wireSiteNav();
  const resident = await BWC.getSessionResident();
  if (!resident) {
    app.innerHTML = `
      <h2>Sign In Required</h2>
      <p>The parcel map is public, but directory opt-in and listing edits require an approved resident login.</p>
      <div id="dirLoginMsg" class="form-message" role="status"></div>
      <input id="dirLoginEmail" placeholder="Email">
      <input id="dirLoginPassword" type="password" placeholder="Password">
      <button id="dirLogin">Sign In</button>
      <div class="grid two">
        <a class="buttonlike secondary" href="/resident-portal/">Register a Parcel</a>
        <a class="buttonlike secondary" href="/neighborhood-map/">Open Parcel Map</a>
      </div>`;
    document.getElementById('dirLogin').onclick = async () => {
      try {
        setMessage('dirLoginMsg', 'Signing in...', 'info');
        await BWC.loginResident(document.getElementById('dirLoginEmail').value, document.getElementById('dirLoginPassword').value);
        location.reload();
      } catch (e) {
        setMessage('dirLoginMsg', e.message || 'Unable to sign in.', 'error');
      }
    };
    return;
  }
  if (resident.status !== 'active') {
    app.innerHTML = `
      <h2>Approval Pending</h2>
      <p>Your account is not active yet. Directory opt-in becomes available after admin approval.</p>
      <a class="buttonlike secondary" href="/resident-portal/">Open Resident Portal</a>`;
    return;
  }

  const data = await BWC.getData();
  BWC.ensurePortal(data);
  BWC.normalizeResidents(data);
  const current = data.portal.residents.find((item) => item.id === resident.id) || resident;
  const contacts = BWC.normalizeHouseholdContacts(current);

  app.innerHTML = `
    <section class="directory-profile">
      <h2>Your Directory Listing</h2>
      <p class="help">Manage the household names, phone numbers, and emails that appear in the master resident directory.</p>
      <div id="dirProfileMsg" class="form-message" role="status"></div>
      <label class="inline-check"><input id="myDirOptIn" type="checkbox" ${current.directoryOptIn ? 'checked' : ''}> List my household in the resident directory</label>
      <div class="grid two">
        <input id="myDirName" value="${escapeHtml(current.name || '')}" placeholder="Primary resident name">
        <input id="myDirPhone" value="${escapeHtml(current.phone || '')}" placeholder="Primary phone number">
        <input id="myDirEmail" value="${escapeHtml(current.email || '')}" placeholder="Primary email address">
        <input id="myDirAddress" value="${escapeHtml(current.address || '')}" placeholder="Property address">
      </div>
      <h3>Household Contacts</h3>
      <div id="householdContacts" class="household-contact-editor"></div>
      <button id="addHouseholdContact" type="button" class="secondary">+ Add Household Contact</button>
      <p class="help">${current.lot ? `Lot ${escapeHtml(current.lot)}` : 'Lot not linked'}${current.parcel ? ` - Parcel ${escapeHtml(current.parcel)}` : ''}</p>
      <div class="grid two">
        <button id="saveDirectoryProfile">Save Directory Listing</button>
        <button id="removeMyResidentAccount" class="secondary danger" type="button">Remove My Resident Account</button>
      </div>
    </section>
    <div class="directory-search-card">
      <label for="dirSearch">Search Resident Directory</label>
      <div class="directory-toolbar">
        <input id="dirSearch" type="search" placeholder="Search by name, address, lot, phone, or email">
        <a class="buttonlike secondary" href="/neighborhood-map/">Parcel Map</a>
      </div>
      <div id="dirSummary" class="map-summary"></div>
    </div>
    <div id="dirEntries" class="directory-list"></div>`;

  const contactsBox = document.getElementById('householdContacts');
  const redrawContacts = (nextContacts) => {
    contactsBox.innerHTML = contactRows(nextContacts.length ? nextContacts : [{ name: '', phone: '', email: '' }]);
    contactsBox.querySelectorAll('[data-remove-contact]').forEach((btn) => {
      btn.onclick = () => {
        redrawContacts(readContacts().filter((_, index) => index !== Number(btn.dataset.removeContact)));
        setMessage('dirProfileMsg', 'Household contact removed', 'success');
      };
    });
  };
  redrawContacts(contacts);
  document.getElementById('addHouseholdContact').onclick = () => redrawContacts([...readContacts(), { name: '', phone: '', email: '' }]);

  const search = document.getElementById('dirSearch');
  const summary = document.getElementById('dirSummary');
  const list = document.getElementById('dirEntries');
  const getEntries = () => data.portal.residents
    .filter((item) => item.status === 'active' && item.directoryOptIn)
    .sort((a, b) => String(a.address || '').localeCompare(String(b.address || '')));
  const render = () => {
    const query = search.value.trim().toLowerCase();
    const entries = getEntries();
    const filtered = query
      ? entries.filter((entry) => [entry.name, entry.address, entry.phone, entry.email, entry.lot, entry.parcel, ...BWC.normalizeHouseholdContacts(entry).flatMap((contact) => [contact.name, contact.phone, contact.email])].join(' ').toLowerCase().includes(query))
      : entries;
    summary.textContent = `${filtered.length} opted-in household${filtered.length === 1 ? '' : 's'}`;
    list.innerHTML = filtered.length ? filtered.map((entry) => `
      <article class="directory-entry">
        <h2>${escapeHtml(entry.name)}</h2>
        <p>${escapeHtml(entry.address || 'Address hidden')}</p>
        <div class="directory-contact-list">${contactDisplay(entry)}</div>
        <dl>
          <dt>Lot / Parcel</dt><dd>${entry.lot ? `Lot ${escapeHtml(entry.lot)}` : 'Lot not set'}${entry.parcel ? ` - ${escapeHtml(entry.parcel)}` : ''}</dd>
        </dl>
      </article>
    `).join('') : '<p class="help">No residents have opted in yet.</p>';
  };

  document.getElementById('saveDirectoryProfile').onclick = async () => {
    const primaryEmail = BWC.sanitize(document.getElementById('myDirEmail').value, 120).toLowerCase();
    current.directoryOptIn = document.getElementById('myDirOptIn').checked;
    current.name = BWC.sanitize(document.getElementById('myDirName').value, 120);
    current.phone = BWC.sanitize(document.getElementById('myDirPhone').value, 40);
    current.email = primaryEmail;
    current.address = BWC.sanitize(document.getElementById('myDirAddress').value, 160);
    current.householdContacts = readContacts();
    if (!current.name || !BWC.validateEmail(current.email)) return setMessage('dirProfileMsg', 'Use a primary name and valid primary email address.', 'error');
    if (current.householdContacts.some((contact) => contact.email && !BWC.validateEmail(contact.email))) return setMessage('dirProfileMsg', 'Use valid email addresses for household contacts.', 'error');
    BWC.normalizeHouseholdContacts(current);
    BWC.logAction(data, current.id, 'directory.profile.updated', current.directoryOptIn ? 'opted in' : 'opted out');
    setMessage('dirProfileMsg', 'Saving directory listing...', 'info');
    await BWC.saveData(data);
    BWC.wireSiteNav();
    render();
    setMessage('dirProfileMsg', current.directoryOptIn ? 'Directory listing saved' : 'Directory opt-out saved', 'success');
  };

  document.getElementById('removeMyResidentAccount').onclick = async () => {
    if (!await BWC.confirmAction({
      title: 'Remove resident account',
      message: 'Remove your resident account and directory listing? You will need to register again for portal access.',
      confirmText: 'Remove Account',
      danger: true
    })) return;
    await BWC.removeCurrentResident();
    alert('Your resident account was removed.');
    location.href = '/resident-portal/';
  };

  search.addEventListener('input', render);
  render();
})();
