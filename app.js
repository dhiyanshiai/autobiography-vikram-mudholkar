// autobiography template / app.js

// ─── Default Chapters ─────────────────────────────────────────────────────────

var DEFAULT_CHAPTERS = [
  { name: 'Childhood',                              slug: '01-childhood' },
  { name: 'College Days — Engineering',             slug: '02-college-engineering' },
  { name: 'Early Career — Work after Engineering',  slug: '03-early-career' },
  { name: 'The MBA Pivot — Engineering to Finance', slug: '04-mba-pivot' },
  { name: 'Post-MBA Work — Struggles & Growth',     slug: '05-post-mba-growth' },
  { name: 'Corporate Journey — Companies & Roles',  slug: '06-corporate-journey' },
  { name: 'Family Life — Parents, Ancestors, Wife', slug: '07-family-life' },
  { name: 'Flipkart & the AI Awakening',            slug: '08-flipkart-ai' }
];

// ─── Chapter Management ───────────────────────────────────────────────────────

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function getChapters() {
  try {
    var stored = JSON.parse(localStorage.getItem('chapters') || 'null');
    return stored || DEFAULT_CHAPTERS;
  } catch(e) {
    return DEFAULT_CHAPTERS;
  }
}

function saveChapters(chapters) {
  localStorage.setItem('chapters', JSON.stringify(chapters));
}

function addChapter(name) {
  name = name.trim();
  if (!name) return;
  var chapters = getChapters();
  var slug = slugify(name);
  if (chapters.some(function(c) { return c.slug === slug; })) {
    showStatus('Chapter already exists.', 'error');
    return;
  }
  chapters.push({ name: name, slug: slug });
  saveChapters(chapters);
  renderChapterSelect(slug);
  showStatus('Chapter "' + name + '" added.', 'success');
}

function getChapterName(slug) {
  var chapters = getChapters();
  var found = chapters.filter(function(c) { return c.slug === slug; })[0];
  return found ? found.name : slug;
}

function renderChapterSelect(selectSlug) {
  var select   = document.getElementById('chapter-select');
  var current  = selectSlug || select.value;
  var chapters = getChapters();

  select.innerHTML = chapters.map(function(c) {
    return '<option value="' + c.slug + '">' + c.name + '</option>';
  }).join('') + '<option value="__add__">+ Add new chapter…</option>';

  if (current && current !== '__add__') {
    select.value = current;
  }
}

// ─── Story Management ─────────────────────────────────────────────────────────

var selectedStory = '';

function getStories(chapterSlug) {
  try {
    var all = JSON.parse(localStorage.getItem('stories') || '{}');
    return all[chapterSlug] || [];
  } catch(e) {
    return [];
  }
}

function saveStory(chapterSlug, storyName) {
  storyName = storyName.trim();
  if (!storyName) return;
  try {
    var all = JSON.parse(localStorage.getItem('stories') || '{}');
    if (!all[chapterSlug]) all[chapterSlug] = [];
    if (all[chapterSlug].indexOf(storyName) === -1) {
      all[chapterSlug].push(storyName);
    }
    localStorage.setItem('stories', JSON.stringify(all));
  } catch(e) {}
}

function renderStoryChips() {
  var chapter   = document.getElementById('chapter-select').value;
  var stories   = getStories(chapter);
  var container = document.getElementById('story-chips');

  var html = '';
  if (stories.length === 0) {
    html += '<span class="story-empty">No stories yet — tap + to add one</span>';
  } else {
    html += stories.map(function(s) {
      var active = s === selectedStory ? ' chip-active' : '';
      return '<button class="chip' + active + '" data-story="' + escapeHtml(s) + '" aria-label="Select story: ' + escapeHtml(s) + '">' + escapeHtml(s) + '</button>';
    }).join('');
  }
  html += '<button class="chip chip-add" id="add-story-btn" aria-label="Add new story">+</button>';
  container.innerHTML = html;
}

function promptAddStory() {
  var name = prompt('New story name:');
  if (name && name.trim()) {
    var chapter = document.getElementById('chapter-select').value;
    saveStory(chapter, name.trim());
    selectedStory = name.trim();
    renderStoryChips();
  }
}

// ─── Settings ────────────────────────────────────────────────────────────────

