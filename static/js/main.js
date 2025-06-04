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

    let currentChart = null;

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

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    analyzeButton.addEventListener('click', handleAnalyze);

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

        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
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
        personDropdown.innerHTML = '<option value="">Kies een persoon...</option>';
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

    function handleAnalyze() {
        const selectedPerson = personDropdown.value;
        if (!selectedPerson) {
            alert('Selecteer eerst een persoon.');
            return;
        }

        // Hide export controls while loading
        if (window.chartExporter) {
            window.chartExporter.hideExportControls();
        }

        resultsSection.style.display = 'block';
        radarChartContainer.innerHTML = '<div class="loading-spinner"></div><p style="text-align: center; margin-top: 15px;">Laden van feedback data...</p>';
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
                <div style="text-align: center; color: #e74c3c;">
                    <p>❌ Fout bij ophalen van scores:</p>
                    <p>${error.message}</p>
                </div>`;
        });
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
            titleDiv.innerHTML = `<h4 style="margin: 0; color: #2c3e50; font-size: 1.4em;">Feedback Analyse voor ${personName}</h4>`;
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
                levels: 4,
                maxValue: 4,
                labelFactor: 1.3,
                wrapWidth: 120,
                opacityArea: 0.35,
                dotRadius: 4,
                strokeWidth: 2,
                roundStrokes: false,
                color: d3.scaleOrdinal().domain([0, 1]).range(["#3498db", "#27ae60"])
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
                    <div style="flex: 1; min-width: 200px;">
                        <strong>📥 Download chart</strong><br>
                        Exporteer als PNG of SVG bestand
                    </div>
                </div>`;
            radarChartContainer.appendChild(instructionsDiv);

            // Initialize export functionality after chart is ready
            if (window.chartExporter) {
                // Small delay to ensure chart is fully rendered
                setTimeout(() => {
                    window.chartExporter.initializeForChart(personName);
                }, 500);
            }

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
