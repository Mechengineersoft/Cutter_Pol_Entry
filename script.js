// Initial loader handling
// Create toast element
const toastContainer = document.createElement('div');
toastContainer.style.cssText = 'position: fixed; top: 150px; left: 20px; background: #4CAF50; color: white; padding: 16px; border-radius: 4px; z-index: 1000; opacity: 0; transition: opacity 0.3s ease-in-out;';
document.body.appendChild(toastContainer);

// Show toast message function
function showToast(message, duration = 2000) {
    toastContainer.textContent = message;
    toastContainer.style.opacity = '1';
    setTimeout(() => {
        toastContainer.style.opacity = '0';
    }, duration);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const loaderElement = document.querySelector('.app-loader');
        // Test connection with a simple request that should return empty array for non-existent block
        const response = await fetch(`${API_ENDPOINT}?blockNo=__test__`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Should return empty array for non-existent block
        if (Array.isArray(data)) {
            showToast('Welcome to Rashi Granite Block Search');
            loaderElement.classList.add('hidden');
        } else {
            throw new Error('Invalid data format received');
        }
    } catch (error) {
        console.error('Connection error:', error);
        // Hide the loader even if there's an error
        const loaderElement = document.querySelector('.app-loader');
        if (loaderElement) {
            loaderElement.classList.add('hidden');
        }
        showToast('Server connection established');
    }
});

// API endpoint configuration
const BASE_API_ENDPOINT = '/api';
const API_ENDPOINT = `${BASE_API_ENDPOINT}/data`;
const ENTRY_ENDPOINT = `${BASE_API_ENDPOINT}/entry`;

// Search Data function
async function searchData() {
    const blockNo = document.getElementById('blockNo').value;
    
    if (!blockNo) {
        alert('Block No is required');
        return;
    }

    const loaderOverlay = document.querySelector('.loader-overlay');
    loaderOverlay.classList.add('active');
    
    const partNo = document.getElementById('partNo').value;
    const thickness = document.getElementById('thickness').value;

    try {
        const response = await fetch(`${API_ENDPOINT}?blockNo=${blockNo}&partNo=${partNo}&thickness=${thickness}`);
        const data = await response.json();
        console.log('API Response:', data);
        displayData(data);
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        loaderOverlay.classList.remove('active');
    }
}

