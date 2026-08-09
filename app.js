/**
 * WAEC Result Upgrade Portal – Gambia
 * app.js
 *
 * Handles splash screen, form validation, modal display, and WhatsApp redirect.
 */

/* ══════════════════════════════════════════════════
   SPLASH SCREEN CONTROLLER
   Total duration: ~4 seconds
   - 0.0s  → logo spins in (CSS handles this)
   - 1.4s  → text fades up (CSS handles this)
   - 1.8s  → progress bar starts filling (JS)
   - 3.6s  → progress bar hits 100%
   - 3.8s  → splash fades out
   - 4.5s  → splash removed from DOM
══════════════════════════════════════════════════ */
(function initSplash() {
  const splash  = document.getElementById('splash');
  const barFill = document.getElementById('splashBar');

  if (!splash || !barFill) return;

  // Prevent page scroll while splash is visible
  document.body.style.overflow = 'hidden';

  // ── Animate progress bar ─────────────────────────
  // Starts at 1800ms, completes at 3600ms → 1800ms window
  const BAR_START    = 1800;  // ms
  const BAR_DURATION = 1800;  // ms
  const BAR_INTERVAL = 30;    // tick every 30ms → smooth

  let elapsed = 0;

  const barTimer = setTimeout(function () {
    const ticker = setInterval(function () {
      elapsed += BAR_INTERVAL;
      const pct = Math.min((elapsed / BAR_DURATION) * 100, 100);
      barFill.style.width = pct + '%';
      if (pct >= 100) clearInterval(ticker);
    }, BAR_INTERVAL);
  }, BAR_START);

  // ── Dismiss splash ───────────────────────────────
  setTimeout(function () {
    splash.classList.add('hide');                    // CSS fade out (0.7s)
    document.body.style.overflow = '';               // restore scroll

    // Remove from DOM after transition ends
    setTimeout(function () {
      splash.remove();
    }, 750);
  }, 3800);

})();



