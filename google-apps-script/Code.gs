const EXPECTED_TOKEN = 'REPLACE_WITH_LONG_RANDOM_TOKEN';

const TABS = {
  residents: ['id','name','email','phone','status','role','address','lot','parcel','directoryOptIn','passwordHash','householdContacts','createdAt','approvedAt'],
  requests: ['id','caseNumber','type','status','description','residentId','residentName','residentEmail','lot','parcel','address','fileLink','attachmentName','attachmentUrl','adminNote','createdAt','updatedAt'],
  documents: ['id','name','category','url','description','driveFileId'],
  audit_logs: ['id','timestamp','actorId','action','details'],
  directory: ['name','address','email','phone','optIn','updatedAt'],
  map_lots: ['id','lot','address','city','state','zip','parcel','phase','lat','lng','zillowUrl']
};

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if (body.token !== EXPECTED_TOKEN) return json({ ok: false, error: 'Unauthorized' }, 401);
    if (body.action === 'save') {
      saveState(body.data || {});
      return json({ ok: true });
    }
    return json({ ok: true, data: loadState() });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) }, 500);
  }
}

function doGet() {
  return json({ ok: false, error: 'Use POST through the Netlify function.' }, 405);
}

function loadState() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const state = sheet.getSheetByName('app_state');
  if (!state || !state.getRange('A2').getValue()) return null;
  return JSON.parse(state.getRange('A2').getValue());
}

function saveState(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  writeStateSheet(sheet, data);
  writeRows(sheet, 'residents', TABS.residents, (((data.portal || {}).residents) || []));
  writeRows(sheet, 'requests', TABS.requests, (((data.portal || {}).requests) || []));
  writeRows(sheet, 'documents', TABS.documents, (((data.portal || {}).documents) || []));
  writeRows(sheet, 'audit_logs', TABS.audit_logs, (((data.portal || {}).auditLogs) || []));
  writeRows(sheet, 'directory', TABS.directory, data.directory || []);
  writeRows(sheet, 'map_lots', TABS.map_lots, data.mapLots || []);
}

function writeStateSheet(sheet, data) {
  const tab = ensureSheet(sheet, 'app_state');
  tab.clearContents();
  tab.getRange(1, 1, 1, 2).setValues([['key', 'json']]);
  tab.getRange(2, 1, 1, 2).setValues([['current', JSON.stringify(data)]]);
}

function writeRows(sheet, name, headers, rows) {
  const tab = ensureSheet(sheet, name);
  tab.clearContents();
  tab.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (!rows.length) return;
  const values = rows.map(row => headers.map(header => serialize(row[header])));
  tab.getRange(2, 1, values.length, headers.length).setValues(values);
}

function ensureSheet(sheet, name) {
  return sheet.getSheetByName(name) || sheet.insertSheet(name);
}

function serialize(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value);
  return value;
}

function json(payload, status) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
