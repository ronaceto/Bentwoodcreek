async function renderNeighborhoodMap() {
  await BWC.wireSiteNav();

  const data = await BWC.getData();
  const lots = (data.mapLots || []).slice().sort((a, b) => Number(a.lot || 0) - Number(b.lot || 0));
  const mapEl = document.getElementById('map');
  if (!mapEl) return;
  const detailsEl = document.getElementById('lotDetails');
  const listEl = document.getElementById('lotList');
  const searchEl = document.getElementById('lotSearch');
  const summaryEl = document.getElementById('lotSummary');
  const isPopout = document.body.classList.contains('map-popout-page');
  const showDirectory = mapEl.dataset.directory === 'true';
  const markers = new Map();

  if (!lots.length) {
    mapEl.innerHTML = '<div class="empty-state">No lot data is available.</div>';
    return;
  }

  const center = [
    lots.reduce((sum, lot) => sum + Number(lot.lat || 0), 0) / lots.length,
    lots.reduce((sum, lot) => sum + Number(lot.lng || 0), 0) / lots.length
  ];

  const map = L.map('map', {
    scrollWheelZoom: isPopout,
    zoomControl: isPopout,
    doubleClickZoom: isPopout,
    touchZoom: true,
    dragging: true
  }).setView(center, 17);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const bounds = [];
  const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const fullAddress = (lot) => `${lot.address}, ${lot.city || 'Collierville'}, ${lot.state || 'TN'} ${lot.zip || '38017'}`;
  const zillowUrl = (lot) => lot.zillowUrl || `https://www.zillow.com/homes/${encodeURIComponent(fullAddress(lot).replace(/,/g, ''))}_rb/`;
  const normalizeText = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const directoryEntriesForLot = (lot) => {
    if (!showDirectory) return [];
    return (data.portal.residents || []).filter((resident) => resident.status === 'active' && resident.directoryOptIn && (
      String(resident.lot || '') === String(lot.lot || '') ||
      normalizeText(resident.address).includes(normalizeText(lot.address))
    ));
  };
  const directoryHtml = (lot) => {
    const entries = directoryEntriesForLot(lot);
    if (!showDirectory) return '';
    if (!entries.length) return '<div class="map-directory-info"><h3>Directory Listing</h3><p class="help">No opted-in resident listing for this lot yet.</p></div>';
    return `<div class="map-directory-info"><h3>Directory Listing</h3>${entries.map((entry) => `
      <div class="directory-contact-list">
        ${BWC.normalizeHouseholdContacts(entry).map((contact) => `
          <div class="directory-contact">
            <strong>${escapeHtml(contact.name || entry.name || 'Resident')}</strong>
            ${contact.phone ? `<span>${escapeHtml(contact.phone)}</span>` : ''}
            ${contact.email ? `<a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('')}</div>`;
  };
  const markerLabel = (lot) => `Lot ${lot.lot}: ${lot.address}`;
  const popupHtml = (lot) => `
    <strong>Lot ${escapeHtml(lot.lot)}</strong><br>
    ${escapeHtml(fullAddress(lot))}<br>
    <small>Parcel ${escapeHtml(lot.parcel)} - ${escapeHtml(lot.phase || '')}</small>
    ${showDirectory ? directoryHtml(lot) : ''}
  `;
  const renderDetails = (lot) => {
    detailsEl.innerHTML = `
      <h2>Lot ${escapeHtml(lot.lot)}</h2>
      <dl>
        <dt>Address</dt><dd>${escapeHtml(fullAddress(lot))}</dd>
        <dt>Parcel</dt><dd>${escapeHtml(lot.parcel)}</dd>
        <dt>Phase</dt><dd>${escapeHtml(lot.phase || 'Unassigned')}</dd>
        <dt>Coordinates</dt><dd>${Number(lot.lat).toFixed(6)}, ${Number(lot.lng).toFixed(6)}</dd>
      </dl>
      ${directoryHtml(lot)}
      <a class="buttonlike secondary" href="${escapeHtml(zillowUrl(lot))}" target="_blank" rel="noopener noreferrer">View on Zillow</a>
      <a class="buttonlike" href="/resident-portal/?lot=${encodeURIComponent(lot.lot)}">Start Resident Registration</a>
    `;
  };
  const selectLot = (lot, openPopup = true) => {
    renderDetails(lot);
    document.querySelectorAll('.lot-row.active').forEach((row) => row.classList.remove('active'));
    const row = document.querySelector(`[data-lot-row="${CSS.escape(String(lot.lot))}"]`);
    if (row) row.classList.add('active');
    const marker = markers.get(String(lot.lot));
    if (marker) {
      if (isPopout) map.setView(marker.getLatLng(), Math.max(map.getZoom(), 18), { animate: true });
      if (openPopup) marker.openPopup();
    }
  };

  lots.forEach((lot) => {
    const latLng = [Number(lot.lat), Number(lot.lng)];
    bounds.push(latLng);
    const marker = L.circleMarker(latLng, {
      radius: isPopout ? 9 : 10,
      color: '#2f5d50',
      weight: 2,
      fillColor: '#f6d36b',
      fillOpacity: 0.9
    })
      .addTo(map)
      .bindTooltip(markerLabel(lot), { direction: 'top', sticky: true })
      .bindPopup(`${popupHtml(lot)}<br><a href="${escapeHtml(zillowUrl(lot))}" target="_blank" rel="noopener noreferrer">View on Zillow</a>`);
    marker.on('mouseover', () => {
      marker.setStyle({ radius: isPopout ? 12 : 13, fillColor: '#ffffff', color: '#9b4d15' });
      marker.openTooltip();
      renderDetails(lot);
    });
    marker.on('mouseout', () => marker.setStyle({ radius: isPopout ? 9 : 10, fillColor: '#f6d36b', color: '#2f5d50' }));
    marker.on('click', () => selectLot(lot, true));
    markers.set(String(lot.lot), marker);
  });

  map.fitBounds(bounds, { padding: isPopout ? [42, 42] : [70, 70], maxZoom: isPopout ? 18 : 17 });

  const renderList = (items) => {
    summaryEl.textContent = `${items.length} of ${lots.length} lots`;
    listEl.innerHTML = items.map((lot) => `
      <button class="lot-row" type="button" data-lot-row="${escapeHtml(lot.lot)}">
        <span>Lot ${escapeHtml(lot.lot)}</span>
        <strong>${escapeHtml(lot.address)}</strong>
        <small>${escapeHtml(lot.parcel)} - Zillow available</small>
      </button>
    `).join('');
    listEl.querySelectorAll('.lot-row').forEach((row) => {
      row.addEventListener('click', () => {
        const lot = lots.find((item) => String(item.lot) === row.dataset.lotRow);
        if (lot) selectLot(lot, true);
      });
    });
  };
  const applyFilter = () => {
    const query = searchEl.value.trim().toLowerCase();
    const filtered = query
      ? lots.filter((lot) => [lot.lot, lot.address, lot.parcel, lot.phase].join(' ').toLowerCase().includes(query))
      : lots;
    renderList(filtered);
  };

  searchEl.addEventListener('input', applyFilter);
  renderList(lots);
  renderDetails(lots[0]);
}

BWC.renderNeighborhoodMap = renderNeighborhoodMap;
if (document.getElementById('map')) renderNeighborhoodMap();