var WORKER_URL = localStorage.getItem('worker_url') || '/api/save-entry';

function getSettings() {
  return { workerUrl: localStorage.getItem('worker_url') || '' };
}

function saveSettings() {
  var workerUrl = document.getElementById('worker-url').value.trim();
  if (!workerUrl) {
    localStorage.removeItem('worker_url');
    WORKER_URL = '/api/save-entry';
  } else {
    localStorage.setItem('worker_url', workerUrl);
    WORKER_URL = workerUrl;
  }
  closeSettings();
  showStatus('Settings saved!', 'success');
}

function openSettings() {
  document.getElementById('worker-url').value = localStorage.getItem('worker_url') || '/api/save-entry';
  document.getElementById('setup-overlay').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('setup-overlay').classList.add('hidden');
}

// ─── Voice Recognition ────────────────────────────────────────────────────────

var recognition = null;
var isRecording = false;
var finalText   = '';

function initSpeechRecognition() {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return false;

  recognition = new SR();
  recognition.continuous     = true;
  recognition.interimResults = true;
  recognition.lang           = 'en-US';

  recognition.onresult = function(event) {
    var interim = '';
    finalText = '';
    for (var i = 0; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalText += event.results[i][0].transcript + ' ';
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    document.getElementById('entry-text').value = (finalText + interim).trim();
    updateCharCount();
  };

  recognition.onerror = function(event) {
    stopRecording();
    if (event.error === 'not-allowed') {
      showStatus('Microphone access denied.', 'error');
    } else if (event.error !== 'aborted') {
      showStatus('Voice error: ' + event.error + '. Try typing instead.', 'error');
    }
  };

  recognition.onend = function() {
    if (isRecording) stopRecording();
  };

  return true;
}

function toggleRecording() {
  if (isRecording) { stopRecording(); } else { startRecording(); }
}

function startRecording() {
  if (!recognition && !initSpeechRecognition()) {
    showStatus('Voice not supported. Use your keyboard mic button.', 'error');
    return;
  }
  try {
    finalText = document.getElementById('entry-text').value;
    recognition.start();
    isRecording = true;
    document.getElementById('mic-btn').classList.add('recording');
    document.getElementById('voice-status').textContent = 'Listening… tap to stop';
  } catch(e) {
    showStatus('Could not start microphone. Try again.', 'error');
  }
}

function stopRecording() {
  if (recognition) { try { recognition.stop(); } catch(e) {} }
  isRecording = false;
  document.getElementById('mic-btn').classList.remove('recording');
  document.getElementById('voice-status').textContent = 'Tap to record voice';
}

// ─── File & Markdown ──────────────────────────────────────────────────────────

function buildFilePath(chapterSlug, storySlug) {
  var now  = new Date();
  var date = now.toISOString().slice(0, 10);
  var time = now.toTimeString().slice(0, 5).replace(':', '-');
  var folder = storySlug ? 'entries/' + chapterSlug + '/' + storySlug + '/' : 'entries/' + chapterSlug + '/';
  return {
    path: folder + date + '_' + time + '_raw.md',
    date: date,
    time: now.toTimeString().slice(0, 5)
  };
}

function buildMarkdown(text, chapterSlug, chapterName, story, date, time, tags) {
  var lines = '---\ndate: ' + date + '\ntime: ' + time + '\nchapter: ' + chapterSlug + '\nchapter_name: ' + chapterName + '\n';
  if (story) lines += 'story: ' + story + '\n';
  if (tags)  lines += 'tags: [' + tags.split(',').map(function(t) { return t.trim(); }).filter(Boolean).join(', ') + ']\n';
  lines += '---\n\n' + text.trim() + '\n';
  return lines;
}

function toBase64(str) {
  var bytes  = new TextEncoder().encode(str);
  var binary = '';
  for (var i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ─── Submit ───────────────────────────────────────────────────────────────────

async function submitEntry() {
  var text        = document.getElementById('entry-text').value.trim();
  var chapterSlug = document.getElementById('chapter-select').value;
  var story       = selectedStory;
  var tags        = document.getElementById('entry-tags').value.trim();

  if (chapterSlug === '__add__') {
    showStatus('Please select or add a chapter first.', 'error');
    return;
  }
  if (!text) {
    showStatus('Please add some content before saving.', 'error');
    return;
  }

  var chapterName = getChapterName(chapterSlug);
  var storySlug   = story ? slugify(story) : '';
  var fp          = buildFilePath(chapterSlug, storySlug);
  var content     = buildMarkdown(text, chapterSlug, chapterName, story, fp.date, fp.time, tags);
  var encoded     = toBase64(content);
  var btn         = document.getElementById('submit-btn');

  btn.disabled  = true;
  btn.innerHTML = '<span class="spinner"></span> Saving…';

  try {
    var res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path:    fp.path,
        message: 'Add entry: ' + chapterName + (story ? ' / ' + story : '') + ' - ' + fp.date,
        content: encoded
      })
    });

    if (res.ok) {
      if (story) saveStory(chapterSlug, story);
      showStatus('Saved to ' + (story ? chapterName + ' / ' + story : chapterName), 'success');
      addToLocalHistory({ chapter: chapterSlug, chapterName: chapterName, story: story, date: fp.date, time: fp.time, text: text, tags: tags, preview: text.slice(0, 100) });
      localStorage.setItem('last_saved', new Date().toISOString());
      updateLastSaved();
      clearEntry(true);
    } else {
      var err = await res.json();
      showStatus('GitHub error: ' + err.message, 'error');
    }
  } catch(e) {
    showStatus('Error: ' + e.name + ' - ' + e.message, 'error');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg> Save to GitHub';
  }
}

