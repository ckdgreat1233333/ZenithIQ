// Initialize Socket.IO
const socket = io();

// DOM Elements
// Removed chalkboard related elements
// const chalkboard = document.getElementById('chalkboard');
// const ctx = chalkboard.getContext('2d');

// Sidebar Buttons
const clearBtn = document.getElementById('clearBtn'); // Clear Chat button remains in sidebar
// Removed recognizeBtn as chalkboard is removed
// const recognizeBtn = document.getElementById('recognizeBtn');
const mindmapBtn = document.getElementById('mindmapBtn'); // Generate Mind Map button remains in sidebar
const notesBtn = document.getElementById('notesBtn'); // Generate Notes button remains in sidebar

// Chat Elements
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');
const clearChatBtn = document.getElementById('clearChatBtn'); // Clear Chat button within chat header

// Mind Map Elements
const mindmapInput = document.getElementById('mindmap-input');
const generateMindmapBtn = document.getElementById('generate-mindmap-btn');
const downloadMindmapPngBtn = document.getElementById('download-mindmap-png-btn');
const downloadMindmapPdfBtn = document.getElementById('download-mindmap-pdf-btn');

// Notes Elements
const notesInput = document.getElementById('notes-input');
const generateNotesBtn = document.getElementById('generate-notes-btn');
const downloadNotesBtn = document.getElementById('download-notes-btn');

// Tab Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Progress Bar Elements
const mindmapProgressContainer = document.getElementById('mindmap-progress');
const notesProgressContainer = document.getElementById('notes-progress');

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false, // Prevent automatic rendering on load
    theme: 'default', // Use the default theme for better visibility in both light/dark modes
    securityLevel: 'loose'
});

// Removed drawing state variables
// let isDrawing = false;
// let lastX = 0;
// let lastY = 0;
// let currentColor = '#19c37d';
// let currentWidth = 2;
// let drawingStrokes = [];

// Chat history
let chatHistory = [];

// Removed canvas resize and redraw functions
// function resizeCanvas() { ... }
// function redrawStrokes() { ... }

// Removed drawing functions
// function startDrawing(e) { ... }
// function draw(e) { ... }
// function stopDrawing() { ... }
// function clearChalkboard() { ... }

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Hide all tab panes
        tabPanes.forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Show the active tab pane
        const activePane = document.getElementById(`${tabId}-tab`);
        if (activePane) {
            activePane.classList.add('active');
             // If the active tab is mindmap, re-render it
            if (tabId === 'mindmap') {
                 const mindmapDiv = document.getElementById('mindmap');
                 const mermaidCode = mindmapDiv.dataset.mermaidCode; // Retrieve stored mermaid code
                 if (mermaidCode) {
                     renderMindmap(mermaidCode); // Re-render mindmap if code exists
                 }
             }
             // If the active tab is notes, ensure content is visible/rendered
             if (tabId === 'notes') {
                 // Notes are already in the HTML, just ensure visibility handled by CSS active class
             }
             // No specific action needed for chat tab visibility beyond CSS
        }
    });
});

// Chat functions
function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Add to chat history
    chatHistory.push({ message, isUser });
}

function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    addMessage(message, true);
    socket.emit('message', message);
    userInput.value = '';
}

function clearChat() {
     chatMessages.innerHTML = '';
     chatHistory = [];
}

// Progress indicator functions
function showProgress(type) {
    const progressContainer = type === 'mindmap' ? mindmapProgressContainer : notesProgressContainer;
    const progressFill = progressContainer.querySelector('.progress-fill');
    const progressPercentage = progressContainer.querySelector('.progress-percentage');

    progressContainer.style.display = 'block';
    let progress = 0;

    const simulateProgress = () => {
        if (progress < 30) {
            progress += 5;
        } else if (progress < 70) {
            progress += 2;
        } else if (progress < 95) {
            progress += 0.5;
        }

        progressFill.style.width = `${progress}%`;
        progressPercentage.textContent = `${Math.round(progress)}%`;

        if (progress < 95) {
            setTimeout(simulateProgress, 100);
        } else {
             // If progress reaches 95, set width to 100% and percentage to 100
             progressFill.style.width = '100%';
             progressPercentage.textContent = '100%';
        }
    };

    simulateProgress();

    return () => {
        progressContainer.style.display = 'none';
        // Reset width and percentage for the next time it's shown
        progressFill.style.width = '0%';
        progressPercentage.textContent = '0%';
    };
}

function removeAsterisks(text) {
    return text.replace(/\*/g, '');
}

