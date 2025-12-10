// combined-script.js - FIXED VERSION WITH UPLOAD PROGRESS
// ⚠️ UPDATE THIS WITH YOUR NGROK URL EVERY TIME
const NGROK_URL = " https://d08d671b8506.ngrok-free.app";
const API_KEY = "aansh";

let currentPath = "";
let currentViewingFile = "";

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadFiles();
  initializeUploadArea();
});


// Load files and folders
async function loadFiles(path = "") {
  try {
    const listDiv = document.getElementById("file-list");
    listDiv.innerHTML = '<div class="loading">Loading files...</div>';

    const url = new URL(`${NGROK_URL}/files`);
    url.searchParams.append("api_key", API_KEY);
    if (path) {
      // Use encodeURIComponent for path parameter
      url.searchParams.append("path", encodeURIComponent(path));
    }

    console.log('Loading files from:', url.toString());
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const files = await res.json();
    currentPath = path;

    updateBreadcrumb();
    renderFileList(files);
  } catch (err) {
    console.error(err);
    document.getElementById("file-list").innerHTML = 
      `<div class="error">Error loading files: ${err.message}</div>`;
  }
}

// Render file list - FIXED PATH HANDLING
function renderFileList(files) {
  const listDiv = document.getElementById("file-list");
  listDiv.innerHTML = "";

  if (files.length === 0) {
    listDiv.innerHTML = '<div class="loading">No files in this directory</div>';
    return;
  }

  // Sort: directories first, then files
  files.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  files.forEach((file) => {
    const fileDiv = document.createElement("div");
    fileDiv.className = "file-item";

    const icon = file.isDirectory ? "📁" : getFileIcon(file.name);
    
    // FIX: Properly construct file path
    let filePath;
    if (currentPath) {
      filePath = `${currentPath}/${file.name}`;
    } else {
      filePath = file.name;
    }
    
    const ext = file.name.split('.').pop().toUpperCase();

    fileDiv.innerHTML = `
      <div class="file-info" data-file-path="${filePath}" data-is-directory="${file.isDirectory}">
        <span class="file-icon">${icon}</span>
        <span class="file-name">${file.name}</span>
        ${!file.isDirectory ? `<span class="file-type-badge">${ext}</span>` : ''}
      </div>
      <div class="file-actions">
        ${!file.isDirectory ? `
          <button class="view-btn" data-file-path="${filePath}">👁️ View</button>
          <button class="download-btn" data-file-path="${filePath}">⬇️ Download</button>
        ` : ''}
        <button class="danger delete-btn" data-file-path="${filePath}" data-is-directory="${file.isDirectory}">🗑️</button>
      </div>
    `;

    listDiv.appendChild(fileDiv);
  });

  // Add event listeners after rendering
  attachEventListeners();
}

// FIX: Attach event listeners properly
function attachEventListeners() {
  const fileItems = document.querySelectorAll('.file-info');
  const viewButtons = document.querySelectorAll('.view-btn');
  const downloadButtons = document.querySelectorAll('.download-btn');
  const deleteButtons = document.querySelectorAll('.delete-btn');

  // File item click (for folders and files)
  fileItems.forEach(item => {
    item.addEventListener('click', function() {
      const filePath = this.getAttribute('data-file-path');
      const isDirectory = this.getAttribute('data-is-directory') === 'true';
      
      if (isDirectory) {
        loadFiles(filePath);
      } else {
        viewFile(filePath);
      }
    });
  });

  // View buttons
  viewButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const filePath = this.getAttribute('data-file-path');
      viewFile(filePath);
    });
  });

  // Download buttons
  downloadButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const filePath = this.getAttribute('data-file-path');
      downloadFile(filePath);
    });
  });

  // Delete buttons
  deleteButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const filePath = this.getAttribute('data-file-path');
      const isDirectory = this.getAttribute('data-is-directory') === 'true';
      deleteFile(filePath, isDirectory);
    });
  });
}

