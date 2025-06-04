// Batch Export Functionality for RadarChart
class BatchExporter {
    constructor() {
        this.isExporting = false;
        this.exportQueue = [];
        this.completedExports = [];
        this.failedExports = [];
        this.exportedFiles = []; // Voor batch download
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const batchExportBtn = document.getElementById('batchExportBtn');
            if (batchExportBtn) {
                batchExportBtn.addEventListener('click', () => this.startBatchExport());
            }
        });
    }

    showBatchExportControls(personCount) {
        const batchControls = document.getElementById('batchExportControls');
        const totalPersonsSpan = document.getElementById('totalPersonsCount');
        
        if (batchControls && totalPersonsSpan) {
            totalPersonsSpan.textContent = personCount;
            batchControls.style.display = 'block';
        }
    }

    async startBatchExport() {
        if (this.isExporting) return;
        
        this.isExporting = true;
        this.completedExports = [];
        this.failedExports = [];
        this.exportedFiles = [];
        
        const batchBtn = document.getElementById('batchExportBtn');
        batchBtn.disabled = true;
        
        this.showBatchStatus('processing', '📊 Voorbereiden van batch export...');
        this.showProgress(true);
        
        try {
            // Haal data voor alle personen op
            const response = await fetch('/get_all_persons_data');
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Kon personen data niet ophalen');
            }
            
            this.exportQueue = data.persons_data;
            const total = this.exportQueue.length;
            
            this.updateProgressBar(0, total);
            this.showBatchStatus('processing', `🚀 Exporteren van ${total} radar charts...`);
            
            // Genereer datum voor bestandsnamen
            const exportDate = new Date().toISOString().split('T')[0];
            
            // Process exports met delay om browser niet te overbelasten
            for (let i = 0; i < this.exportQueue.length; i++) {
                const personData = this.exportQueue[i];
                
                try {
                    const fileBlob = await this.exportSinglePerson(personData, exportDate);
                    this.completedExports.push(personData.person_name);
                    this.exportedFiles.push({
                        name: personData.person_name,
                        blob: fileBlob,
                        filename: this.generateFileName(personData.person_name, exportDate)
                    });
                } catch (error) {
                    console.error(`Export failed for ${personData.person_name}:`, error);
                    this.failedExports.push({
                        name: personData.person_name,
                        error: error.message
                    });
                }
                
                this.updateProgressBar(i + 1, total);
                
                // Kleine delay tussen exports
                await this.delay(100);
            }
            
            // Start batch download van alle bestanden
            if (this.exportedFiles.length > 0) {
                this.showBatchStatus('processing', '📦 Voorbereiden van batch download...');
                await this.downloadAllFiles();
            }
            
            this.showCompletionStatus();
            
        } catch (error) {
            this.showBatchStatus('error', `❌ Batch export mislukt: ${error.message}`);
        } finally {
            this.isExporting = false;
            batchBtn.disabled = false;
            setTimeout(() => this.hideProgress(), 3000);
        }
    }

    async exportSinglePerson(personData, exportDate) {
        // Render de radar chart voor deze persoon (invisible)
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '1000px';
        tempContainer.style.height = '800px';
        document.body.appendChild(tempContainer);
        
        try {
            // Initialize radar chart met person data
            const chartOptions = {
                w: 600,
                h: 600,
                margin: { top: 100, right: 200, bottom: 100, left: 200 },
                levels: 5,
                maxValue: 5,
                labelFactor: 1.3,
                wrapWidth: 120,
                opacityArea: 0.35,
                dotRadius: 4,
                strokeWidth: 2,
                roundStrokes: false,
                color: d3.scaleOrdinal().domain([0, 1]).range(["#3498db", "#27ae60"])
            };
            
            // Render chart
            const chart = initializeRadarChart(tempContainer, personData.scores, personData.person_name, chartOptions);
            
            // Wacht tot chart volledig gerenderd is
            await this.delay(500);
            
            // Gebruik ChartExporter om PNG te maken met dezelfde opmaak als enkele export
            const svgElement = tempContainer.querySelector('svg');
            if (!svgElement) throw new Error('Chart rendering failed');
            
            // Maak complete export SVG met dezelfde opmaak als ChartExporter
            const exporter = new ChartExporter();
            exporter.setCurrentPersonName(personData.person_name);
            const completeSvg = await exporter.createCompleteExportSvg(svgElement);
            
            // Converteer naar PNG blob (niet downloaden)
            const pngBlob = await this.convertSVGtoPNGBlob(completeSvg);
            
            // Cleanup
            if (chart && chart.destroy) chart.destroy();
            
            return pngBlob;
            
        } finally {
            // Verwijder temp container
            document.body.removeChild(tempContainer);
        }
    }

    async convertSVGtoPNGBlob(svgElement) {
        return new Promise((resolve, reject) => {
            try {
                // Create canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Get SVG dimensions
                const svgWidth = parseInt(svgElement.getAttribute('width')) || 800;
                const svgHeight = parseInt(svgElement.getAttribute('height')) || 600;
                
                // Set canvas size with high DPI for better quality
                const scale = 2; // 2x resolution for crisp export
                canvas.width = svgWidth * scale;
                canvas.height = svgHeight * scale;
                canvas.style.width = svgWidth + 'px';
                canvas.style.height = svgHeight + 'px';
                
                // Scale context for high DPI
                ctx.scale(scale, scale);
                
                // Fill white background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, svgWidth, svgHeight);
                
                // Convert SVG to data URL
                const svgData = new XMLSerializer().serializeToString(svgElement);
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);
                
                // Create image and draw to canvas
                const img = new Image();
                
                img.onload = () => {
                    try {
                        // Draw image
                        ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
                        
                        // Convert canvas to blob
                        canvas.toBlob((blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Kon PNG niet genereren'));
                            }
                        }, 'image/png', 0.95);
                        
                        // Cleanup
                        URL.revokeObjectURL(svgUrl);
                        
                    } catch (error) {
                        reject(error);
                    }
                };
                
                img.onerror = () => {
                    URL.revokeObjectURL(svgUrl);
                    reject(new Error('Kon SVG niet laden voor PNG conversie'));
                };
                
                // Set crossOrigin before src to avoid CORS issues
                img.crossOrigin = 'anonymous';
                img.src = svgUrl;
                
            } catch (error) {
                reject(error);
            }
        });
    }

    async downloadAllFiles() {
        // Download alle bestanden in één batch met korte delays
        for (let i = 0; i < this.exportedFiles.length; i++) {
            const file = this.exportedFiles[i];
            this.downloadBlob(file.blob, file.filename);
            
            // Korte delay tussen downloads om browser niet te overbelasten
            if (i < this.exportedFiles.length - 1) {
                await this.delay(200);
            }
        }
    }

    downloadBlob(blob, filename) {
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    generateFileName(personName, exportDate) {
        // Gebruik dezelfde naamgeving als ChartExporter voor consistentie
        const cleanName = personName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        
        return `${exportDate}_${cleanName}.png`;
    }

    updateProgressBar(current, total) {
        const progressFill = document.querySelector('.batch-progress-fill');
        const currentSpan = document.getElementById('batchProgressCurrent');
        const totalSpan = document.getElementById('batchProgressTotal');
        
        if (progressFill) {
            const percentage = (current / total) * 100;
            progressFill.style.width = `${percentage}%`;
        }
        
        if (currentSpan) currentSpan.textContent = current;
        if (totalSpan) totalSpan.textContent = total;
    }

    showProgress(show) {
        const progressDiv = document.getElementById('batchExportProgress');
        if (progressDiv) {
            progressDiv.style.display = show ? 'block' : 'none';
        }
    }

    hideProgress() {
        this.showProgress(false);
    }

    showBatchStatus(type, message) {
        const statusDiv = document.getElementById('batchExportStatus');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = `batch-status ${type}`;
            statusDiv.style.display = 'block';
        }
    }

    showCompletionStatus() {
        const total = this.exportQueue.length;
        const succeeded = this.completedExports.length;
        const failed = this.failedExports.length;
        
        if (failed === 0) {
            this.showBatchStatus('success', 
                `✅ Alle ${succeeded} radar charts succesvol geëxporteerd en gedownload!`);
        } else {
            let message = `⚠️ Export voltooid: ${succeeded} geslaagd, ${failed} mislukt.`;
            if (failed > 0) {
                message += ` Mislukte exports: ${this.failedExports.map(f => f.name).join(', ')}`;
            }
            this.showBatchStatus('error', message);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize batch exporter
window.batchExporter = new BatchExporter();