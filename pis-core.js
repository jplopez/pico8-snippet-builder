// Change: Each folder to be loaded must have its own snippets.json listing files to load.
// Each entry is either "file.lua" or "/*" (all .lua files in that folder, non-recursive).
// No recursion or subfolder support unless you add their folder to foldersToScan.

const SNIPPETS_FOLDER = 'snippets/';
const SNIPPETS_LIST_URL = 'snippets/snippets.json'; // This can be used to list folders to scan

let currentLayout = 'list';

// function setLayout(layout) {
//   currentLayout = layout;
//   const container = document.getElementById('snippetsContainer');
//   if (layout === 'grid') {
//     container.classList.remove('snippets-list');
//     container.classList.add('snippets-grid');
//     document.getElementById('layoutListBtn').classList.remove('active');
//     document.getElementById('layoutGridBtn').classList.add('active');
//   } else {
//     container.classList.remove('snippets-grid');
//     container.classList.add('snippets-list');
//     document.getElementById('layoutGridBtn').classList.remove('active');
//     document.getElementById('layoutListBtn').classList.add('active');
//   }
// }

function setLayout(layout) {
  currentLayout = layout;
  // For grouped UI, update all .folder-snippets divs
  const folderSections = document.querySelectorAll('.folder-snippets');
  if (layout === 'grid') {
    folderSections.forEach(div => {
      div.classList.remove('snippets-list');
      div.classList.add('snippets-grid');
    });
    document.getElementById('layoutListBtn').classList.remove('active');
    document.getElementById('layoutGridBtn').classList.add('active');
  } else {
    folderSections.forEach(div => {
      div.classList.remove('snippets-grid');
      div.classList.add('snippets-list');
    });
    document.getElementById('layoutGridBtn').classList.remove('active');
    document.getElementById('layoutListBtn').classList.add('active');
  }
}

// Helper: list .lua files in a folder (non-recursive)
async function listLuaFilesInFolder(folder) {
  try {
    const res = await fetch(`${SNIPPETS_FOLDER}${folder}/`);
    if (!res.ok) return [];
    const text = await res.text();
    // Extract .lua files from directory listing
    const matches = [...text.matchAll(/href="([^"]+\.lua)"/g)];
    //console.log(matches);
    return matches.map(m => `${m[1]}`);
  } catch {
    return [];
  }
}


async function loadSnippets() {
  const container = document.getElementById('snippetsSections');
  container.innerHTML = '';
  let foldersToScan = [];
  try {
    const res = await fetch(SNIPPETS_LIST_URL);
    if (!res.ok) throw new Error('HTTP error');
    foldersToScan = await res.json();
  } catch (e) {
    container.innerHTML = 'Failed to load folder list.<br>Make sure you are running a local web server and accessing via http://, not file://';
    return;
  }

  let folderFilesMap = {};
  for (const folder of foldersToScan) {
    const luaFiles = await listLuaFilesInFolder(folder);
    folderFilesMap[folder] = luaFiles;
  }

  let sectionIdx = 0;
  for (const folder of foldersToScan) {
    const files = folderFilesMap[folder];
    if (!files || files.length === 0) continue;
    const collapseId = `collapseFolder${sectionIdx}`;
    const folderLabel = folder ? folder : 'root';
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'accordion-item';
    sectionDiv.innerHTML = `
      <button class="accordion-button w-100 text-start" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="true" aria-controls="${collapseId}">
        <span class="fw-bold">${folderLabel} : ${files.length} file(s)</span>
      </button>
      <div id="${collapseId}" class="accordion-collapse collapse show" data-b-parent="${collapseId}"  >
        <div class="folder-snippets"></div>
      </div>
    `;
    container.appendChild(sectionDiv);
    const folderSnippetsDiv = sectionDiv.querySelector('.folder-snippets');
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `snippet_${folderLabel.replace(/\\W/g,'_')}_${i}`;
      const div = document.createElement('div');
      div.className = 'snippet rounded position-relative';
      div.innerHTML = `
      <div class="d-flex align-items-center justify-content-between mb-2">
        <div>
          <input type="checkbox" id="${id}" class="form-check-input align-middle me-2">
          <label for="${id}" class="form-check-label align-middle mb-0">${file}</label>
        </div>
        <div class="d-flex align-items-center">
          <div class="btn-group me-2" role="group">
            <button type="button" class="btn btn-sm btn-outline-secondary" title="Copy snippet" onclick="copySnippet('${id}_code')">
              Copy
            </button>
            <button type="button" class="btn btn-sm btn-outline-success" title="Edit snippet" onclick="editSnippet('${id}_code')">
              Edit
            </button>
          </div>
          <span 
            class="badge rounded-pill bg-info text-dark align-middle"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="Edit opens OneCompiler in a new tab and copies the snippet to your clipboard. Paste (Ctrl+V) in the editor to start editing online.">
            ?
          </span>
        </div>
      </div>
      <pre class="mb-0"><code id="${id}_code" class="language-lua">Loading...</code></pre>
    `;
      folderSnippetsDiv.appendChild(div);
      fetch(file)
        .then(r => r.ok ? r.text() : Promise.reject())
        .then(code => {
          const escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          document.getElementById(id + '_code').innerHTML = escaped;
          Prism.highlightElement(document.getElementById(id + '_code'));
        })
        .catch(() => {
          document.getElementById(id + '_code').textContent = 'Failed to load. (Check CORS or server)';
        });
    }
    sectionIdx++;
  }

  setLayout(currentLayout);
  if (window.bootstrap && bootstrap.Tooltip) {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
}