// Get file icon based on extension
function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    pdf: '📕',
    doc: '📘', docx: '📘',
    xls: '📗', xlsx: '📗',
    ppt: '📙', pptx: '📙',
    txt: '📄',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️',
    mp4: '🎬', avi: '🎬', mkv: '🎬', mov: '🎬', webm: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵', m4a: '🎵',
    zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
    js: '📜', py: '📜', java: '📜', cpp: '📜', c: '📜',
    html: '🌐', css: '🌐', json: '🌐', xml: '🌐',
  };
  return icons[ext] || '📄';
}

// Update breadcrumb navigation
function updateBreadcrumb() {
  const breadcrumb = document.getElementById("breadcrumb");
  const parts = currentPath ? currentPath.split("/") : [];
  
  let html = '<span class="breadcrumb-item" data-path="">🏠 Home</span>';
  
  let accumulated = "";
  parts.forEach((part, index) => {
    accumulated += (index > 0 ? "/" : "") + part;
    html += ` / <span class="breadcrumb-item" data-path="${accumulated}">${part}</span>`;
  });
  
  breadcrumb.innerHTML = html;

  // Add event listeners to breadcrumb items
  const breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
  breadcrumbItems.forEach(item => {
    item.addEventListener('click', function() {
      const path = this.getAttribute('data-path');
      loadFiles(path);
    });
  });
}

// View file content - FIXED PATH ENCODING
async function viewFile(filePath) {
  try {
    console.log('Viewing file:', filePath);
    
    currentViewingFile = filePath;
    const contentDiv = document.getElementById("file-content");
    const viewerSection = document.getElementById("viewer-section");
    const viewerTitle = document.getElementById("viewer-title");
    
    if (!viewerSection || !contentDiv || !viewerTitle) {
      console.error('Viewer elements not found');
      return;
    }
    
    viewerSection.style.display = "block";
    viewerTitle.textContent = `📄 ${filePath.split('/').pop()}`;
    contentDiv.innerHTML = '<div class="loading">Loading file...</div>';

    // Scroll to viewer
    viewerSection.scrollIntoView({ behavior: 'smooth' });

    const url = new URL(`${NGROK_URL}/view`);
    url.searchParams.append("api_key", API_KEY);
    // FIX: Use encodeURIComponent for file parameter
    url.searchParams.append("file", encodeURIComponent(filePath));

    const fileUrl = url.toString();
    const ext = filePath.split('.').pop().toLowerCase();

    console.log('File URL:', fileUrl);
    console.log('File extension:', ext);

    // Determine file type and render appropriately
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
      // Images
      contentDiv.innerHTML = `<img src="${fileUrl}" alt="${filePath}" style="max-width: 100%; max-height: 80vh; border-radius: 8px;" onerror="this.onerror=null; this.alt='Image failed to load';" />`;
    } 
    else if (['mp4', 'webm', 'ogg', 'avi', 'mkv', 'mov'].includes(ext)) {
      // Videos
      contentDiv.innerHTML = `
        <video controls style="max-width: 100%; max-height: 80vh; border-radius: 8px;">
          <source src="${fileUrl}" type="video/${ext}">
          Your browser doesn't support video playback.
        </video>
      `;
    } 
    else if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) {
      // Audio
      contentDiv.innerHTML = `
        <audio controls style="width: 100%; max-width: 500px; margin: 20px 0;">
          <source src="${fileUrl}" type="audio/${ext}">
          Your browser doesn't support audio playback.
        </audio>
      `;
    } 
    else if (['pdf'].includes(ext)) {
      // PDF - Multiple viewing options
      contentDiv.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="margin-bottom: 20px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button onclick="viewPdfMethod('iframe', '${filePath}')" class="pdf-method-btn">📄 View (Method 1)</button>
            <button onclick="viewPdfMethod('google', '${filePath}')" class="pdf-method-btn">📄 View (Method 2)</button>
            <button onclick="viewPdfMethod('mozilla', '${filePath}')" class="pdf-method-btn">📄 View (Method 3)</button>
            <button onclick="window.open('${fileUrl}', '_blank')" class="pdf-method-btn">🔗 Open in Tab</button>
            <button onclick="downloadFile('${filePath}')" class="pdf-method-btn">⬇️ Download</button>
          </div>
          <div id="pdf-container"></div>
        </div>
      `;
      
      // Try first method automatically
      viewPdfMethod('iframe', filePath);
    } 
    else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
      // Microsoft Office files - use Google Docs Viewer or Office Online
      const encodedUrl = encodeURIComponent(fileUrl);
      contentDiv.innerHTML = `
        <iframe id="file-viewer" src="https://docs.google.com/viewer?url=${encodedUrl}&embedded=true" style="width: 100%; height: 70vh; border: 2px solid #333; border-radius: 8px;">
          <p>Unable to preview this file type. 
          <button onclick="downloadFile('${filePath}')">Download File</button></p>
        </iframe>
      `;
    }
    else if (['txt', 'md', 'json', 'xml', 'csv', 'log', 'js', 'py', 'java', 'c', 'cpp', 'html', 'css', 'sh', 'yml', 'yaml', 'conf', 'ini'].includes(ext)) {
      // Text files
      try {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        contentDiv.innerHTML = `<pre style="background: #f5f5f5; padding: 20px; border-radius: 8px; overflow-x: auto; white-space: pre-wrap;">${escapeHtml(text)}</pre>`;
      } catch (fetchError) {
        contentDiv.innerHTML = `
          <div class="error">
            Error loading text file: ${fetchError.message}<br>
            <button onclick="downloadFile('${filePath}')">Download Instead</button>
          </div>
        `;
      }
    }
    else {
      // Unsupported file - show download option
      contentDiv.innerHTML = `
        <div class="loading" style="text-align: center; padding: 40px;">
          <p style="font-size: 18px; margin-bottom: 20px;">Cannot preview .${ext} files in browser</p>
          <button onclick="downloadFile('${filePath}')" style="margin-top: 15px; padding: 10px 20px; font-size: 16px;">⬇️ Download File</button>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error in viewFile:', err);
    const contentDiv = document.getElementById("file-content");
    if (contentDiv) {
      contentDiv.innerHTML = 
        `<div class="error">Error viewing file: ${err.message}<br>
         <button onclick="downloadFile('${currentViewingFile}')">Try Downloading Instead</button>
        </div>`;
    }
  }
}

