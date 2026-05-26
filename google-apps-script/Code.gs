const EXPECTED_TOKEN = 'REPLACE_WITH_LONG_RANDOM_TOKEN';
const SPREADSHEET_ID = '1ai9SncQwuchov4HyiuDBFnTUirgexUwIWMPnm2WsCPk';

const TABS = {
  residents: ['id','name','email','phone','status','role','address','lot','parcel','directoryOptIn','passwordHash','householdContacts','createdAt','approvedAt'],
  requests: ['id','caseNumber','type','status','description','residentId','residentName','residentEmail','lot','parcel','address','fileLink','attachmentName','attachmentUrl','adminNote','createdAt','updatedAt'],
  documents: ['id','name','category','url','description','driveFileId'],
  audit_logs: ['id','timestamp','actorId','action','details'],
  forum_categories: ['id','name','description','createdAt'],
  forum_threads: ['id','categoryId','title','authorId','authorName','status','locked','pinned','createdAt','updatedAt'],
  forum_posts: ['id','threadId','parentId','authorId','authorName','body','attachmentName','attachmentUrl','mentions','reported','createdAt','updatedAt'],
  forum_subscriptions: ['id','residentId','categoryId','threadId','subscribed','updatedAt'],
  newsletters: ['id','subject','body','attachmentName','attachmentUrl','status','sendAt','sentAt','expiresAt','recipientCount','createdAt'],
  polls: ['id','question','answerType','options','startDate','endDate','anonymous','showResults','status','createdAt'],
  poll_responses: ['id','pollId','residentId','residentName','answers','freeText','anonymous','createdAt'],
  bulletins: ['id','title','category','body','authorId','authorName','status','startDate','expiresAt','attachmentName','attachmentUrl','createdAt','updatedAt'],
  notifications: ['id','type','residentId','email','subject','message','status','createdAt'],
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
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const state = sheet.getSheetByName('app_state');
  if (!state || !state.getRange('A2').getValue()) return null;
  return JSON.parse(state.getRange('A2').getValue());
}

function saveState(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  writeStateSheet(sheet, data);
  writeRows(sheet, 'residents', TABS.residents, (((data.portal || {}).residents) || []));
  writeRows(sheet, 'requests', TABS.requests, (((data.portal || {}).requests) || []));
  writeRows(sheet, 'documents', TABS.documents, (((data.portal || {}).documents) || []));
  writeRows(sheet, 'audit_logs', TABS.audit_logs, (((data.portal || {}).auditLogs) || []));
  writeRows(sheet, 'forum_categories', TABS.forum_categories, (((data.portal || {}).forumCategories) || []));
  writeRows(sheet, 'forum_threads', TABS.forum_threads, (((data.portal || {}).forumThreads) || []));
  writeRows(sheet, 'forum_posts', TABS.forum_posts, (((data.portal || {}).forumPosts) || []));
  writeRows(sheet, 'forum_subscriptions', TABS.forum_subscriptions, (((data.portal || {}).forumSubscriptions) || []));
  writeRows(sheet, 'newsletters', TABS.newsletters, (((data.portal || {}).newsletters) || []));
  writeRows(sheet, 'polls', TABS.polls, (((data.portal || {}).polls) || []));
  writeRows(sheet, 'poll_responses', TABS.poll_responses, (((data.portal || {}).pollResponses) || []));
  writeRows(sheet, 'bulletins', TABS.bulletins, (((data.portal || {}).bulletins) || []));
  writeRows(sheet, 'notifications', TABS.notifications, (((data.portal || {}).notifications) || []));
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