// Mind map functions
function generateMindMap() {
    const topic = mindmapInput.value.trim();
    if (!topic) return;

    const mindmapDiv = document.getElementById('mindmap');

    // Check if there's an existing mind map and ask for confirmation to replace
    if (mindmapDiv.innerHTML.trim() !== '') {
        const confirmReplace = confirm('A mind map already exists. Do you want to replace it?');
        if (!confirmReplace) {
            return; // User cancelled
        }
        // Clear the existing mind map if confirmed
        mindmapDiv.innerHTML = '';
         // Also clear any stored mermaid code
         mindmapDiv.dataset.mermaidCode = '';
    }

    // Disable download buttons while generating
    downloadMindmapPngBtn.disabled = true;
    downloadMindmapPdfBtn.disabled = true;

    const stopProgress = showProgress('mindmap');
    socket.emit('generate_mindmap', { content: topic });

    // Store the stop function to be called when the response is received
    generateMindMap.stopProgress = stopProgress;
}

// Function to render the mindmap using mermaid.render
function renderMindmap(mermaidCode) {
    const mindmapDiv = document.getElementById('mindmap');

    // Clear previous content
    mindmapDiv.innerHTML = '';

    // Generate a unique ID for the mermaid diagram
    const diagramId = 'mindmap-' + Date.now();

    // Render the mermaid code directly into the div
    mermaid.render(diagramId, mermaidCode).then(({
        svg,
        bindFunctions
    }) => {
        mindmapDiv.innerHTML = svg;
        if (bindFunctions) {
            // Bind event listeners if any (e.g., for interactive diagrams)
            bindFunctions(mindmapDiv);
        }
        // Enable download buttons after successful rendering
        downloadMindmapPngBtn.disabled = false;
        downloadMindmapPdfBtn.disabled = false;

    }).catch((error) => {
        console.error('Mermaid rendering error:', error);
        mindmapDiv.innerHTML = '<p>Error rendering mind map.</p>';
         // Ensure buttons are re-enabled even on error, or handle error state appropriately
        downloadMindmapPngBtn.disabled = false;
        downloadMindmapPdfBtn.disabled = false;
    });
}

// Notes functions
function generateNotes() {
    const topic = notesInput.value.trim();
    if (!topic) return;

    // Disable download button while generating
    downloadNotesBtn.disabled = true;

    const stopProgress = showProgress('notes');
    socket.emit('generate_notes', { content: topic });

    // Store the stop function to be called when the response is received
    generateNotes.stopProgress = stopProgress;
}