// PDF viewing methods - FIXED PATH ENCODING
function viewPdfMethod(method, filePath) {
  const container = document.getElementById('pdf-container');
  if (!container) return;
  
  const viewUrl = `${NGROK_URL}/view?api_key=${API_KEY}&file=${encodeURIComponent(filePath)}`;
  
  if (method === 'iframe') {
    // Direct iframe
    container.innerHTML = `
      <iframe src="${viewUrl}#toolbar=1&navpanes=1&scrollbar=1" 
              style="width: 100%; height: 70vh; border: 2px solid #333; border-radius: 8px;">
      </iframe>
    `;
  } else if (method === 'google') {
    // Google Docs Viewer
    container.innerHTML = `
      <iframe src="https://docs.google.com/viewer?url=${encodeURIComponent(viewUrl)}&embedded=true" 
              style="width: 100%; height: 70vh; border: 2px solid #333; border-radius: 8px;">
      </iframe>
    `;
  } else if (method === 'mozilla') {
    // Mozilla PDF.js
    container.innerHTML = `
      <iframe src="https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(viewUrl)}" 
              style="width: 100%; height: 70vh; border: 2px solid #333; border-radius: 8px;">
      </iframe>
    `;
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Close viewer
function closeViewer() {
  const viewerSection = document.getElementById("viewer-section");
  if (viewerSection) {
    viewerSection.style.display = "none";
  }
  currentViewingFile = "";
}

// Download current file
function downloadCurrentFile() {
  if (currentViewingFile) {
    downloadFile(currentViewingFile);
  }
}

// Download file - FIXED PATH ENCODING
function downloadFile(filePath) {
  const url = new URL(`${NGROK_URL}/download`);
  url.searchParams.append("api_key", API_KEY);
  // FIX: Use encodeURIComponent for file parameter
  url.searchParams.append("file", encodeURIComponent(filePath));
  
  // Create a temporary link and click it
  const a = document.createElement('a');
  a.href = url.toString();
  a.download = filePath.split('/').pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ========== UPLOAD FUNCTIONALITY - FIXED WITH PROPER PROGRESS ==========

// Initialize upload area with drag and drop
function initializeUploadArea() {
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('file-input');
  
  if (!uploadArea || !fileInput) return;

  // Make upload area clickable
  uploadArea.style.cursor = 'pointer';
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  // Add drag and drop functionality
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => {
      uploadArea.classList.add('dragover');
    }, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => {
      uploadArea.classList.remove('dragover');
    }, false);
  });
  
  uploadArea.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      fileInput.files = files;
      handleFileSelection();
    }
  }

  // Handle file input change
  fileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      handleFileSelection();
    }
  });
}

