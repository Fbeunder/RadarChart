// RadarChart Frontend JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadStatus = document.getElementById('uploadStatus');
    const personSelection = document.getElementById('personSelection');
    const personDropdown = document.getElementById('personDropdown');
    const analyzeButton = document.getElementById('analyzeButton');
    const resultsSection = document.getElementById('resultsSection');
    const radarChartContainer = document.getElementById('radarChartContainer');
    const batchExportSection = document.getElementById('batchExportSection');
    const createAllButton = document.getElementById('createAllButton');

    let currentChart = null;

    // API Info collapsible functionality
    const apiInfo = document.querySelector('.api-info.collapsible');
    if (apiInfo) {
        const header = apiInfo.querySelector('h3');
        const content = apiInfo.querySelector('.api-content');
        const toggleIcon = apiInfo.querySelector('.toggle-icon');

        apiInfo.classList.add('collapsed');
        header.addEventListener('click', function() {
            apiInfo.classList.toggle('collapsed');
            toggleIcon.style.transform = apiInfo.classList.contains('collapsed')
                ? 'rotate(-90deg)'
                : 'rotate(0deg)';
        });
    }

    // Event listeners
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    analyzeButton.addEventListener('click', handleAnalyze);
    createAllButton.addEventListener('click', handleCreateAll);

    // Responsive chart resizing
    window.addEventListener('resize', function() {
        if (currentChart && personDropdown.value) {
            clearTimeout(window.resizeTimeout);
            window.resizeTimeout = setTimeout(() => {
                handleAnalyze();
            }, 250);
        }
    });

    function handleDragOver(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    }

    function handleFile(file) {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];

        if (!allowedTypes.includes(file.type) && !file.name.match(/\\.(xlsx|xls|csv)$/i)) {
            showStatus('error', 'Ongeldig bestandstype. Alleen Excel (.xlsx, .xls) en CSV bestanden zijn toegestaan.');
            return;
        }

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            showStatus('error', 'Bestand is te groot. Maximum grootte is 10MB.');
            return;
        }

        const fileInfo = `Geselecteerd: ${file.name} (${formatFileSize(file.size)})`;
        showStatus('uploading', fileInfo);

        uploadFile(file);
    }

    function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        showProgress(0);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showStatus('success', `✅ Upload succesvol! ${data.persons.length} personen gevonden.`);
                showProgress(100);
                populatePersonDropdown(data.persons);
                setTimeout(() => {
                    personSelection.style.display = 'block';
                    personSelection.scrollIntoView({ behavior: 'smooth' });
                    // Toon batch export sectie na succesvolle upload
                    showBatchExportSection();
                }, 500);
            } else {
                throw new Error(data.error || 'Upload mislukt');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            showStatus('error', `❌ Upload mislukt: ${error.message}`);
            showProgress(0);
        });
    }

    function populatePersonDropdown(people) {
        personDropdown.innerHTML = '<option value=\"\">Kies een persoon...</option>';
        people.forEach(person => {
            const option = document.createElement('option');
            option.value = person;
            option.textContent = person;
            personDropdown.appendChild(option);
        });
        personDropdown.addEventListener('change', function() {
            analyzeButton.disabled = !this.value;
        });
    }

    function showBatchExportSection() {
        batchExportSection.style.display = 'block';
    }

    function handleAnalyze() {
        const selectedPerson = personDropdown.value;
        if (!selectedPerson) {
            alert('Selecteer eerst een persoon.');
            return;
        }

        resultsSection.style.display = 'block';
        radarChartContainer.innerHTML = '<div class=\"loading-spinner\"></div><p style=\"text-align: center; margin-top: 15px;\">Laden van feedback data...</p>';
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        fetch(`/get_scores/${encodeURIComponent(selectedPerson)}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.success) {
                displayRadarChart(data.scores, selectedPerson);
            } else {
                throw new Error(data.error || 'Kon scores niet ophalen');
            }
        })
        .catch(error => {
            console.error('Scores error:', error);
            radarChartContainer.innerHTML = `
                <div style=\"text-align: center; color: #e74c3c;\">
                    <p>❌ Fout bij ophalen van scores:</p>
                    <p>${error.message}</p>
                </div>`;
        });
    }

    // Handler voor Create All button
    async function handleCreateAll() {
        const exportProgress = document.getElementById('exportProgress');
        const currentPersonSpan = document.getElementById('currentPerson');
        const progressFill = document.querySelector('#exportProgress .progress-fill');
        
        // Vraag om export locatie
        const exportPath = await showExportDialog();
        if (!exportPath) return;
        
        createAllButton.disabled = true;
        exportProgress.style.display = 'block';
        
        try {
            // Haal lijst van personen op
            const response = await fetch('/status');
            const data = await response.json();
            const persons = data.available_persons;
            
            if (!persons || persons.length === 0) {
                throw new Error('Geen personen beschikbaar voor export');
            }
            
            // Verwerk elke persoon
            for (let i = 0; i < persons.length; i++) {
                const person = persons[i];
                currentPersonSpan.textContent = person;
                progressFill.style.width = `${((i + 1) / persons.length) * 100}%`;
                
                // Genereer en download GIF voor deze persoon
                await generateAndSaveGIF(person, exportPath);
                
                // Kleine delay om UI te updaten
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            showStatus('success', `✅ Alle ${persons.length} radar charts zijn succesvol geëxporteerd naar ${exportPath}`);
            
        } catch (error) {
            console.error('Export error:', error);
            showStatus('error', `❌ Fout bij exporteren: ${error.message}`);
        } finally {
            createAllButton.disabled = false;
            exportProgress.style.display = 'none';
        }
    }

    // Toon export dialog
    async function showExportDialog() {
        // Maak custom dialog
        const dialog = document.createElement('div');
        dialog.className = 'export-dialog-overlay';
        dialog.innerHTML = `
            <div class=\"export-dialog\">
                <h3>📁 Selecteer Export Locatie</h3>
                <p>Standaard locatie: C:\\\\temp</p>
                <input type=\"text\" id=\"exportPath\" value=\"C:\\\\temp\" class=\"export-path-input\">
                <p class=\"export-hint\">Tip: Zorg dat de map bestaat en schrijfrechten heeft</p>
                <div class=\"dialog-buttons\">
                    <button id=\"confirmExport\" class=\"btn-primary\">Exporteren</button>
                    <button id=\"cancelExport\" class=\"btn-secondary\">Annuleren</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        return new Promise((resolve) => {
            document.getElementById('confirmExport').onclick = () => {
                const path = document.getElementById('exportPath').value;
                document.body.removeChild(dialog);
                resolve(path);
            };
            
            document.getElementById('cancelExport').onclick = () => {
                document.body.removeChild(dialog);
                resolve(null);
            };
        });
    }

    // Genereer en sla GIF op voor een persoon
    async function generateAndSaveGIF(personName, exportPath) {
        // Haal scores op
        const response = await fetch(`/get_scores/${encodeURIComponent(personName)}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(`Kon scores niet ophalen voor ${personName}`);
        }
        
        // Maak tijdelijke container voor chart
        const tempContainer = document.createElement('div');
        tempContainer.id = 'temp-chart-container';
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '800px';
        tempContainer.style.height = '800px';
        document.body.appendChild(tempContainer);
        
        // Render chart
        const chart = initializeRadarChart('#temp-chart-container', data.scores, personName, {
            w: 600,
            h: 600,
            margin: { top: 100, right: 100, bottom: 100, left: 100 }
        });
        
        // Wacht tot chart volledig gerenderd is
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Converteer naar GIF via backend
        const svg = tempContainer.querySelector('svg');
        const svgData = new XMLSerializer().serializeToString(svg);
        
        const gifResponse = await fetch('/export_gif', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                svg_data: svgData,
                person_name: personName,
                export_path: exportPath
            })
        });
        
        if (!gifResponse.ok) {
            throw new Error(`Export mislukt voor ${personName}`);
        }
        
        // Cleanup
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
        document.body.removeChild(tempContainer);
    }

    function displayRadarChart(scores, personName) {
        try {
            if (currentChart) {
                currentChart.destroy();
                currentChart = null;
            }

            radarChartContainer.innerHTML = '';
            radarChartContainer.style.display = 'flex';
            radarChartContainer.style.flexDirection = 'column';
            radarChartContainer.style.alignItems = 'center';

            const titleDiv = document.createElement('div');
            titleDiv.style.textAlign = 'center';
            titleDiv.style.marginBottom = '20px';
            titleDiv.innerHTML = `<h4 style=\"margin: 0; color: #2c3e50; font-size: 1.4em;\">Feedback Analyse voor ${personName}</h4>`;
            radarChartContainer.appendChild(titleDiv);

            const chartDiv = document.createElement('div');
            chartDiv.id = 'radar-chart-svg';
            radarChartContainer.appendChild(chartDiv);

            const containerWidth = radarChartContainer.offsetWidth || 1000;
            const maxWidth = Math.min(containerWidth * 0.9, 800);
            const chartSize = Math.min(maxWidth, window.innerHeight * 0.6);

            const chartOptions = {
                w: chartSize,
                h: chartSize,
                margin: { top: 200, right: 400, bottom: 200, left: 400 },
                levels: 5,
                maxValue: 5,
                labelFactor: 1.3,
                wrapWidth: 120,
                opacityArea: 0.35,
                dotRadius: 4,
                strokeWidth: 2,
                roundStrokes: false,
                color: d3.scaleOrdinal().domain([0, 1]).range([\"#3498db\", \"#27ae60\"])
            };

            let scoresData = scores;
            if (!scores.team_averages) {
                scoresData = {
                    individual_scores: scores,
                    team_averages: scores
                };
            }

            currentChart = initializeRadarChart('#radar-chart-svg', scoresData, personName, chartOptions);

            const instructionsDiv = document.createElement('div');
            instructionsDiv.style.textAlign = 'center';
            instructionsDiv.style.marginTop = '30px';
            instructionsDiv.style.padding = '20px';
            instructionsDiv.style.backgroundColor = '#f8f9fa';
            instructionsDiv.style.borderRadius = '8px';
            instructionsDiv.style.color = '#495057';
            instructionsDiv.style.fontSize = '14px';
            instructionsDiv.style.lineHeight = '1.6';
            instructionsDiv.innerHTML = `
                <p style=\"margin: 0 0 15px 0; font-weight: bold; color: #2c3e50;\">💡 Hoe de radar chart te gebruiken:</p>
                <div style=\"display: flex; justify-content: space-around; flex-wrap: wrap; gap: 15px;\">
                    <div style=\"flex: 1; min-width: 200px;\">
                        <strong>🖱️ Hover over punten</strong><br>
                        Zie exacte scores per competentie
                    </div>
                    <div style=\"flex: 1; min-width: 200px;\">
                        <strong>🎯 Klik op legenda</strong><br>
                        Toon/verberg individuele of team scores
                    </div>
                    <div style=\"flex: 1; min-width: 200px;\">
                        <strong>✨ Hover over areas</strong><br>
                        Highlight effect voor betere focus
                    </div>
                </div>`;
            radarChartContainer.appendChild(instructionsDiv);

        } catch (error) {
            console.error('Radar chart error:', error);
            radarChartContainer.innerHTML = `<p>Fout bij het laden van de chart: ${error.message}</p>`;
        }
    }

    function showStatus(type, message) {
        const statusMessage = uploadStatus.querySelector('.status-message');
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        uploadStatus.style.display = 'block';
    }

    function showProgress(percentage) {
        const progressFill = uploadStatus.querySelector('.progress-fill');
        progressFill.style.width = `${percentage}%`;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});