// Display Data function
function displayData(data) {
    const tableHead = document.querySelector('#dataTable thead');
    const tableBody = document.querySelector('#dataTable tbody');
    const colorDisplay = document.getElementById('colorDisplay');
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    if (data.length > 0) {
        const colour1 = data[0][21]; // Column V (index 21)
        const colour2 = data[0][22]; // Column W (index 22)
        colorDisplay.innerHTML = `Fac Colour: ${colour1} <br> Sub Colour: ${colour2}`;
        colorDisplay.style.color = colour1;
        colorDisplay.style.backgroundColor = colour2;

        // Define headers and check which columns have data
        const headers = ['Block No', 'Part', 'Thk cm', 'Nos', 'Grind', 'Net', 'Epoxy', 'Polish', 
                        'Leather', 'Lapotra', 'Honed', 'Shot', 'Pol R', 'Bal', 'B SP', 'Edge', 
                        'Meas', 'L cm', 'H cm', 'Status', 'Date'];
        const nonEmptyColumns = [];

        // Check each column for non-empty values
        for(let i = 0; i <= 20; i++) {
            const hasData = data.some(row => row[i] && row[i].toString().trim() !== '');
            if (hasData) {
                nonEmptyColumns.push(i);
            }
        }

        // Create table headers only for non-empty columns
        const headerRow = document.createElement('tr');
        nonEmptyColumns.forEach(colIndex => {
            const th = document.createElement('th');
            th.textContent = headers[colIndex];
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);

        // Create table body with only non-empty columns
        data.forEach(row => {
            const tr = document.createElement('tr');
            nonEmptyColumns.forEach(colIndex => {
                const td = document.createElement('td');
                td.textContent = row[colIndex] || '';
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    } else {
        colorDisplay.innerHTML = 'No data found';
        colorDisplay.style.color = 'black';
        colorDisplay.style.backgroundColor = 'transparent';
    }
}

// Clear Data function
function clearData() {
    document.getElementById('blockNo').value = '';
    document.getElementById('partNo').value = '';
    document.getElementById('thickness').value = '';
    document.getElementById('colorDisplay').innerHTML = '';
    document.querySelector('#dataTable tbody').innerHTML = '';
}



// Voice Input functionality
function startVoiceInput(inputId) {
    if (!('webkitSpeechRecognition' in window)) {
        alert('Voice input is not supported in your browser. Please use Chrome.');
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    const micButton = document.querySelector(`#${inputId}`).nextElementSibling;
    micButton.style.color = '#ff4444';

    recognition.onstart = () => {
        micButton.style.color = '#ff4444';
    };

    recognition.onend = () => {
        micButton.style.color = 'currentColor';
    };

    recognition.onresult = (event) => {
        let transcript = event.results[0][0].transcript;
        
        // Process the transcript to remove spaces between single characters
        // This handles cases like "a b c" becoming "abc"
        if (/^[a-z0-9](\s+[a-z0-9])+$/i.test(transcript.trim())) {
            transcript = transcript.replace(/\s+/g, '');
        }
        
        // Handle single letter or digit (they often come with spaces)
        if (transcript.trim().length === 1) {
            transcript = transcript.trim();
        }
        
        document.getElementById(inputId).value = transcript;
        // Trigger search after voice input is complete
        searchData();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        micButton.style.color = 'currentColor';
    };

    recognition.start();
}

// Entry Form Functions
let blockEntryCount = 1;

function openEntryForm() {
    document.getElementById('entryModal').style.display = 'block';
    // Set default date to today
    document.getElementById('entryDate').valueAsDate = new Date();
}

function resetForm() {
    // Reset header fields
    document.getElementById('entryDate').valueAsDate = new Date();
    document.getElementById('entryMC').value = '';
    document.getElementById('entryOperator').value = '';

    // Get all block entries
    const blockEntries = document.getElementById('blockEntries');
    
    // Keep only the first block entry and reset its fields
    while (blockEntries.children.length > 1) {
        blockEntries.removeChild(blockEntries.lastChild);
    }
    
    // Reset fields of the first block entry
    document.getElementById('blockNo_0').value = '';
    document.getElementById('thk_0').value = '';
    document.getElementById('lcm_0').value = '';
    document.getElementById('hcm_0').value = '';
    document.getElementById('nos_0').value = '';
    document.getElementById('finish_0').value = '';
    document.getElementById('colour_0').value = '';
    document.getElementById('remarks_0').value = '';

    // Show success message
    showToast('Form has been cleared');
}

function closeEntryForm() {
    document.getElementById('entryModal').style.display = 'none';
    resetForm();
}

function resetForm() {
    document.getElementById('entryForm').reset();
    const blockEntries = document.getElementById('blockEntries');
    // Keep only the first block entry and reset its values
    while (blockEntries.children.length > 1) {
        blockEntries.removeChild(blockEntries.lastChild);
    }
    blockEntryCount = 1;
}

function addBlockEntry() {
    const blockEntries = document.getElementById('blockEntries');
    const newEntry = document.createElement('div');
    newEntry.className = 'block-entry';
    newEntry.innerHTML = `
        <div class="form-group">
            <label for="blockNo_${blockEntryCount}">Block No:</label>
            <input type="text" id="blockNo_${blockEntryCount}" required>
        </div>
        <div class="form-group">
            <label for="thk_${blockEntryCount}">Thk:</label>
            <input type="number" id="thk_${blockEntryCount}" step="0.01" required>
        </div>
        <div class="form-group">
            <label for="lcm_${blockEntryCount}">L cm:</label>
            <input type="number" id="lcm_${blockEntryCount}" step="0.01" required>
        </div>
        <div class="form-group">
            <label for="hcm_${blockEntryCount}">H cm:</label>
            <input type="number" id="hcm_${blockEntryCount}" step="0.01" required>
        </div>
        <div class="form-group">
            <label for="nos_${blockEntryCount}">Nos:</label>
            <input type="number" id="nos_${blockEntryCount}" required>
        </div>
        <div class="form-group">
            <label for="finish_${blockEntryCount}">Finish:</label>
            <select id="finish_${blockEntryCount}" required>
                <option value="">Select Finish</option>
                <option value="Grinding">Grinding</option>
                <option value="D Polish">D Polish</option>
                <option value="E Polish">E Polish</option>
                <option value="Leather">Leather</option>
                <option value="Lapotra">Lapotra</option>
                <option value="Honed">Honed</option>
                <option value="Repolish">Repolish</option>
                <option value="Polish Remove">Polish Remove</option>
                <option value="Epoxy Remove">Epoxy Remove</option>
                <option value="Thickness Decrease">Thickness Decrease</option>
                <option value="Brushing">Brushing</option>
                <option value="Bush Hammering">Bush Hammering</option>
                <option value="NA">NA</option>
            </select>
        </div>
        <div class="form-group">
            <label for="colour_${blockEntryCount}">Colour:</label>
            <input type="text" id="colour_${blockEntryCount}" required>
        </div>
        <div class="form-group">
            <label for="remarks_${blockEntryCount}">Remarks:</label>
            <input type="text" id="remarks_${blockEntryCount}">
        </div>
    `;
    blockEntries.appendChild(newEntry);
    blockEntryCount++;
}

async function submitEntryForm(event) {
    event.preventDefault();
    
    // Validate required header fields
    const date = document.getElementById('entryDate').value;
    const mc = document.getElementById('entryMC').value;
    const operator = document.getElementById('entryOperator').value;

    if (!date || !mc || !operator) {
        showToast('Please fill in all header fields');
        return;
    }

    const formData = {
        date,
        mc,
        operator,
        blocks: []
    };

    // Collect and validate block entries
    for (let i = 0; i < blockEntryCount; i++) {
        const blockNo = document.getElementById(`blockNo_${i}`).value;
        const thk = document.getElementById(`thk_${i}`).value;
        const lcm = document.getElementById(`lcm_${i}`).value;
        const hcm = document.getElementById(`hcm_${i}`).value;
        const nos = document.getElementById(`nos_${i}`).value;
        const finish = document.getElementById(`finish_${i}`).value;
        const colour = document.getElementById(`colour_${i}`).value;
        const remarks = document.getElementById(`remarks_${i}`).value || '';

        // Skip empty block entries
        if (!blockNo && !thk && !lcm && !hcm && !nos && !finish && !colour) {
            continue;
        }

        // Validate required fields
        if (!blockNo || !thk || !lcm || !hcm || !nos || !finish || !colour) {
            showToast(`Please fill in all required fields for Block Entry ${i + 1}`);
            return;
        }

        // Validate numeric fields
        if (isNaN(thk) || isNaN(lcm) || isNaN(hcm) || isNaN(nos)) {
            showToast(`Please enter valid numbers for measurements in Block Entry ${i + 1}`);
            return;
        }

        const blockData = {
            blockNo,
            thk: parseFloat(thk),
            lcm: parseFloat(lcm),
            hcm: parseFloat(hcm),
            nos: parseInt(nos),
            finish,
            colour,
            remarks
        };
        formData.blocks.push(blockData);
    }

    try {
        const response = await fetch(ENTRY_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
        }

        console.log('Submission successful:', responseData);
        showToast('Data submitted successfully!');
        closeEntryForm();
    } catch (error) {
        console.error('Error submitting data:', error);
        showToast(`Error submitting data: ${error.message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Add input event listeners to search fields
    const searchFields = ['blockNo', 'partNo', 'thickness'];
    searchFields.forEach(fieldId => {
        document.getElementById(fieldId).addEventListener('input', debounce(() => {
            if (document.getElementById('blockNo').value) {
                searchData();
            }
        }, 300));
    });
});

// Debounce function to prevent too many API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}