import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";
import JSZip from "jszip";


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
    
    const fullCommand = `powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -EncodedCommand ${encoded}`;
    
    if (fullCommand.length > 8000) {
      reject(new Error("Command too long for encoded execution. Use runPowershellScript instead."));
      return;
    }
    
    exec(fullCommand, { windowsHide: true, timeout: timeoutMs }, (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve({ stdout, stderr });
    });
  });
}

async function runPowershellScript(psCommand, timeoutMs = 30000) {
  const tempDir = os.tmpdir();
  const scriptPath = path.join(tempDir, `aansh_${Date.now()}.ps1`);
  
  try {
    fs.writeFileSync(scriptPath, psCommand, 'utf8');
    
    const { stdout, stderr } = await execAsync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`,
      { timeout: timeoutMs, windowsHide: true }
    );
    
    try {
      fs.unlinkSync(scriptPath);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    return { stdout, stderr };
  } catch (error) {
    try {
      fs.unlinkSync(scriptPath);
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

function normalizeAppName(name) {
  return String(name || "").trim().toLowerCase();
}

function getLaunchCommand(appName) {
  const normalized = normalizeAppName(appName);
  const mapping = {
    notepad: "notepad",
    "google chrome": "chrome",
    chrome: "chrome",
    edge: "msedge",
    "microsoft edge": "msedge",
    firefox: "firefox",
    whatsapp: "WhatsApp",
    word: "winword",
    "microsoft word": "winword",
    excel: "excel",
    "microsoft excel": "excel",
    powerpoint: "powerpnt",
    "microsoft powerpoint": "powerpnt",
    ppt: "powerpnt",
    outlook: "outlook",
    "microsoft outlook": "outlook",
    gmail: "chrome",
    mail: "chrome",
    calculator: "calc",
    paint: "mspaint",
    "ms paint": "mspaint"
  };
  return mapping[normalized] || normalized;
}

// IMPROVED: Better window focusing with retry mechanism
async function ensureWindowForeground(appName, maxRetries = 40) {
  const safePattern = appName.replace(/["'\\]/g, '').replace(/\s+/g, '.*');
  console.log(`🎯 Ensuring ${appName} is in foreground...`);

  const ps = `
  $ErrorActionPreference = 'Stop'
  Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public class WinAPI {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  }
"@

  $focused = $false
  for ($i = 0; $i -lt ${maxRetries}; $i++) {
    Start-Sleep -Milliseconds 400

    $p = Get-Process -ErrorAction SilentlyContinue | Where-Object {
      $_.MainWindowHandle -ne 0 -and (
        $_.ProcessName -match '(?i)${safePattern}' -or
        ($_.MainWindowTitle -and $_.MainWindowTitle -match '(?i)${safePattern}')
      )
    } | Sort-Object StartTime -Descending | Select-Object -First 1

    if ($p) {
      $hwnd = $p.MainWindowHandle

      if ([WinAPI]::IsIconic($hwnd)) {
        [void][WinAPI]::ShowWindow($hwnd, 9)
        Start-Sleep -Milliseconds 300
      }

      [void][WinAPI]::BringWindowToTop($hwnd)
      [void][WinAPI]::SetForegroundWindow($hwnd)
      Start-Sleep -Milliseconds 200

      $current = [WinAPI]::GetForegroundWindow()
      if ($current -eq $hwnd) {
        Write-Output "FOCUSED_SUCCESS"
        $focused = $true
        break
      }
    }
  }

  if ($focused) {
    Write-Output "FINAL_STATUS:SUCCESS"
  } else {
    # Try fallback using AppActivate
    try {
      $wshell = New-Object -ComObject WScript.Shell
      $wshell.AppActivate("${appName}")
      Write-Output "FALLBACK_SUCCESS"
      Write-Output "FINAL_STATUS:SUCCESS"
    } catch {
      Write-Output "FINAL_STATUS:FAILED"
    }
  }
  `;

  const result = await runPowershellScript(ps, Math.max(20000, maxRetries * 500));

  if (!result.stdout.includes("FINAL_STATUS:SUCCESS")) {
    throw new Error(`Failed to bring ${appName} to foreground after ${maxRetries} attempts`);
  }

  console.log(`✅ ${appName} is now in foreground`);
  return true;
}


export async function openApplication(appName) {
  const exe = getLaunchCommand(appName);
  const normalized = normalizeAppName(appName);

  console.log(`🚀 Opening ${appName}...`);

  if (normalized.includes('whatsapp')) {
    const psProtocol = `
      $ErrorActionPreference = 'SilentlyContinue'
      try {
        Start-Process 'whatsapp:'
        Write-Output 'protocol_started'
      } catch {
        try {
          $shell = New-Object -ComObject WScript.Shell
          $shell.Run('whatsapp:', 1, $false)
          Write-Output 'protocol_started_com'
        } catch {
          Write-Output 'protocol_failed'
        }
      }
    `;
    await runPowershellScript(psProtocol, 8000);
    
    // Wait for WhatsApp to fully load
    await new Promise(r => setTimeout(r, 3000));
    
    // Ensure it comes to foreground
    await ensureWindowForeground('WhatsApp', 30);
    
    return;
  }

  const ps = `
  $ErrorActionPreference = 'SilentlyContinue'
  try {
    Start-Process -FilePath '${exe}' -WindowStyle Normal -ErrorAction Stop
    Write-Output 'started'
  } catch {
    try {
      Start-Process '${exe}' -WindowStyle Normal -ErrorAction SilentlyContinue
      Write-Output 'started_alt'
    } catch {
      Write-Output 'start_failed'
    }
  }
  `;
  await runPowershellScript(ps, 10000);
  
  // Wait for app to start
  await new Promise(r => setTimeout(r, 2000));
  
  // Bring to foreground
  await ensureWindowForeground(appName, 30);
}

export async function focusApplication(appName, retries = 30) {
  return ensureWindowForeground(appName, retries);
}

export async function typeTextRealTime(text, perCharDelayMs = 50) {
  const textStr = String(text || "").replace(/\r/g, "");
  if (textStr.length === 0) {
    console.log("No text to type");
    return;
  }

  console.log(`⌨️  Typing ${textStr.length} characters...`);

  const escapeForSendKeys = (char) => {
    switch (char) {
      case "\n": return "{ENTER}";
      case "\t": return "{TAB}";
      case "{": return "{{}";
      case "}": return "{}}";
      case "+": return "{+}";
      case "^": return "{^}";
      case "%": return "{%}";
      case "~": return "{~}";
      case "(": return "{(}";
      case ")": return "{)}";
      case "[": return "{[}";
      case "]": return "{]}";
      case '"': return '""';
      default: return char;
    }
  };

  const chunkSize = 80;
  const chunks = [];
  for (let i = 0; i < textStr.length; i += chunkSize) {
    chunks.push(textStr.substring(i, i + chunkSize));
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const escapedChars = Array.from(chunk).map(escapeForSendKeys);

    const delays = escapedChars.map(() =>
      Math.floor(perCharDelayMs * (0.7 + Math.random() * 0.6))
    );

    let delayScript = '';
    for (let j = 0; j < escapedChars.length; j++) {
      delayScript += `
        [System.Windows.Forms.SendKeys]::SendWait("${escapedChars[j]}")
        Start-Sleep -Milliseconds ${delays[j]}
      `;
    }

    const ps = `
      $ErrorActionPreference = 'SilentlyContinue'
      Add-Type -AssemblyName System.Windows.Forms
      Start-Sleep -Milliseconds 100
      ${delayScript}
    `;

    try {
      await runPowershellScript(ps, Math.max(30000, chunk.length * (perCharDelayMs + 10)));
      console.log(`✅ Chunk ${i + 1}/${chunks.length} typed`);
    } catch (error) {
      console.error(`❌ Error typing chunk ${i + 1}:`, error.message);
      throw error;
    }
  }

  console.log("✅ All text typed successfully");
}

// ============================================================================
// OFFICE FILE CREATION
// ============================================================================

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function createWordDocument(title, content) {
  console.log('Creating Word document with content...');
  
  const tempDir = os.tmpdir();
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  const fileName = `${sanitizedTitle}_${Date.now()}.docx`;
  const filePath = path.join(tempDir, fileName);
  
  const zip = new JSZip();
  
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.folder('word').folder('_rels').file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`);

  const paragraphs = content.split('\n\n').filter(p => p.trim());
  let documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="56"/>
          <w:color w:val="0070C0"/>
        </w:rPr>
        <w:t>${escapeXml(title)}</w:t>
      </w:r>
    </w:p>
    <w:p/>`;

  paragraphs.forEach(para => {
    const lines = para.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        const isHeading = line.length < 60 && !line.includes('.');
        documentXml += `
    <w:p>
      <w:r>
        <w:rPr>
          ${isHeading ? '<w:b/><w:sz w:val="32"/>' : '<w:sz w:val="24"/>'}
        </w:rPr>
        <w:t>${escapeXml(line.trim())}</w:t>
      </w:r>
    </w:p>`;
      }
    });
    documentXml += '<w:p/>';
  });

  documentXml += `
  </w:body>
</w:document>`;

  zip.folder('word').file('document.xml', documentXml);

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(filePath, buffer);
  
  console.log(`✅ Word document created: ${filePath}`);
  
  await runPowershellScript(`Start-Process "${filePath.replace(/\\/g, '\\\\')}"`);
  
  return filePath;
}

async function createPowerPointPresentation(title, content) {
  console.log('Creating PowerPoint presentation...');
  
  const tempDir = os.tmpdir();
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  const fileName = `${sanitizedTitle}_${Date.now()}.pptx`;
  const filePath = path.join(tempDir, fileName);
  
  const safeTitle = title.replace(/'/g, "''").replace(/`/g, '``');
  const safeContent = content.replace(/'/g, "''").replace(/`/g, '``');
  const safeFilePath = filePath.replace(/\\/g, '\\\\');
  
  const ps = `
$ErrorActionPreference = 'Stop'

try {
    $ppt = New-Object -ComObject PowerPoint.Application
    $presentation = $ppt.Presentations.Add($false)
    $ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue
    
    $slide1 = $presentation.Slides.Add(1, 1)
    $slide1.Shapes.Title.TextFrame.TextRange.Text = '${safeTitle}'
    
    $sections = '${safeContent}' -split '\`n\`n'
    $slideNum = 2
    
    foreach ($section in $sections) {
        $section = $section.Trim()
        if ($section.Length -gt 0) {
            $slide = $presentation.Slides.Add($slideNum, 2)
            $slide.Shapes.Title.TextFrame.TextRange.Text = '${safeTitle}'
            $slide.Shapes.Item(2).TextFrame.TextRange.Text = $section
            $slideNum++
        }
    }
    
    $presentation.SaveAs('${safeFilePath}')
    
    Write-Output "SUCCESS"
} catch {
    Write-Output "ERROR: $_"
}
`;

  const result = await runPowershellScript(ps, 60000);
  
  if (result.stdout.includes('SUCCESS')) {
    console.log(`✅ PowerPoint created: ${filePath}`);
    return filePath;
  } else {
    throw new Error(`Failed to create PowerPoint: ${result.stdout}`);
  }
}