// ─── Entry Management ─────────────────────────────────────────────────────────

function clearEntry(skipConfirm) {
  var text = document.getElementById('entry-text').value.trim();
  var tags = document.getElementById('entry-tags').value.trim();
  if (!skipConfirm && (text || tags)) {
    if (!confirm('Clear all content? This cannot be undone.')) return;
  }
  document.getElementById('entry-text').value = '';
  document.getElementById('entry-tags').value = '';
  updateCharCount();
  if (isRecording) stopRecording();
}

function updateCharCount() {
  document.getElementById('char-count').textContent = document.getElementById('entry-text').value.length;
}

// ─── Local History ────────────────────────────────────────────────────────────

var HISTORY_PAGE_SIZE = 15;
var currentHistoryPage = 1;

function addToLocalHistory(entry) {
  var history = getHistory();
  history.unshift(entry);
  localStorage.setItem('entry_history', JSON.stringify(history));
  currentHistoryPage = 1;
  renderRecentEntries();
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem('entry_history') || '[]'); }
  catch(e) { return []; }
}

function renderRecentEntries() {
  var history   = getHistory();
  var container = document.getElementById('recent-list');
  var countEl   = document.getElementById('entry-count');
  var pagerEl   = document.getElementById('recent-pagination');
  var totalEntries = history.length;
  var totalPages = Math.max(1, Math.ceil(totalEntries / HISTORY_PAGE_SIZE));

  if (currentHistoryPage > totalPages) currentHistoryPage = totalPages;

  countEl.textContent = totalEntries ? totalEntries + ' total' : '';

  if (totalEntries === 0) {
    container.innerHTML = '<p class="empty-msg">No entries yet. Start capturing your story!</p>';
    pagerEl.innerHTML = '';
    return;
  }

  var start = (currentHistoryPage - 1) * HISTORY_PAGE_SIZE;
  var pageItems = history.slice(start, start + HISTORY_PAGE_SIZE);

  container.innerHTML = pageItems.map(function(e, idx) {
    var absoluteIdx = start + idx;
    var storyBadge = e.story ? '<span class="entry-story">' + escapeHtml(e.story) + '</span>' : '';
    var fullText = e.text || e.preview;
    var isTruncated = fullText.length > 100;
    return '<div class="entry-item">' +
      '<div class="entry-meta">' +
        '<span class="entry-chapter">' + escapeHtml(e.chapterName || e.chapter) + '</span>' +
        storyBadge +
        '<span class="entry-date">' + e.date + '</span>' +
      '</div>' +
      '<p class="entry-preview">' + escapeHtml(e.preview) + (isTruncated ? '…' : '') + '</p>' +
      '<div class="entry-full hidden"><p>' + escapeHtml(fullText) + '</p>' +
        '<button class="btn-reload" data-idx="' + absoluteIdx + '">Load into editor</button>' +
      '</div>' +
    '</div>';
  }).join('');

  pagerEl.innerHTML =
    '<button class="pager-btn" data-page="' + (currentHistoryPage - 1) + '"' + (currentHistoryPage === 1 ? ' disabled' : '') + '>Previous</button>' +
    '<span class="pager-info">Page ' + currentHistoryPage + ' of ' + totalPages + '</span>' +
    '<button class="pager-btn" data-page="' + (currentHistoryPage + 1) + '"' + (currentHistoryPage === totalPages ? ' disabled' : '') + '>Next</button>';
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function updateLastSaved() {
  var ts = localStorage.getItem('last_saved');
  var el = document.getElementById('last-saved');
  if (!ts) { el.classList.add('hidden'); return; }
  var d = new Date(ts);
  var str = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  el.textContent = 'Last saved: ' + str;
  el.classList.remove('hidden');
}

// ─── Status ───────────────────────────────────────────────────────────────────

var statusTimer = null;

function showStatus(msg, type) {
  var el   = document.getElementById('status-msg');
  var icon = type === 'success' ? '\u2705 ' : type === 'error' ? '\u274c ' : '';
  el.textContent = icon + msg;
  el.className   = 'status ' + type;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (statusTimer) clearTimeout(statusTimer);
  if (type === 'success') {
    statusTimer = setTimeout(function() { el.className = 'status hidden'; }, 5000);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  // Render dynamic chapter dropdown
  renderChapterSelect();

  // Chapter change handler
  document.getElementById('chapter-select').addEventListener('change', function() {
    if (this.value === '__add__') {
      var name = prompt('New chapter name:');
      if (name && name.trim()) {
        addChapter(name.trim());
      } else {
        var chapters = getChapters();
        this.value = chapters.length ? chapters[0].slug : '';
      }
    }
    selectedStory = '';
    renderStoryChips();
  });

  // Story chip clicks — event delegation
  document.getElementById('story-chips').addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'add-story-btn') {
      promptAddStory();
    } else {
      var story = btn.dataset.story;
      selectedStory = (selectedStory === story) ? '' : story; // toggle
      renderStoryChips();
    }
  });

  // Wire buttons
  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('submit-btn').addEventListener('click', submitEntry);
  document.getElementById('mic-btn').addEventListener('click', toggleRecording);
  document.querySelector('.btn-secondary').addEventListener('click', clearEntry);
  document.getElementById('entry-text').addEventListener('input', updateCharCount);
  document.getElementById('setup-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeSettings();
  });

  // Escape key closes settings modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !document.getElementById('setup-overlay').classList.contains('hidden')) {
      closeSettings();
    }
  });

  // Recent entries — tap to expand, load into editor
  document.getElementById('recent-list').addEventListener('click', function(e) {
    var reloadBtn = e.target.closest('.btn-reload');
    if (reloadBtn) {
      var idx = parseInt(reloadBtn.dataset.idx, 10);
      var history = getHistory();
      var entry = history[idx];
      if (entry) {
        document.getElementById('entry-text').value = entry.text || entry.preview;
        document.getElementById('entry-tags').value = entry.tags || '';
        document.getElementById('chapter-select').value = entry.chapter;
        selectedStory = entry.story || '';
        renderStoryChips();
        updateCharCount();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    var item = e.target.closest('.entry-item');
    if (item) {
      var full = item.querySelector('.entry-full');
      if (full) full.classList.toggle('hidden');
    }
  });

  document.getElementById('recent-pagination').addEventListener('click', function(e) {
    var btn = e.target.closest('.pager-btn');
    if (!btn || btn.disabled) return;
    var targetPage = parseInt(btn.dataset.page, 10);
    if (!isNaN(targetPage) && targetPage > 0) {
      currentHistoryPage = targetPage;
      renderRecentEntries();
    }
  });

  // URL params (Siri Shortcut)
  var params  = new URLSearchParams(window.location.search);
  var urlText = params.get('text');
  var urlChap = params.get('chapter');
  var urlStory = params.get('story');

  if (urlText)  { document.getElementById('entry-text').value  = urlText;  updateCharCount(); }
  if (urlChap)  { document.getElementById('chapter-select').value = urlChap; }
  if (urlStory) { selectedStory = urlStory; }

  renderStoryChips();
  renderRecentEntries();
  updateLastSaved();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