function getSnippets() {
  const snippets = [];
  const container = document.getElementById('snippetsSections');
  const divs = container.querySelectorAll('.snippet');
  divs.forEach(div => {
    const cb = div.querySelector('input[type="checkbox"]');
    const code = div.querySelector('code');
    if (cb.checked && code) snippets.push(code.textContent);
  });
  return snippets;
}

function minimizeLua(code) {
  // Remove comments and extra whitespace (simple version)
  return code
    .replace(/--.*$/gm, '') // remove comments
    .replace(/^\s*[\r\n]/gm, '') // remove empty lines
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/\s*([=,+\-*/(){}])\s*/g, '$1') // trim around operators
    .trim();
}


function updateSelectedCount() {
  const container = document.getElementById('snippetsSections');
  const count = container.querySelectorAll('.snippet input[type="checkbox"]:checked').length;
  document.getElementById('selectedCount').textContent = `Selected ${count} snippets`;
}

// Update count on checkbox change
function setupCheckboxListeners() {
  const container = document.getElementById('snippetsSections');
  container.addEventListener('change', function (e) {
    if (e.target && e.target.type === 'checkbox') {
      updateSelectedCount();
    }
  });
}

// Modified generateFile to accept minimize flag
function generateFile(minimize) {
  let code = getSnippets().join('\n\n');
  if (minimize) {
    code = minimizeLua(code);
  }

  // Download as file
  const blob = new Blob([code], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = minimize ? 'pico8_code.min.lua' : 'pico8_code.lua';
  a.click();
}

function copySnippet(codeId) {
  const codeElem = document.getElementById(codeId);
  if (!codeElem) return;
  // Create a temporary textarea to copy the raw text
  const temp = document.createElement('textarea');
  temp.value = codeElem.textContent;
  document.body.appendChild(temp);
  temp.select();
  document.execCommand('copy');
  document.body.removeChild(temp);

  // Get snippet name from the label
  let snippetName = '';
  const snippetDiv = codeElem.closest('.snippet');
  if (snippetDiv) {
    const label = snippetDiv.querySelector('label');
    if (label) snippetName = label.textContent.trim();
  }

  showCopyToast(snippetName);
}

function editSnippet(codeId) {
  const codeElem = document.getElementById(codeId);
  if (!codeElem) return;
  const code = codeElem.textContent;

  // Copy code to clipboard for user convenience
  const temp = document.createElement('textarea');
  temp.value = code;
  document.body.appendChild(temp);
  temp.select();
  document.execCommand('copy');
  document.body.removeChild(temp);

  // Open OneCompiler Lua editor in a new tab
  window.open('https://onecompiler.com/lua', '_blank');

  // Optionally, show a toast to instruct the user
  showCopyToast('Paste in OneCompiler');
}

function showCopyToast(snippetName) {
  const toastBody = document.getElementById('copyToastBody');
  toastBody.textContent = `Snippet "${snippetName}" was copied to the clipboard`;

  const toastEl = document.getElementById('copyToast');
  // Bootstrap 5 Toast
  if (window.bootstrap && bootstrap.Toast) {
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3000 });
    toast.show();
  } else {
    // Fallback: show/hide manually if Bootstrap JS is not loaded
    toastEl.style.display = 'block';
    setTimeout(() => { toastEl.style.display = 'none'; }, 3000);
  }
}

// // Load snippets on page load
// window.addEventListener('DOMContentLoaded', loadSnippets);

// Load snippets on page load
window.addEventListener('DOMContentLoaded', () => {
  loadSnippets();
  updateSelectedCount();
  setupCheckboxListeners();
});