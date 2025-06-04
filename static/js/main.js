// RadarChart Frontend JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // DOM elementen
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadStatus = document.getElementById('uploadStatus');
    const personSelection = document.getElementById('personSelection');
    const personDropdown = document.getElementById('personDropdown');
    const analyzeButton = document.getElementById('analyzeButton');
    const resultsSection = document.getElementById('resultsSection');
    const radarChartContainer = document.getElementById('radarChartContainer');

    // Variabele om huidige chart instance bij te houden
    let currentChart = null;

    // API Info inklapbaar maken
    const apiInfo = document.querySelector('.api-info.collapsible');
    if (apiInfo) {
        const header = apiInfo.querySelector('h3');
        const content = apiInfo.querySelector('.api-content');
        const toggleIcon = apiInfo.querySelector('.toggle-icon');
        
        // Start ingeklapte staat
        apiInfo.classList.add('collapsed');
        
        header.addEventListener('click', function() {
            apiInfo.classList.toggle('collapsed');
            toggleIcon.style.transform = apiInfo.classList.contains('collapsed') 
                ? 'rotate(-90deg)' 
                : 'rotate(0deg)';
        });
    }

    // Upload area event listeners
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Analyze button event listener
    analyzeButton.addEventListener('click', handleAnalyze);

    // Window resize handler voor responsive chart
    window.addEventListener('resize', function() {
        if (currentChart && personDropdown.value) {
            // Debounce resize events
            clearTimeout(window.resizeTimeout);
            window.resizeTimeout = setTimeout(() => {
                handleAnalyze(); // Re-render chart met nieuwe afmetingen
            }, 250);
        }
    });

    // Drag & Drop handlers
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
        // Valideer bestandstype
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ];
        
        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
            showStatus('error', 'Ongeldig bestandstype. Alleen Excel (.xlsx, .xls) en CSV bestanden zijn toegestaan.');
            return;
        }

        // Valideer bestandsgrootte (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showStatus('error', 'Bestand is te groot. Maximum grootte is 10MB.');
            return;
        }

        // Toon bestandsinfo
        const fileInfo = `Geselecteerd: ${file.name} (${formatFileSize(file.size)})`;
        showStatus('uploading', fileInfo);
        
        // Upload bestand
        uploadFile(file);
    }

    function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        // Toon progress
        showProgress(0);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // FIX: Gebruik data.persons.length in plaats van data.people_count
                showStatus('success', `✅ Upload succesvol! ${data.persons.length} personen gevonden.`);
                showProgress(100);
                
                // FIX: Gebruik data.persons in plaats van data.people
                populatePersonDropdown(data.persons);
                
                // Toon personen selectie
                setTimeout(() => {
                    personSelection.style.display = 'block';
                    personSelection.scrollIntoView({ behavior: 'smooth' });
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
        // Leeg dropdown
        personDropdown.innerHTML = '<option value="">Kies een persoon...</option>';
        
        // Voeg personen toe
        people.forEach(person => {
            const option = document.createElement('option');
            option.value = person;
            option.textContent = person;
            personDropdown.appendChild(option);
        });

        // Enable analyze button wanneer persoon geselecteerd
        personDropdown.addEventListener('change', function() {
            analyzeButton.disabled = !this.value;
        });
    }

    function handleAnalyze() {
        const selectedPerson = personDropdown.value;
        if (!selectedPerson) {
            alert('Selecteer eerst een persoon.');
            return;
        }

        // Toon loading in results sectie
        resultsSection.style.display = 'block';
        radarChartContainer.innerHTML = '<div class="loading-spinner"></div><p style="text-align: center; margin-top: 15px;">Laden van feedback data...</p>';
        
        // Scroll naar resultaten
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        // Haal scores op
        fetch(`/get_scores/${encodeURIComponent(selectedPerson)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
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
                <div style="text-align: center; color: #e74c3c;">
                    <p>❌ Fout bij ophalen van scores:</p>
                    <p>${error.message}</p>
                </div>
            `;
        });
    }

    function displayRadarChart(scores, personName) {
        try {
            // Cleanup vorige chart
            if (currentChart) {
                currentChart.destroy();
                currentChart = null;
            }

            // Leeg container
            radarChartContainer.innerHTML = '';

            // Controleer of D3 beschikbaar is
            if (typeof d3 === 'undefined') {
                throw new Error('D3.js is niet geladen. Controleer de internetverbinding.');
            }

            // Controleer of radarChart functie beschikbaar is
            if (typeof initializeRadarChart === 'undefined') {
                throw new Error('Radar chart component is niet geladen.');
            }

            // Bereken responsive afmetingen
            const containerWidth = radarChartContainer.offsetWidth || 600;
            const maxWidth = Math.min(containerWidth * 0.9, 600);
            const chartSize = Math.min(maxWidth, window.innerHeight * 0.6);

            // Voeg titel toe BOVEN de chart (zonder icon)
            const titleDiv = document.createElement('div');
            titleDiv.style.textAlign = 'center';
            titleDiv.style.marginBottom = '30px';
            titleDiv.innerHTML = `<h4 style="margin: 0; color: #2c3e50; font-size: 1.4em;">Feedback Analyse voor ${personName}</h4>`;
            radarChartContainer.appendChild(titleDiv);

            // Maak chart container
            const chartDiv = document.createElement('div');
            chartDiv.id = 'radar-chart-svg';
            chartDiv.style.textAlign = 'center';
            radarChartContainer.appendChild(chartDiv);

            // Configuratie voor radar chart
            const chartOptions = {
                w: chartSize,
                h: chartSize,
                margin: { top: 60, right: 100, bottom: 60, left: 100 }, // Meer ruimte voor labels
                levels: 5,
                maxValue: 5,
                labelFactor: 1.3, // Iets verder van center voor betere leesbaarheid
                wrapWidth: 80, // Meer ruimte voor lange labels
                opacityArea: 0.35,
                dotRadius: 4,
                strokeWidth: 2,
                roundStrokes: false,
                color: d3.scaleOrdinal()
                    .domain([0, 1])
                    .range(["#3498db", "#27ae60"]) // Blauw voor individueel, groen voor team
            };

            // Controleer data structuur en maak team gemiddelden als ze ontbreken
            let scoresData = scores;
            if (!scores.team_averages) {
                console.warn('Geen team gemiddelden beschikbaar, gebruik individuele scores als referentie');
                scoresData = {
                    individual_scores: scores,
                    team_averages: scores // Gebruik individuele scores als fallback
                };
            }

            // Initialiseer radar chart
            currentChart = initializeRadarChart('#radar-chart-svg', scoresData, personName, chartOptions);

            // Voeg instructies toe ONDER de chart
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
                <p style="margin: 0 0 15px 0; font-weight: bold; color: #2c3e50;">💡 Hoe de radar chart te gebruiken:</p>
                <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 15px;">
                    <div style="flex: 1; min-width: 200px;">
                        <strong>🖱️ Hover over punten</strong><br>
                        Zie exacte scores per competentie
                    </div>
                    <div style="flex: 1; min-width: 200px;">
                        <strong>🎯 Klik op legenda</strong><br>
                        Toon/verberg individuele of team scores
                    </div>
                    <div style="flex: 1; min-width: 200px;">
                        <strong>✨ Hover over areas</strong><br>
                        Highlight effect voor betere focus
                    </div>
                </div>
            `;
            radarChartContainer.appendChild(instructionsDiv);

            console.log('Radar chart succesvol geladen voor:', personName);

        } catch (error) {
            console.error('Radar chart error:', error);
            
            // Fallback naar basis weergave
            radarChartContainer.innerHTML = `
                <div style="text-align: center;">
                    <h4>📊 Feedback Scores voor ${personName}</h4>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #e74c3c; margin-bottom: 15px;">
                            ⚠️ Radar chart kon niet worden geladen: ${error.message}
                        </p>
                        <p style="color: #7f8c8d;">Basis score weergave:</p>
                    </div>
                    <div style="text-align: left; max-width: 500px; margin: 0 auto;">
            `;

            // Toon basis scores als fallback
            const scoresObj = scores.individual_scores || scores;
            Object.entries(scoresObj).forEach(([category, score]) => {
                const percentage = Math.round(score * 20); // Converteer 1-5 naar 0-100%
                radarChartContainer.innerHTML += `
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span><strong>${category}:</strong></span>
                            <span>${score.toFixed(1)}/5.0</span>
                        </div>
                        <div style="background-color: #ecf0f1; height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: linear-gradient(90deg, #3498db, #2980b9); height: 100%; width: ${percentage}%; transition: width 0.5s ease;"></div>
                        </div>
                    </div>
                `;
            });

            radarChartContainer.innerHTML += `
                    </div>
                </div>
            `;
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