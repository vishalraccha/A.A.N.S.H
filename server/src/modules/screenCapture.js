// ============================================================================
// modules/screenCapture.js - Screen Text Extraction & OCR
// ============================================================================

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

function getPlatform() {
  const platform = process.platform;
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'macos';
  return 'unknown';
}

const PLATFORM = getPlatform();

function runPowershellEncoded(psCommand, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const encoded = Buffer.from(psCommand, "utf16le").toString("base64");
    const command = `powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -EncodedCommand ${encoded}`;
    exec(command, { windowsHide: true, timeout: timeoutMs }, (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve({ stdout, stderr });
    });
  });
}

// ============================================================================
// TEXT EXTRACTION FROM ACTIVE WINDOW
// ============================================================================

// Extract text from clipboard (already copied text)
async function getClipboardText() {
  if (PLATFORM === 'windows') {
    const ps = `
    Add-Type -AssemblyName System.Windows.Forms
    $text = [System.Windows.Forms.Clipboard]::GetText()
    Write-Output $text
    `;
    
    const { stdout } = await runPowershellEncoded(ps, 5000);
    return stdout.trim();
  } else if (PLATFORM === 'macos') {
    const { stdout } = await execAsync('pbpaste');
    return stdout.trim();
  }
  
  return '';
}

// Copy selected text using Ctrl+C
async function copySelectedText() {
  console.log('📋 Copying selected text...');
  
  if (PLATFORM === 'windows') {
    const ps = `
    Add-Type -AssemblyName System.Windows.Forms
    
    # Clear clipboard first
    [System.Windows.Forms.Clipboard]::Clear()
    Start-Sleep -Milliseconds 200
    
    # Select all text in active window
    [System.Windows.Forms.SendKeys]::SendWait('^a')
    Start-Sleep -Milliseconds 300
    
    # Copy to clipboard
    [System.Windows.Forms.SendKeys]::SendWait('^c')
    Start-Sleep -Milliseconds 500
    
    # Get clipboard content
    $text = [System.Windows.Forms.Clipboard]::GetText()
    Write-Output $text
    `;
    
    const { stdout } = await runPowershellEncoded(ps, 10000);
    return stdout.trim();
  } else if (PLATFORM === 'macos') {
    // macOS: Cmd+A then Cmd+C
    await execAsync(`osascript -e 'tell application "System Events" to keystroke "a" using command down'`);
    await new Promise(r => setTimeout(r, 300));
    await execAsync(`osascript -e 'tell application "System Events" to keystroke "c" using command down'`);
    await new Promise(r => setTimeout(r, 500));
    
    const { stdout } = await execAsync('pbpaste');
    return stdout.trim();
  }
  
  return '';
}

// Get text from specific active window
async function getActiveWindowText() {
  console.log('🔍 Extracting text from active window...');
  
  if (PLATFORM === 'windows') {
    const ps = `
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    using System.Text;
    public class WindowHelper {
      [DllImport("user32.dll")]
      public static extern IntPtr GetForegroundWindow();
      
      [DllImport("user32.dll")]
      public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
      
      [DllImport("user32.dll")]
      public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int lpdwProcessId);
    }
"@
    
    # Get active window
    $hwnd = [WindowHelper]::GetForegroundWindow()
    $title = New-Object System.Text.StringBuilder 256
    [void][WindowHelper]::GetWindowText($hwnd, $title, 256)
    
    $processId = 0
    [void][WindowHelper]::GetWindowThreadProcessId($hwnd, [ref]$processId)
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    Write-Output "Window: $($title.ToString())"
    Write-Output "Process: $($process.ProcessName)"
    
    # Try to get text content
    [System.Windows.Forms.Clipboard]::Clear()
    Start-Sleep -Milliseconds 200
    
    # Select all and copy
    [System.Windows.Forms.SendKeys]::SendWait('^a')
    Start-Sleep -Milliseconds 400
    [System.Windows.Forms.SendKeys]::SendWait('^c')
    Start-Sleep -Milliseconds 500
    
    $text = [System.Windows.Forms.Clipboard]::GetText()
    
    if ($text) {
      Write-Output "---TEXT-START---"
      Write-Output $text
      Write-Output "---TEXT-END---"
    } else {
      Write-Output "---TEXT-START---"
      Write-Output "[No text could be extracted from this window]"
      Write-Output "---TEXT-END---"
    }
    `;
    
    const { stdout } = await runPowershellEncoded(ps, 15000);
    
    // Extract text between markers
    const match = stdout.match(/---TEXT-START---([\s\S]*?)---TEXT-END---/);
    if (match) {
      return match[1].trim();
    }
    
    return stdout.trim();
  }
  
  return await copySelectedText();
}

// Take screenshot and extract text using OCR (advanced)
async function captureScreenAndExtractText() {
  console.log('📸 Capturing screen for OCR...');
  
  const tempDir = os.tmpdir();
  const screenshotPath = path.join(tempDir, `aansh_screenshot_${Date.now()}.png`);
  
  if (PLATFORM === 'windows') {
    // Use PowerShell to take screenshot
    const ps = `
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
    
    $bitmap.Save("${screenshotPath.replace(/\\/g, '\\\\')}", [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Output "Screenshot saved: ${screenshotPath}"
    `;
    
    await runPowershellEncoded(ps, 10000);
  } else if (PLATFORM === 'macos') {
    await execAsync(`screencapture -x "${screenshotPath}"`);
  }
  
  // Check if screenshot exists
  if (fs.existsSync(screenshotPath)) {
    console.log('✅ Screenshot captured:', screenshotPath);
    return { success: true, path: screenshotPath };
  }
  
  return { success: false, error: 'Screenshot failed' };
}

// ============================================================================
// CLIPBOARD OPERATIONS
// ============================================================================

// Set clipboard content
async function setClipboardText(text) {
  console.log('📝 Setting clipboard content...');
  
  if (PLATFORM === 'windows') {
    const safeText = text.replace(/"/g, '""').replace(/\r?\n/g, "`r`n");
    const ps = `
    Add-Type -AssemblyName System.Windows.Forms
    $text = "${safeText}"
    [System.Windows.Forms.Clipboard]::SetText($text)
    Write-Output "Clipboard set"
    `;
    
    await runPowershellEncoded(ps, 5000);
  } else if (PLATFORM === 'macos') {
    await execAsync(`echo "${text.replace(/"/g, '\\"')}" | pbcopy`);
  }
  
  console.log('✅ Clipboard updated');
}

// Paste clipboard content using Ctrl+V
async function pasteClipboardContent() {
  console.log('📋 Pasting from clipboard...');
  
  if (PLATFORM === 'windows') {
    const ps = `
    [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
    Add-Type -AssemblyName System.Windows.Forms
    Start-Sleep -Milliseconds 300
    [System.Windows.Forms.SendKeys]::SendWait('^v')
    Start-Sleep -Milliseconds 200
    `;
    
    await runPowershellEncoded(ps, 5000);
  } else if (PLATFORM === 'macos') {
    await execAsync(`osascript -e 'tell application "System Events" to keystroke "v" using command down'`);
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('✅ Content pasted');
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getClipboardText,
  copySelectedText,
  getActiveWindowText,
  captureScreenAndExtractText,
  setClipboardText,
  pasteClipboardContent
};