// Handle file selection display
function handleFileSelection() {
  const fileInput = document.getElementById('file-input');
  const selectedFilesList = document.getElementById('selected-files-list');
  const selectedFilesContainer = document.getElementById('selected-files');
  
  if (!selectedFilesList || !selectedFilesContainer) return;

  const files = Array.from(fileInput.files);
  
  if (files.length > 0) {
    selectedFilesList.style.display = 'block';
    selectedFilesContainer.innerHTML = '';
    
    files.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.style.margin = '5px 0';
      fileItem.style.padding = '8px 12px';
      fileItem.style.background = '#2d3746';
      
      const fileSize = formatFileSize(file.size);
      fileItem.innerHTML = `
        <div class="file-info">
          <span class="file-icon">${getFileIcon(file.name)}</span>
          <span class="file-name">${file.name}</span>
          <span class="file-type-badge">${fileSize}</span>
        </div>
        <div class="file-actions">
          <button class="danger" onclick="removeSelectedFile(${index})">✖</button>
        </div>
      `;
      
      selectedFilesContainer.appendChild(fileItem);
    });
  } else {
    selectedFilesList.style.display = 'none';
  }
}

function removeSelectedFile(index) {
  const fileInput = document.getElementById('file-input');
  const files = Array.from(fileInput.files);
  
  if (files.length === 0) return;
  
  // Remove the file at the specified index
  files.splice(index, 1);
  
  // Create new FileList using DataTransfer
  const dt = new DataTransfer();
  files.forEach(file => dt.items.add(file));
  fileInput.files = dt.files;
  
  // Update the display
  handleFileSelection();
  
  // If no files left, hide the selection list
  if (files.length === 0) {
    document.getElementById('selected-files-list').style.display = 'none';
  }
}

function clearFileSelection() {
  const fileInput = document.getElementById('file-input');
  const selectedFilesList = document.getElementById('selected-files-list');
  const selectedFilesContainer = document.getElementById('selected-files');
  
  // Clear the file input
  fileInput.value = '';
  
  // Hide the selected files list
  if (selectedFilesList) {
    selectedFilesList.style.display = 'none';
  }
  
  // Clear the selected files display
  if (selectedFilesContainer) {
    selectedFilesContainer.innerHTML = '';
  }
  
  // Also reset any upload progress
  const progressContainer = document.getElementById('upload-progress-container');
  const progressBar = document.getElementById('upload-progress');
  const statusText = document.getElementById('upload-status');
  
  if (progressContainer) {
    progressContainer.style.display = 'none';
  }
  if (progressBar) {
    progressBar.value = 0;
  }
  if (statusText) {
    statusText.textContent = 'Preparing upload...';
    statusText.style.color = '';
  }
  
  console.log('File selection cleared');
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Main upload function with progress tracking
async function uploadFile() {
  const fileInput = document.getElementById('file-input');
  const files = fileInput.files;
  
  if (files.length === 0) {
    alert('Please select at least one file to upload.');
    return;
  }

  const progressContainer = document.getElementById('upload-progress-container');
  const progressBar = document.getElementById('upload-progress');
  const statusText = document.getElementById('upload-status');

  try {
    // Show progress container
    progressContainer.style.display = 'block';
    statusText.textContent = 'Starting upload...';
    progressBar.value = 0;

    // Upload each file sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await uploadSingleFile(file, i + 1, files.length, progressBar, statusText);
    }

    statusText.textContent = '✅ All files uploaded successfully!';
    statusText.style.color = '#10b981';
    
    // Clear selection and refresh file list after delay
    setTimeout(() => {
      clearFileSelection();
      progressContainer.style.display = 'none';
      loadFiles(currentPath); // Refresh file list
    }, 2000);

  } catch (error) {
    console.error('Upload error:', error);
    statusText.textContent = '❌ Upload failed: ' + error.message;
    statusText.style.color = '#e74c3c';
    progressBar.value = 0;
  }
}