async function createExcelSpreadsheet(title, content) {
  console.log('Creating Excel spreadsheet...');
  
  const tempDir = os.tmpdir();
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  const fileName = `${sanitizedTitle}_${Date.now()}.xlsx`;
  const filePath = path.join(tempDir, fileName);
  
  const safeTitle = title.replace(/'/g, "''").replace(/`/g, '``');
  const safeContent = content.replace(/'/g, "''").replace(/`/g, '``');
  const safeFilePath = filePath.replace(/\\/g, '\\\\');
  
  const ps = `
$ErrorActionPreference = 'Stop'

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $true
    $excel.DisplayAlerts = $false
    
    $workbook = $excel.Workbooks.Add()
    $worksheet = $workbook.Worksheets.Item(1)
    
    $worksheet.Cells.Item(1, 1).Value2 = '${safeTitle}'
    $worksheet.Cells.Item(1, 1).Font.Size = 18
    $worksheet.Cells.Item(1, 1).Font.Bold = $true
    
    $lines = '${safeContent}' -split '\`n'
    $row = 3
    
    foreach ($line in $lines) {
        $line = $line.Trim()
        if ($line.Length -gt 0) {
            $worksheet.Cells.Item($row, 1).Value2 = $line
            $row++
        }
    }
    
    $worksheet.UsedRange.EntireColumn.AutoFit() | Out-Null
    
    $workbook.SaveAs('${safeFilePath}')
    
    Write-Output "SUCCESS"
} catch {
    Write-Output "ERROR: $_"
}
`;

  const result = await runPowershellScript(ps, 60000);
  
  if (result.stdout.includes('SUCCESS')) {
    console.log(`✅ Excel created: ${filePath}`);
    return filePath;
  } else {
    throw new Error(`Failed to create Excel: ${result.stdout}`);
  }
}

// ============================================================================
// EMAIL WITH TYPING EFFECT
// ============================================================================

export async function sendEmailWithTyping(recipient, subject, body, perCharDelayMs = 50) {
  console.log(`📧 Sending email to: ${recipient}`);

  try {
    console.log("Opening Gmail compose window...");
    const composeUrl = "https://mail.google.com/mail/?view=cm&fs=1";
    const psOpenGmail = `
      $ErrorActionPreference = 'SilentlyContinue'
      $chromePaths = @(
        "$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe",
        "$env:ProgramFiles(x86)\\Google\\Chrome\\Application\\chrome.exe",
        "$env:LOCALAPPDATA\\Google\\Chrome\\Application\\chrome.exe"
      )
      $url = "${composeUrl}"
      $opened = $false
      foreach ($path in $chromePaths) {
        if (Test-Path $path) {
          Start-Process $path -ArgumentList $url
          $opened = $true
          break
        }
      }
      if (-not $opened) { Start-Process $url }
    `;
    await runPowershellScript(psOpenGmail, 8000);

    console.log("Waiting for Gmail to load...");
    await new Promise(r => setTimeout(r, 8000));

    console.log("Ensuring Chrome window is in foreground...");
    await ensureWindowForeground('Chrome', 30);
    await new Promise(r => setTimeout(r, 1000));

    console.log("Typing recipient email...");
    await typeTextRealTime(recipient, perCharDelayMs);
    await new Promise(r => setTimeout(r, 800));

    console.log("Pressing Enter to confirm recipient...");
    await runPowershellScript(`
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
      Start-Sleep -Milliseconds 500
    `, 2000);
    await new Promise(r => setTimeout(r, 800));

    console.log("Pressing Tab to move to subject field...");
    await runPowershellScript(`
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait("{TAB}")
      Start-Sleep -Milliseconds 500
    `, 2000);
    await new Promise(r => setTimeout(r, 1000));

    console.log("Typing subject...");
    await typeTextRealTime(subject, perCharDelayMs);
    await new Promise(r => setTimeout(r, 1000));

    console.log("Pressing Tab to move to body field...");
    await runPowershellScript(`
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait("{TAB}")
      Start-Sleep -Milliseconds 500
    `, 2000);
    await new Promise(r => setTimeout(r, 1200));

    console.log("Typing email body...");
    await typeTextRealTime(body, perCharDelayMs);
    await new Promise(r => setTimeout(r, 2000));

    console.log("Sending email with Ctrl+Enter...");
    await runPowershellScript(`
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait("^{ENTER}")
      Start-Sleep -Milliseconds 500
    `, 3000);

    console.log("✅ Email sent successfully via Gmail!");
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw error;
  }
}

export async function sendEmailOutlookWithTyping(recipient, subject, body, perCharDelayMs = 50) {
  console.log("📨 Sending email via Outlook...");

  const psOpenOutlook = `
    $ErrorActionPreference = 'SilentlyContinue'
    try {
      $outlook = New-Object -ComObject Outlook.Application
      $mail = $outlook.CreateItem(0)
      $mail.Display()
      Write-Output "outlook_opened"
    } catch {
      Write-Output "error: $_"
      exit 1
    }
  `;

  const { stdout } = await runPowershellScript(psOpenOutlook, 10000);
  if (!stdout.includes("outlook_opened")) {
    throw new Error("Failed to open Outlook");
  }

  console.log("Waiting for Outlook window...");
  await new Promise(r => setTimeout(r, 3000));

  await ensureWindowForeground('Outlook', 30);
  await new Promise(r => setTimeout(r, 700));

  console.log("Typing recipient...");
  await typeTextRealTime(recipient, perCharDelayMs);
  await new Promise(r => setTimeout(r, 600));

  console.log("Moving to subject...");
  await runPowershellScript(`
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("{TAB}")
  `);
  await new Promise(r => setTimeout(r, 700));

  console.log("Typing subject...");
  await typeTextRealTime(subject, perCharDelayMs);
  await new Promise(r => setTimeout(r, 600));

  console.log("Moving to body...");
  await runPowershellScript(`
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("{TAB}")
  `);
  await new Promise(r => setTimeout(r, 900));

  console.log("Typing body...");
  await typeTextRealTime(body, perCharDelayMs);
  await new Promise(r => setTimeout(r, 1500));

  console.log("Sending email...");
  await runPowershellScript(`
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("^{ENTER}")
  `, 3000);

  console.log("✅ Email sent via Outlook!");
}

// ============================================================================
// WHATSAPP - IMPROVED with foreground focus
// ============================================================================

async function sendWhatsAppMessage(recipient, content, perCharDelayMs = 40) {
  console.log(`📱 Sending WhatsApp message to: ${recipient}`);

  const safeRecipient = String(recipient || "")
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "``")
    .replace(/"/g, '``"')
    .replace(/'/g, "''")
    .trim();

  const safeContent = String(content || "")
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "``")
    .replace(/"/g, '``"')
    .replace(/'/g, "''")
    .replace(/\n/g, "`n")
    .replace(/\r/g, "");

  // Open WhatsApp and ensure it's in foreground
  await openApplication('WhatsApp');
  
  // Extra wait for WhatsApp to fully load
  await new Promise((r) => setTimeout(r, 2000));

  const ps = `
  Add-Type -AssemblyName System.Windows.Forms
  $ErrorActionPreference = 'SilentlyContinue'

  [System.Windows.Forms.SendKeys]::SendWait('^f')
  Start-Sleep -Milliseconds 700

  [System.Windows.Forms.SendKeys]::SendWait('^a')
  Start-Sleep -Milliseconds 120
  [System.Windows.Forms.SendKeys]::SendWait('{BACKSPACE}')
  Start-Sleep -Milliseconds 150

  $recipient = "${safeRecipient}"
  foreach ($c in $recipient.ToCharArray()) {
    [System.Windows.Forms.SendKeys]::SendWait($c)
    Start-Sleep -Milliseconds 80
  }

  Start-Sleep -Milliseconds 900
  [System.Windows.Forms.SendKeys]::SendWait('{DOWN}')
  Start-Sleep -Milliseconds 350
  [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
  Start-Sleep -Milliseconds 700

  $message = "${safeContent}"
  foreach ($c in $message.ToCharArray()) {
    [System.Windows.Forms.SendKeys]::SendWait($c)
    Start-Sleep -Milliseconds ${Math.max(30, perCharDelayMs)}
  }
  Start-Sleep -Milliseconds 400
  [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
  Write-Output "whatsapp_message_sent"
  `;

  try {
    await runPowershellScript(ps, Math.max(40000, safeContent.length * (perCharDelayMs + 20)));
    console.log("✅ WhatsApp message sent!");
  } catch (err) {
    console.error("Error sending WhatsApp message:", err.message || err);
    throw err;
  }
}

// ============================================================================
// GEMINI AI INTEGRATION
// ============================================================================

class GeminiAIChat {
  constructor(apiKey = null) {
    // Prefer explicit apiKey param, otherwise read from environment variable GOOGLE_API_KEY or GEMINI_API_KEY
    const resolvedKey =
      (apiKey && String(apiKey).trim()) ||
      (process.env && process.env.GOOGLE_API_KEY && String(process.env.GOOGLE_API_KEY).trim()) ||
      (process.env && process.env.GOOGLE_API_KEY && String(process.env.GOOGLE_API_KEY).trim());

    if (!resolvedKey) {
      throw new Error('Gemini API key is required. Provide it to initializeGeminiAI(apiKey) or set GOOGLE_API_KEY / GEMINI_API_KEY in your environment.');
    }

    this.apiKey = resolvedKey;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-2.0:generateContent';
    this.conversationHistory = [];
    this.maxHistoryLength = 10;
    this.systemContext = `You are Aansh AI, a helpful, friendly, and intelligent assistant. You can answer questions, have conversations, and help with various tasks. Keep responses concise but informative. Be warm and personable.`;
  }

  addToHistory(role, content) {
    this.conversationHistory.push({
      role,
      parts: [{ text: content }],
      timestamp: Date.now()
    });

    if (this.conversationHistory.length > this.maxHistoryLength * 2) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
    }
  }

  async generateResponse(userMessage) {
    console.log(`🤖 Gemini AI processing: "${userMessage}"`);

    this.addToHistory('user', userMessage);

    try {
      const response = await this.callGeminiAPI(userMessage);
      this.addToHistory('model', response);
      return response;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  async callGeminiAPI(userMessage) {
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${this.systemContext}\n\nUser: ${userMessage}` }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024
      }
    };

    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates.length > 0) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        return aiResponse;
      } else {
        throw new Error('No response from Gemini AI');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  clearHistory() {
    this.conversationHistory = [];
    console.log("💭 Conversation history cleared");
  }

  getHistory() {
    return this.conversationHistory;
  }
}

// Initialize Gemini AI (You need to set your API key)
let geminiAI = null;

export function initializeGeminiAI(apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }
  geminiAI = new GeminiAIChat(apiKey);
  console.log('✅ Gemini AI initialized');
}


export async function chatWithAI(userMessage) {
  if (!geminiAI) {
    throw new Error('Gemini AI not initialized. Call initializeGeminiAI(apiKey) first.');
  }

  try {
    const response = await geminiAI.generateResponse(userMessage);
    return {
      status: 'success',
      userMessage,
      aiResponse: response,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ AI Chat Error:', error);
    return {
      status: 'error',
      userMessage,
      aiResponse: "I apologize, but I encountered an error. Please try again!",
      error: error.message
    };
  }
}

export function clearChatHistory() {
  if (geminiAI) {
    geminiAI.clearHistory();
  }
  return { status: 'cleared', message: 'Conversation history has been cleared' };
}

export function getChatHistory() {
  if (!geminiAI) {
    return { status: 'error', message: 'Gemini AI not initialized' };
  }
  return {
    status: 'success',
    history: geminiAI.getHistory()
  };
}

// ============================================================================
// COMMAND EXECUTOR
// ============================================================================

export async function executeParsedCommand(command, options = {}) {
  const { autoTypeAfterOpen = true, perCharDelayMs = 50 } = options;
  const intent = (command?.intent || '').toLowerCase();
  const execution = (command?.execution || '').toLowerCase();
  const action = (command?.action || '').toLowerCase();
  const app = command?.app;
  const content = command?.content;
  const recipient = command?.recipient;
  const topic = command?.topic;
  const appNorm = normalizeAppName(app);

  console.log(`Executing command:`, { intent, action, app, contentLength: content?.length });

  let actualIntent = intent;
  if (intent === 'other' && action) {
    if (action === 'type') actualIntent = 'type_text';
    if (action === 'open') actualIntent = 'open_app';
    if (action === 'send') actualIntent = 'send_message';
    if (action === 'search') actualIntent = 'search';
  }

  // OFFICE APPS
  if (app && content) {
    if (appNorm.includes('word')) {
      const result = await createFile('word', topic || 'Document', content);
      const aiResponse = await generateDetailedResponse({
        status: 'document_created',
        ...result
      });
      return { 
        status: 'document_created',
        ...result,
        aiResponse 
      };
    }
    
    if (appNorm.includes('powerpoint') || appNorm === 'ppt') {
      const result = await createFile('powerpoint', topic || 'Presentation', content);
      const aiResponse = await generateDetailedResponse({
        status: 'presentation_created',
        ...result
      });
      return { 
        status: 'presentation_created',
        ...result,
        aiResponse 
      };
    }
    
    if (appNorm.includes('excel')) {
      const result = await createFile('excel', topic || 'Spreadsheet', content);
      const aiResponse = await generateDetailedResponse({
        status: 'spreadsheet_created',
        ...result
      });
      return { 
        status: 'spreadsheet_created',
        ...result,
        aiResponse 
      };
    }
  }

  // SEARCH
  if (actualIntent === 'search' || action === 'search') {
    console.log(`Searching for: ${content || topic}`);
    const searchQuery = content || topic;
    const browser = getLaunchCommand(app || 'chrome');
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    
    const ps = `
    $ErrorActionPreference = 'SilentlyContinue'
    
    $browserPaths = @(
      "$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe",
      "$env:ProgramFiles(x86)\\Google\\Chrome\\Application\\chrome.exe",
      "$env:LOCALAPPDATA\\Google\\Chrome\\Application\\chrome.exe"
    )
    
    $url = "${searchUrl.replace(/"/g, '`"')}"
    
    $browserFound = $false
    foreach ($path in $browserPaths) {
      if (Test-Path $path) {
        Start-Process $path -ArgumentList $url
        $browserFound = $true
        break
      }
    }
    
    if (-not $browserFound) {
      Start-Process "${browser}" -ArgumentList $url -ErrorAction SilentlyContinue
    }
    `;
    
    await runPowershellScript(ps, 10000);
    
    return { status: 'search_completed', app: browser, query: searchQuery };
  }

  // OPEN APP
  if (actualIntent === 'open_app' || execution === 'open' || action === 'open') {
    console.log(`Opening ${app}...`);
    await openApplication(app);
    
    if (autoTypeAfterOpen && content) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await typeTextRealTime(String(content), perCharDelayMs);
      return { status: 'opened_and_typed', app, length: String(content).length };
    }
    return { status: 'opened', app };
  }

  // TYPE TEXT
  if (actualIntent === 'type_text' || execution === 'type' || action === 'type') {
    if (app) {
      try {
        await focusApplication(app);
      } catch (e) {
        console.log(`${app} not running, opening it...`);
        await openApplication(app);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    await typeTextRealTime(String(content ?? ''), perCharDelayMs);
    return { status: 'typed', app: app || 'active', length: String(content ?? '').length };
  }

  // SEND MESSAGE OR EMAIL
  if (actualIntent === 'send_message' || actualIntent === 'send_email' || execution === 'send' || action === 'send') {
    console.log(`Sending message via ${app || 'auto-detect'}...`);
    
    const isEmailApp = appNorm.includes('gmail') || appNorm.includes('mail') || appNorm.includes('outlook');
    const isEmailRecipient = recipient && recipient.includes('@');
    
    if (isEmailApp || isEmailRecipient) {
      console.log('Sending email with typing effect...');
      const emailSubject = topic || 'Message from Aansh AI';
      
      try {
        await sendEmailWithTyping(recipient, emailSubject, content, perCharDelayMs);
        return { status: 'email_sent', recipient, subject: emailSubject, length: String(content ?? '').length };
      } catch (gmailError) {
        console.log("Gmail failed, trying Outlook...");
        try {
          await sendEmailOutlookWithTyping(recipient, emailSubject, content, perCharDelayMs);
          return { status: 'email_sent_outlook', recipient, subject: emailSubject, length: String(content ?? '').length };
        } catch (outlookError) {
          throw new Error("Failed to send email via Gmail or Outlook");
        }
      }
    }
    
    // WhatsApp
    if (appNorm.includes('whatsapp') || !app) {
      // Generate message content if needed
      if (!content && topic) {
        content = await generateAIContent('whatsapp_message', { topic });
      }
      await sendWhatsAppMessage(recipient, content, Math.max(40, perCharDelayMs));
      return { 
        status: 'sent', 
        app: app || 'WhatsApp', 
        recipient, 
        content,
        length: String(content ?? '').length 
      };
    }
    
    if (app) {
      try {
        await focusApplication(app);
      } catch (e) {
        console.log('Opening app...');
        await openApplication(app);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    await typeTextRealTime(String(content ?? ''), perCharDelayMs);
    return { status: 'typed_for_send', app: app || 'active', recipient, length: String(content ?? '').length };
  }

  return { status: 'ignored', reason: 'unsupported_intent', intent: actualIntent, app };
}

export async function sendQuickWhatsAppMessage(recipientName, messageText) {
  const command = {
    intent: 'send_message',
    execution: 'send',
    app: 'WhatsApp',
    recipient: recipientName,
    content: messageText
  };
  
  return await executeParsedCommand(command, { perCharDelayMs: 45 });
}

export async function sendQuickEmail(recipientEmail, subject, messageText) {
  const command = {
    intent: 'send_email',
    execution: 'send',
    app: 'gmail',
    recipient: recipientEmail,
    topic: subject,
    content: messageText
  };
  
  return await executeParsedCommand(command, { perCharDelayMs: 45 });
}

// ============================================================================
// IMPROVED: Smart Command Detection
// ============================================================================

function isActionCommand(text) {
  const lowerText = text.toLowerCase().trim();
  
  // Explicit action patterns that require execution
  const explicitActionPatterns = [
    // Opening apps
    /^(open|launch|start|run)\s+/,
    /\b(open|launch|start|run)\s+(whatsapp|chrome|notepad|word|excel|powerpoint|outlook|gmail)/,
    
    // Sending messages/emails
    /^send\s+(a\s+)?(message|email|whatsapp|mail)/,
    /\bsend\s+.*\s+to\s+/,
    /\bemail\s+to\s+/,
    /\bwhatsapp\s+to\s+/,
    
    // Creating documents
    /^(create|make|generate)\s+(a\s+)?(word|excel|powerpoint|document|spreadsheet|presentation)/,
    /\bcreate\s+.*\s+(document|presentation|spreadsheet)/,
    
    // Typing/writing
    /^(type|write)\s+.*\s+in\s+/,
    
    // Web search (only explicit requests)
    /^search\s+(for|about|on)\s+/,
    /^google\s+/,
    /^look\s+up\s+/,
    /^find\s+information\s+(about|on)\s+/
  ];
  
  // Check if it matches any explicit action pattern
  for (const pattern of explicitActionPatterns) {
    if (pattern.test(lowerText)) {
      return true;
    }
  }
  
  // NOT action commands (conversational queries that should use AI)
  const conversationalPatterns = [
    /^(what|who|when|where|why|how)\b/,  
    /^(is|are|was|were|do|does|did|can|could|would|should)\b/,
    /^(tell me|explain|describe|what's|whats)\b/,
    /\?$/,  // Ends with question mark
    /^(hi|hello|hey|good (morning|afternoon|evening)|greetings)\b/,
    /^(thanks|thank you|bye|goodbye)\b/,
    /^(i think|i believe|in my opinion)\b/,
    /\bplease\b/
  ];
  
  for (const pattern of conversationalPatterns) {
    if (pattern.test(lowerText)) {
      return false;  // It's a conversation, not an action
    }
  }
  
  return false;
}

// ============================================================================
// SMART ROUTER - AI Chat vs Command Execution
// ============================================================================

export async function handleUserInput(userInput, parsedCommand = null) {
  console.log(`📥 Received: "${userInput}"`);
  
  // Check if user is greeting the assistant
  const greetingPattern = /^(hi|hello|hey|good morning|good afternoon|good evening|greetings)\s*(aansh)?[\s!.]*$/i;
  if (greetingPattern.test(userInput.trim())) {
    console.log('👋 Greeting detected, using AI chat...');
    const chatResponse = await chatWithAI(userInput);
    

       const actualContent =
      chatResponse?.data?.aiResponse ||
      chatResponse?.data?.content ||
      chatResponse?.data?.result ||
      chatResponse?.data?.message ||
      chatResponse?.message ||
      "No content generated";

    return {
      type: 'ai_chat',
      status: 'success',
      message: actualContent || chatResponse.content || JSON.stringify(chatResponse, null, 2),
      data: chatResponse
    };
  }
  
  // Priority 1: If parsedCommand has clear action indicators, execute it
  if (parsedCommand) {
    const hasIntent = parsedCommand.intent && parsedCommand.intent !== 'other';
    const hasAction = parsedCommand.action && ['open', 'send', 'type', 'create', 'search'].includes(parsedCommand.action.toLowerCase());
    const hasApp = parsedCommand.app && parsedCommand.app.trim().length > 0;
    const hasRecipient = parsedCommand.recipient && parsedCommand.recipient.trim().length > 0;
    
    // Check if this is a real action command (not just conversational)
    const isRealAction = (hasIntent && hasIntent !== 'chat') || 
                        (hasAction) || 
                        (hasApp && (hasRecipient || hasAction));
    
    if (isRealAction) {
      console.log('🔧 Executing command based on parsed data...');
      
      try {
        const result = await executeParsedCommand(parsedCommand);
        
        return {
          type: 'command_execution',
          status: 'success',
          result: result,
          message: formatExecutionMessage(result),
          data: result
        };
      } catch (error) {
        console.error('❌ Command execution error:', error);
        return {
          type: 'command_execution',
          status: 'error',
          message: `Failed to execute command: ${error.message}`,
          error: error.message
        };
      }
    }
  }
  
  // Priority 2: Check if input explicitly looks like an action command
  if (isActionCommand(userInput)) {
    console.log('🔧 Detected action command from text pattern...');
    
    if (parsedCommand) {
      try {
        const result = await executeParsedCommand(parsedCommand);
        
        return {
          type: 'command_execution',
          status: 'success',
          result: result,
         
          data: result
        };
      } catch (error) {
        console.error('❌ Command execution error:', error);
        return {
          type: 'command_execution',
          status: 'error',
          message: `Failed to execute command: ${error.message}`,
          error: error.message
        };
      }
    } else {
      // Even for action commands, use AI to respond intelligently
      const chatResponse = await chatWithAI(userInput);
      return {
        type: 'ai_chat',
        status: 'success',
        message: chatResponse.aiResponse,
        data: chatResponse
      };
    }
  }
  
  // Priority 3: Use AI chat for conversational queries
  console.log('💬 Using AI chat for conversational response...');
  const chatResponse = await chatWithAI(userInput);
  
  return {
    type: 'ai_chat',
    status: 'success',
    message: chatResponse.aiResponse,
    data: chatResponse
  };
}

function formatExecutionMessage(result) {
  const { status, app, recipient, length, query, title, filePath } = result;
  
  switch (status) {
    case 'opened':
      return `✅ ${app} has been opened successfully!`;
    
    case 'opened_and_typed':
      return `✅ ${app} opened and ${length} characters typed successfully!`;
    
    case 'typed':
      return `✅ Successfully typed ${length} characters${app !== 'active' ? ` in ${app}` : ''}!`;
    
    case 'sent':
      return `✅ Message sent to ${recipient} via ${app}! (${length} characters)`;
    
    case 'email_sent':
    case 'email_sent_outlook':
      return `✅ Email sent to ${recipient} successfully! (${length} characters)`;
    
    case 'search_completed':
      return `✅ Search completed for: "${query}"`;
    
    case 'presentation_created':
      return `✅ PowerPoint presentation "${title}" created successfully!\nFile: ${filePath}`;
    
    case 'document_created':
      return `✅ Word document "${title}" created successfully!\nFile: ${filePath}`;
    
    case 'spreadsheet_created':
      return `✅ Excel spreadsheet "${title}" created successfully!\nFile: ${filePath}`;
    
    case 'typed_for_send':
      return `✅ Message typed and ready to send to ${recipient}!`;
    
    default:
      return result.aiResponse || result.content || `✅ Command executed: ${status}`;
  }
}

// ============================================================================
// SIMPLIFIED API FOR FRONTEND
// ============================================================================

/**
 * Main API endpoint for frontend
 * @param {string} userMessage - The user's input message
 * @param {object} parsedCommand - Optional: Pre-parsed command object from your NLP
 * @param {string} geminiApiKey - Your Gemini API key
 * @returns {object} Response with message content for frontend
 */
export async function processUserMessage(userMessage, parsedCommand = null, geminiApiKey = null) {
  try {
    // Initialize Gemini AI if not already done
    if (!geminiAI && geminiApiKey) {
      initializeGeminiAI(geminiApiKey);
    }
    
    if (!geminiAI) {
      throw new Error('Gemini AI not initialized. Please provide API key.');
    }
    
    const response = await handleUserInput(userMessage, parsedCommand);
    
    return {
      success: true,
      content: actualContent || response.message,
      result:response.data,
      type: response.type,
      fullData: response.data
    };
  } catch (error) {
    console.error('❌ Error processing message:', error);
    return {
      success: false,
      content: `Sorry, I encountered an error: ${error.message}`,
      error: error.message
    };
  }
}

// Add this new function for more robust file handling
async function createFile(type, title, topic) {
  try {
    console.log(`📝 Creating ${type} file: "${title}" about ${topic}`);
    
    // Generate AI content first
    const content = await generateFileContent(type, title, topic);
    
    const tempDir = os.tmpdir();
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${sanitizedTitle}_${timestamp}`;
    
    let filePath;
    let success = false;

    switch (type.toLowerCase()) {
      case 'word':
        filePath = path.join(tempDir, `${fileName}.docx`);
        success = await createWordDocument(filePath, title, content);
        break;

      case 'powerpoint':
        filePath = path.join(tempDir, `${fileName}.pptx`);
        success = await createPowerPointPresentation(filePath, title, content);
        break;

      case 'excel':
        filePath = path.join(tempDir, `${fileName}.xlsx`);
        success = await createExcelSpreadsheet(filePath, title, content);
        break;
    }

    if (!success) {
      throw new Error(`Failed to create ${type} file`);
    }

    // Open the file
    await runPowershellScript(`Start-Process "${filePath.replace(/\\/g, '\\\\')}"`, 5000);

    return {
      success: true,
      filePath,
      fileName: path.basename(filePath),
      type,
      title,
      topic,
      contentPreview: content.substring(0, 200) + '...',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Error creating ${type} file:`, error);
    throw error;
  }
}

async function generateDetailedResponse(result) {
  try {
    if (!geminiAI) {
      throw new Error('Gemini AI not initialized');
    }

    const prompt = `Generate a natural, friendly response describing this action:
${JSON.stringify(result, null, 2)}

Requirements:
- Be specific about what was done
- Include relevant details (recipients, file names, etc.)
- Sound friendly and helpful
- Keep it concise but informative

Example formats:
- For WhatsApp: "Message sent to [recipient] via WhatsApp: '[preview of message]'"
- For email: "Email sent to [recipient] with subject '[subject]'"
- For files: "Created a [type] document titled '[title]' about [topic]"
- For apps: "Opened [app] and typed your message"```;

    const response = await geminiAI.generateResponse(prompt);
    return response;

  } catch (error) {
    console.error('Error generating response:', error);
    // Fallback to basic formatting
    return formatBasicResponse(result);
  }
}

function formatBasicResponse(result) {
  const { status, app, recipient, content, title, type } = result;
  
  switch(status) {
    case 'sent':
      return `Message sent to ${recipient} via ${app || 'WhatsApp'}`;
    case 'email_sent':
      return `Email sent to ${recipient}`;
    case 'document_created':
      return `Created ${type} document: ${title}`;
    case 'opened':
      return `Opened ${app}`;
    default:
      return `Action completed: ${status}`;
  }
}

// Add this function at the top of your file, after imports
async function generateAIContent(intent, params) {
  try {
    if (!geminiAI) {
      throw new Error('Gemini AI not initialized');
    }

    let prompt = '';
    switch (intent) {
      case 'whatsapp_message':
        prompt = `Generate a professional WhatsApp message about: ${params.topic}
Requirements:
- Keep it concise but informative
- Professional tone
- Include key points and any relevant details
- Format it nicely with line breaks where needed`;
        break;

      case 'email':
        prompt = `Write a professional email about: ${params.topic}
Requirements:
- Professional email format
- Clear subject line
- Proper greeting and closing
- Main content should cover: ${params.details || 'the main topic'}
- Keep it concise but complete`;
        break;

      case 'code':
        prompt = `Generate ${params.language} code for: ${params.topic}
Requirements:
- Include comments explaining the code
- Follow best practices
- Make it clean and readable
- Add any necessary imports`;
        break;

      case 'document':
        prompt = `Create content for a ${params.type} document about: ${params.topic}
Requirements:
- Professional formatting
- Clear structure with sections
- Include introduction and conclusion
- Cover key points comprehensively
- Use appropriate headings`;
        break;

      default:
        prompt = `Generate content about: ${params.topic}
Requirements:
- Professional and clear
- Well-structured
- Cover key points
- Keep it concise but informative`;
    }

    const content = await geminiAI.generateResponse(prompt);
    return content;
  } catch (error) {
    console.error('Error generating AI content:', error);
    throw error;
  }
}

async function generateFileContent(type, title, topic) {
  if (!geminiAI) {
    throw new Error('Gemini AI not initialized');
  }

  let prompt = '';
  
  switch(type.toLowerCase()) {
    case 'word':
      prompt = `Create professional document content about: "${topic}"
Title: "${title}"

Requirements:
- Start with an executive summary or introduction
- Create 3-4 main sections with clear headings
- Include relevant details and explanations
- End with a conclusion or summary
- Use professional business writing style
- Format with proper paragraphs and sections

Generate just the content, no explanations or markers.`;
      break;

    case 'powerpoint':
      prompt = `Create presentation content about: "${topic}"
Title: "${title}"

Requirements:
- 5-7 slides worth of content
- Clear slide titles
- Bullet points for each slide
- Keep points concise and impactful
- Cover key aspects of the topic
- Include opening and closing slides

Format as:
[Slide 1 Title]
- Point 1
- Point 2

[Slide 2 Title]
- Point 1
- Point 2

etc.

Generate just the content, no explanations.`;
      break;

    case 'excel':
      prompt = `Create spreadsheet content about: "${topic}"
Title: "${title}"

Requirements:
- Create column headers
- Generate sample data rows (10-15 entries)
- Include relevant categories and fields
- Use appropriate data types
- Add any useful calculations

Format as:
Column1|Column2|Column3
Data1|Data2|Data3

Generate just the content, no explanations.`;
      break;

    case 'code':
      const language = topic.toLowerCase().includes('python') ? 'Python' : 
                      topic.toLowerCase().includes('javascript') ? 'JavaScript' : 'Java';
                      
      prompt = `Generate ${language} code for: "${title}"

Requirements:
- Include necessary imports/includes
- Add helpful comments
- Follow ${language} best practices
- Include error handling if needed
- Make it clean and well-structured
- If it's "Hello World", include proper program structure

Generate ONLY the code, no explanations.`;
      break;

    default:
      prompt = `Create content about: "${topic}"
Title: "${title}"

Requirements:
- Professional formatting
- Clear structure
- Include key information
- Make it comprehensive but concise

Generate just the content, no explanations.`;
  }

  try {
    const content = await geminiAI.generateResponse(prompt);
    return content;
  } catch (error) {
    console.error('Error generating file content:', error);
    throw new Error(`Failed to generate ${type} content: ${error.message}`);
  }
}