function formatNotes(notes) {
    const notesContentDiv = document.getElementById('notes-content');
    // Clear previous content
    notesContentDiv.innerHTML = '';

    const notesTemplate = document.createElement('div');
    notesTemplate.className = 'notes-template';

    const title = document.createElement('h1');
    title.className = 'notes-title';
    title.textContent = notesInput.value.trim() || 'Generated Notes';
    notesTemplate.appendChild(title);

    const body = document.createElement('div');
    body.className = 'notes-body';

    const formattedContent = removeAsterisks(notes)
        .split('\n')
        .map(line => {
            if (line.startsWith('# ')) {
                return `<h2>${line.substring(2)}</h2>`;
            }
            if (line.startsWith('## ')) {
                return `<h3>${line.substring(3)}</h3>`;
            }
             // Handle list items robustly
            if (line.trim().startsWith('-')) {
                 return `<li>${line.trim().substring(1).trim()}</li>`;
            }
             // Handle code blocks - simplistic, might need more robust parsing for multi-line
            if (line.trim().startsWith('```')) {
                // Toggle a flag for being inside a code block if needed for multi-line
                return `<pre><code>${line.trim().substring(3).trim()}</code></pre>`;
            }
            // Handle regular paragraphs - avoid creating empty paragraphs
            if (line.trim() === '') {
                 return ''; // Skip empty lines
            }
            return `<p>${line}</p>`;
        })
        .join('');

    body.innerHTML = formattedContent;
    notesTemplate.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'notes-footer';
    const generatedBy = document.createElement('p');
    generatedBy.textContent = 'Generated by ZenithIQ';
    footer.appendChild(generatedBy);
    const timestamp = document.createElement('p');
    timestamp.className = 'timestamp';
    const now = new Date();
    timestamp.textContent = `Generated on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
    footer.appendChild(timestamp);
    notesTemplate.appendChild(footer);

    notesContentDiv.appendChild(notesTemplate);

    // Enable download button
    downloadNotesBtn.disabled = false;
}

// Function to download notes as PDF
function downloadNotesAsPDF() {
    const notesElement = document.getElementById('notes-content');

    html2canvas(notesElement, { scale: 2 }).then(canvas => { // Increased scale for better resolution
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({ // Use window.jspdf
            orientation: 'portrait', // Notes are typically portrait
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('notes.pdf');
    }).catch(error => {
        console.error('Error capturing notes for PDF download:', error);
        alert('Could not download notes as PDF.');
    });
}

// Removed recognizeDrawing function
// function recognizeDrawing() { ... }

// Event listeners
// Removed window resize listener as chalkboard is gone
// window.addEventListener('resize', resizeCanvas);

// Removed drawing event listeners
// chalkboard.addEventListener('mousedown', startDrawing);
// chalkboard.addEventListener('mousemove', draw);
// chalkboard.addEventListener('mouseup', stopDrawing);
// chalkboard.addEventListener('mouseout', stopDrawing);

// Button event listeners
clearBtn.addEventListener('click', clearChat); // Sidebar clear button
// Removed recognizeBtn event listener
// recognizeBtn.addEventListener('click', recognizeDrawing);
mindmapBtn.addEventListener('click', generateMindMap); // Sidebar generate mind map button
notesBtn.addEventListener('click', generateNotes); // Sidebar generate notes button

// Chat input and send button event listeners
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
clearChatBtn.addEventListener('click', clearChat); // Chat header clear chat button

// Mind map input and generate button event listeners
generateMindmapBtn.addEventListener('click', generateMindMap);
mindmapInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') generateMindmap();
});

// Add event listener for PNG download button
downloadMindmapPngBtn.addEventListener('click', () => {
    const mindmapElement = document.getElementById('mindmap');

    // Use html2canvas to capture the mind map div
    html2canvas(mindmapElement, { scale: 2 }).then(canvas => { // Increased scale for better resolution
        // Create an image URL from the canvas
        const imageUrl = canvas.toDataURL('image/png');

        // Create a temporary link element to trigger the download
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'mindmap.png'; // Set the download file name

        // Append the link to the body and click it to trigger download
        document.body.appendChild(link);
        link.click();

        // Clean up by removing the link element
        document.body.removeChild(link);
    }).catch(error => {
        console.error('Error capturing mind map for PNG download:', error);
        alert('Could not download mind map as PNG.');
    });
});

// Event listener for PDF download button
downloadMindmapPdfBtn.addEventListener('click', () => {
    const mindmapElement = document.getElementById('mindmap');

    html2canvas(mindmapElement, { scale: 2 }).then(canvas => { // Increased scale for better resolution
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({ // Use window.jspdf
            orientation: 'landscape', // Set orientation to landscape
            unit: 'px', // Set units to pixels
            format: [canvas.width, canvas.height]
        });

        // Add the image to the PDF
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

        // Save the PDF
        pdf.save('mindmap.pdf');
    }).catch(error => {
        console.error('Error capturing mind map for PDF download:', error);
        alert('Could not download mind map as PDF.');
    });
});

// Notes input and generate button event listeners
generateNotesBtn.addEventListener('click', generateNotes);
notesInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') generateNotes();
});

// Notes download button event listener
downloadNotesBtn.addEventListener('click', downloadNotesAsPDF);

// Socket event handlers
socket.on('response', (data) => {
    addMessage(removeAsterisks(data.response));
});

// Removed recognition_result socket handler
// socket.on('recognition_result', (data) => { ... });

socket.on('mindmap', (data) => {
    if (generateMindMap.stopProgress) {
        // Show 100% before stopping
        const progressFill = mindmapProgressContainer.querySelector('.progress-fill');
        const progressPercentage = mindmapProgressContainer.querySelector('.progress-percentage');
        progressFill.style.width = '100%';
        progressPercentage.textContent = '100%';

        // Wait a moment before hiding
        setTimeout(() => {
            generateMindMap.stopProgress();
        }, 500);
    }

    const mindmapDiv = document.getElementById('mindmap');
    const mermaidCode = removeAsterisks(data.mermaid);
    mindmapDiv.dataset.mermaidCode = mermaidCode; // Store mermaid code on the element

    renderMindmap(mermaidCode); // Render the mindmap
});

socket.on('notes', (data) => {
     if (generateNotes.stopProgress) {
        // Show 100% before stopping
        const progressFill = notesProgressContainer.querySelector('.progress-fill');
        const progressPercentage = notesProgressContainer.querySelector('.progress-percentage');
        progressFill.style.width = '100%';
        progressPercentage.textContent = '100%';

        // Wait a moment before hiding
        setTimeout(() => {
            generateNotes.stopProgress();
        }, 500);
    }
    formatNotes(data.notes);
});

// Initial setup (removed initial canvas resize)
// resizeCanvas();

// Set up observers or other mechanisms if needed to trigger resizeCanvas
// when the layout changes dynamically (e.g., sidebar collapses/expands)

// Add event listener for the dark mode toggle button
const darkModeToggleBtn = document.getElementById('darkModeToggleBtn');

darkModeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    // Save the current theme preference to local storage
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

// Check for saved theme preference on page load
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
} else {
    // Default to light mode if no preference is saved or if it's light
    document.body.classList.remove('dark-mode');
}