// Upload single file with detailed progress
async function uploadSingleFile(file, currentIndex, totalFiles, progressBar, statusText) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Include current path for folder uploads
    if (currentPath) {
      formData.append('name', `${currentPath}/${file.name}`);
    }

    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        const overallProgress = ((currentIndex - 1) / totalFiles) * 100 + (percentComplete / totalFiles);
        progressBar.value = overallProgress;
        statusText.textContent = `Uploading ${currentIndex}/${totalFiles}: ${file.name} (${Math.round(percentComplete)}%)`;
        statusText.style.color = '#1e90ff';
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timeout - please try again'));
    });

    // Set timeout to 5 minutes for large files
    xhr.timeout = 300000;
    
    const url = new URL(`${NGROK_URL}/upload`);
    url.searchParams.append("api_key", API_KEY);
    
    xhr.open('POST', url.toString());
    xhr.send(formData);
  });
}

// Alternative upload method using fetch with progress (if XHR doesn't work)
async function uploadSingleFileWithFetch(file, currentIndex, totalFiles, progressBar, statusText) {
  const formData = new FormData();
  formData.append('file', file);
  
  if (currentPath) {
    formData.append('name', `${currentPath}/${file.name}`);
  }

  const url = new URL(`${NGROK_URL}/upload`);
  url.searchParams.append("api_key", API_KEY);

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update progress for this file (simulate since fetch doesn't have progress)
    progressBar.value = (currentIndex / totalFiles) * 100;
    statusText.textContent = `Uploaded ${currentIndex}/${totalFiles}: ${file.name}`;
    
    return result;
  } catch (error) {
    throw error;
  }
}

// Delete file - FIXED PATH ENCODING
async function deleteFile(filePath, isDirectory) {
  const confirmMsg = isDirectory 
    ? `Delete folder "${filePath}" and all its contents?`
    : `Delete file "${filePath}"?`;
    
  if (!confirm(confirmMsg)) return;

  try {
    const url = new URL(`${NGROK_URL}/file`);
    url.searchParams.append("api_key", API_KEY);
    // FIX: Use encodeURIComponent for file parameter
    url.searchParams.append("file", encodeURIComponent(filePath));

    const res = await fetch(url, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(`Delete failed: ${res.status}`);
    }

    alert("✅ Deleted successfully");
    
    // Close viewer if viewing deleted file
    if (currentViewingFile === filePath) {
      closeViewer();
    }
    
    loadFiles(currentPath);
  } catch (err) {
    console.error(err);
    alert(`Error deleting: ${err.message}`);
  }
}

// Search and filter functionality
function searchFiles() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const fileItems = document.querySelectorAll('.file-item');
  
  fileItems.forEach(item => {
    const fileName = item.querySelector('.file-name').textContent.toLowerCase();
    if (fileName.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

function filterFilesByType(type) {
  const fileItems = document.querySelectorAll('.file-item');
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  // Update active button
  filterButtons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  fileItems.forEach(item => {
    const fileIcon = item.querySelector('.file-icon').textContent;
    let shouldShow = false;
    
    switch (type) {
      case 'all':
        shouldShow = true;
        break;
      case 'image':
        shouldShow = fileIcon === '🖼️';
        break;
      case 'video':
        shouldShow = fileIcon === '🎬';
        break;
      case 'audio':
        shouldShow = fileIcon === '🎵';
        break;
      case 'document':
        shouldShow = ['📕', '📘', '📗', '📙', '📄'].includes(fileIcon);
        break;
      case 'folder':
        shouldShow = fileIcon === '📁';
        break;
    }
    
    item.style.display = shouldShow ? 'flex' : 'none';
  });
}

// Utility functions
function refreshFiles() {
  loadFiles(currentPath);
}

function goHome() {
  loadFiles('');
}

// Debug function
function debugCheck() {
  console.log('Script loaded successfully');
  console.log('NGROK_URL:', NGROK_URL);
  console.log('Current path:', currentPath);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  loadFiles('');
  initializeUploadArea();
  debugCheck();
});