(function () {
  'use strict';

  /* ── CONFIG ─────────────────────────────── */
  const WHATSAPP_NUMBER = '2349066692066';

  const SUBJECTS = [
    'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
    'Economics', 'Geography', 'History', 'Civic Education', 'Agricultural Science',
    'Further Mathematics', 'Commerce', 'Accounts', 'Literature in English',
    'Government', 'French', 'Computer Studies', 'Technical Drawing',
    'Food and Nutrition', 'Visual Art', 'Music', 'Physical Education',
    'Islamic Religious Studies', 'Christian Religious Studies',
  ];

  const GRADES = ['A1','B2','B3','C4','C5','C6','D7','E8','F9'];

  /* ── DOM REFS ───────────────────────────── */
  const form          = document.getElementById('upgradeForm');
  const subjectsList  = document.getElementById('subjectsList');
  const modalOverlay  = document.getElementById('modalOverlay');
  const modalDetails  = document.getElementById('modalDetails');
  const modalWaBtn    = document.getElementById('modalWhatsappBtn');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  const nameField  = document.getElementById('candidateName');
  const indexField = document.getElementById('indexNumber');
  const errName    = document.getElementById('err-name');
  const errIndex   = document.getElementById('err-index');

  /* ── SUBJECT ROWS ───────────────────────── */
  let rowCount = 0;

  function buildSubjectOptions(selectedVal) {
    return SUBJECTS.map(s =>
      `<option value="${s}"${s === selectedVal ? ' selected' : ''}>${s}</option>`
    ).join('');
  }

  function buildGradeOptions(selectedVal) {
    return GRADES.map(g =>
      `<option value="${g}"${g === selectedVal ? ' selected' : ''}>${g}</option>`
    ).join('');
  }

  function addRow(subjectVal, gradeVal) {
    rowCount++;
    const id = rowCount;

    const row = document.createElement('div');
    row.className = 'subject-row';
    row.dataset.rowId = id;
    row.innerHTML = `
      <div class="form-group" style="margin:0">
        <label style="font-size:0.75rem;margin-bottom:4px;display:block;color:#4a5568">Subject to Upgrade</label>
        <select class="row-subject" data-row="${id}" aria-label="Subject to upgrade">
          <option value="">— Select subject —</option>
          ${buildSubjectOptions(subjectVal || '')}
        </select>
      </div>
      <div class="form-group" style="margin:0">
        <label style="font-size:0.75rem;margin-bottom:4px;display:block;color:#4a5568">Current Grade</label>
        <select class="row-grade" data-row="${id}" aria-label="Current grade">
          <option value="">Grade —</option>
          ${buildGradeOptions(gradeVal || '')}
        </select>
      </div>
      <button type="button" class="btn-remove-row" data-row="${id}" aria-label="Remove this subject row" title="Remove">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <span class="row-error" id="row-err-${id}"></span>
    `;

    subjectsList.appendChild(row);

    // Remove button
    row.querySelector('.btn-remove-row').addEventListener('click', function () {
      // Always keep at least one row
      if (subjectsList.querySelectorAll('.subject-row').length > 1) {
        row.remove();
      }
    });

    // Auto-add new row when both selects in last row are filled
    const subjectSel = row.querySelector('.row-subject');
    const gradeSel   = row.querySelector('.row-grade');

    function onRowChange() {
      const isLast = row === subjectsList.lastElementChild;
      if (isLast && subjectSel.value && gradeSel.value) {
        addRow();
      }
    }

    subjectSel.addEventListener('change', onRowChange);
    gradeSel.addEventListener('change', onRowChange);

    return row;
  }

  // Start with one empty row
  addRow();

  /* ── TOP FIELD HELPERS ──────────────────── */
  function setTopError(field, errEl, msg) {
    field.classList.add('invalid');
    errEl.textContent = msg;
  }

  function clearTopError(field, errEl) {
    field.classList.remove('invalid');
    errEl.textContent = '';
  }

  nameField.addEventListener('input',  () => clearTopError(nameField,  errName));
  indexField.addEventListener('input', () => clearTopError(indexField, errIndex));

  /* ── VALIDATION ─────────────────────────── */
  function validateForm() {
    let valid = true;

    // Name
    const name = nameField.value.trim();
    if (!name) {
      setTopError(nameField, errName, 'Candidate name is required.');
      valid = false;
    } else if (name.length < 3) {
      setTopError(nameField, errName, 'Please enter your full name.');
      valid = false;
    } else {
      clearTopError(nameField, errName);
    }

    // Index Number
    const index = indexField.value.trim();
    if (!index) {
      setTopError(indexField, errIndex, 'Index number is required.');
      valid = false;
    } else if (!/^\d{10}$/.test(index)) {
      setTopError(indexField, errIndex, 'Index number must be exactly 10 digits.');
      valid = false;
    } else {
      clearTopError(indexField, errIndex);
    }

    // Subject rows — at least one must be fully filled
    const rows = subjectsList.querySelectorAll('.subject-row');
    let hasOneValid = false;

    rows.forEach(row => {
      const subSel  = row.querySelector('.row-subject');
      const grdSel  = row.querySelector('.row-grade');
      const errSpan = row.querySelector('.row-error');
      const rowId   = row.dataset.rowId;
      const isLast  = row === subjectsList.lastElementChild;

      // Skip fully empty last row (auto-added placeholder)
      if (isLast && !subSel.value && !grdSel.value) return;

      subSel.classList.remove('invalid');
      grdSel.classList.remove('invalid');
      errSpan.textContent = '';

      let rowOk = true;

      if (!subSel.value) {
        subSel.classList.add('invalid');
        rowOk = false;
      }
      if (!grdSel.value) {
        grdSel.classList.add('invalid');
        rowOk = false;
      }

      if (!rowOk) {
        errSpan.textContent = 'Please select both subject and grade.';
        valid = false;
      } else {
        hasOneValid = true;
      }
    });

    if (!hasOneValid && valid) {
      // No filled rows at all
      const firstRow = subjectsList.querySelector('.subject-row');
      if (firstRow) {
        firstRow.querySelector('.row-subject').classList.add('invalid');
        firstRow.querySelector('.row-error').textContent = 'Please select at least one subject to upgrade.';
      }
      valid = false;
    }

    return valid;
  }

  /* ── COLLECT SUBJECTS ────────────────────── */
  function collectSubjects() {
    const result = [];
    const rows = subjectsList.querySelectorAll('.subject-row');
    rows.forEach((row, idx) => {
      const subSel = row.querySelector('.row-subject');
      const grdSel = row.querySelector('.row-grade');
      const isLast = row === subjectsList.lastElementChild;
      if (isLast && !subSel.value && !grdSel.value) return;
      if (subSel.value && grdSel.value) {
        result.push({ subject: subSel.value, grade: grdSel.value });
      }
    });
    return result;
  }

  /* ── BUILD WHATSAPP MESSAGE ─────────────── */
  function buildWhatsAppUrl(data) {
    const subjectLines = data.subjects.map((s, i) =>
      `  ${i + 1}. ${s.subject} (Current: ${s.grade})`
    ).join('\n');

    const msg = [
      `Hello, I'd like to proceed with my WAEC Result Upgrade payment.`,
      ``,
      `📋 *Application Details:*`,
      `• Name:         ${data.name}`,
      `• Index Number: ${data.index}`,
      `• Year:         2026 WASSCE`,
      ``,
      `📚 *Subjects to Upgrade (${data.subjects.length}):*`,
      subjectLines,
      ``,
      `Please guide me on how to complete the payment. Thank you.`,
    ].join('\n');

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }

  /* ── MODAL ──────────────────────────────── */
  function openModal(data) {
    const subjectRows = data.subjects.map((s, i) => `
      <div style="align-items:flex-start">
        <span>Subject ${i + 1}</span>
        <strong>${escHtml(s.subject)} &nbsp;<span style="color:#718096;font-weight:500">(${escHtml(s.grade)})</span></strong>
      </div>`).join('');

    modalDetails.innerHTML = `
      <div><span>Candidate Name</span><strong>${escHtml(data.name)}</strong></div>
      <div><span>Index Number</span><strong>${escHtml(data.index)}</strong></div>
      ${subjectRows}
    `;

    const url = buildWhatsAppUrl(data);
    modalWaBtn.onclick = () => {
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    modalWaBtn.focus();
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) closeModal();
  });

  /* ── FORM SUBMIT ────────────────────────── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validateForm()) {
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus();
      }
      return;
    }

    openModal({
      name:     nameField.value.trim(),
      index:    indexField.value.trim(),
      subjects: collectSubjects(),
    });
  });

  /* ── UTILS ──────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── NAV ACTIVE STATE ───────────────────── */
  document.querySelectorAll('.main-nav a').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelectorAll('.main-nav a').forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

})();


