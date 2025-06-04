// RadarChart Export Functionality
// Provides PNG and SVG export capabilities for radar charts

class ChartExporter {
    constructor() {
        this.currentPersonName = '';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const exportBtn = document.getElementById('exportChartBtn');
            const exportFormat = document.getElementById('exportFormat');
            
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    const format = exportFormat ? exportFormat.value : 'png';
                    this.exportRadarChart(format);
                });
            }
        });
    }

    setCurrentPersonName(personName) {
        this.currentPersonName = personName;
    }

    showExportControls() {
        const exportControls = document.getElementById('exportControls');
        if (exportControls) {
            exportControls.style.display = 'block';
        }
    }

    hideExportControls() {
        const exportControls = document.getElementById('exportControls');
        if (exportControls) {
            exportControls.style.display = 'none';
        }
    }

    showExportStatus(type, message) {
        const exportStatus = document.getElementById('exportStatus');
        if (exportStatus) {
            exportStatus.textContent = message;
            exportStatus.className = `export-status ${type}`;
            exportStatus.style.display = 'block';
            
            // Auto-hide success messages after 3 seconds
            if (type === 'success') {
                setTimeout(() => {
                    exportStatus.style.display = 'none';
                }, 3000);
            }
        }
    }

    async exportRadarChart(format = 'png') {
        try {
            this.showExportStatus('processing', '🔄 Voorbereiden van export...');
            
            const svgElement = document.querySelector('#radarChartContainer svg');
            
            if (!svgElement) {
                throw new Error('Geen radar chart gevonden om te exporteren');
            }

            // Clone SVG to avoid modifying the original
            const svgClone = svgElement.cloneNode(true);
            
            // Add inline styles for proper export
            this.addInlineStyles(svgClone);
            
            // Generate filename
            const filename = this.generateFileName(format);
            
            if (format === 'svg') {
                await this.downloadSVG(svgClone, filename);
            } else if (format === 'png') {
                await this.convertSVGtoPNG(svgClone, filename);
            }
            
        } catch (error) {
            console.error('Export error:', error);
            this.showExportStatus('error', `❌ Export mislukt: ${error.message}`);
        }
    }

    addInlineStyles(svgElement) {
        // Add white background
        svgElement.style.backgroundColor = 'white';
        
        // Get computed styles and apply them inline
        const allElements = svgElement.querySelectorAll('*');
        
        allElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            
            // Apply important styling properties
            if (element.tagName === 'text') {
                element.style.fontFamily = computedStyle.fontFamily || 'Arial, sans-serif';
                element.style.fontSize = computedStyle.fontSize || '12px';
                element.style.fill = computedStyle.fill || '#333';
                element.style.textAnchor = element.getAttribute('text-anchor') || 'middle';
            }
            
            if (element.tagName === 'path') {
                element.style.fill = computedStyle.fill || 'none';
                element.style.stroke = computedStyle.stroke || '#333';
                element.style.strokeWidth = computedStyle.strokeWidth || '1px';
                element.style.fillOpacity = computedStyle.fillOpacity || '1';
                element.style.strokeOpacity = computedStyle.strokeOpacity || '1';
            }
            
            if (element.tagName === 'circle') {
                element.style.fill = computedStyle.fill || '#333';
                element.style.stroke = computedStyle.stroke || 'none';
                element.style.strokeWidth = computedStyle.strokeWidth || '0px';
            }
            
            if (element.tagName === 'line') {
                element.style.stroke = computedStyle.stroke || '#333';
                element.style.strokeWidth = computedStyle.strokeWidth || '1px';
                element.style.strokeOpacity = computedStyle.strokeOpacity || '1';
            }
        });
    }

    async downloadSVG(svgElement, filename) {
        this.showExportStatus('processing', '📄 Genereren van SVG bestand...');
        
        // Add XML declaration and DOCTYPE
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
            svgData
        ], { type: 'image/svg+xml;charset=utf-8' });
        
        this.downloadBlob(svgBlob, filename);
        this.showExportStatus('success', '✅ SVG bestand succesvol gedownload!');
    }

    async convertSVGtoPNG(svgElement, filename) {
        return new Promise((resolve, reject) => {
            try {
                this.showExportStatus('processing', '🖼️ Converteren naar PNG...');
                
                // Create canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Get SVG dimensions
                const svgRect = svgElement.getBoundingClientRect();
                const svgWidth = svgRect.width || 800;
                const svgHeight = svgRect.height || 600;
                
                // Set canvas size with padding
                const padding = 50;
                canvas.width = svgWidth + (padding * 2);
                canvas.height = svgHeight + (padding * 2);
                
                // Fill white background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Convert SVG to data URL
                const svgData = new XMLSerializer().serializeToString(svgElement);
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);
                
                // Create image and draw to canvas
                const img = new Image();
                
                img.onload = () => {
                    try {
                        // Draw image centered with padding
                        ctx.drawImage(img, padding, padding, svgWidth, svgHeight);
                        
                        // Convert canvas to blob and download
                        canvas.toBlob((blob) => {
                            if (blob) {
                                this.downloadBlob(blob, filename);
                                this.showExportStatus('success', '✅ PNG bestand succesvol gedownload!');
                                resolve();
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

    generateFileName(format) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        
        // Clean person name for filename
        const cleanPersonName = this.currentPersonName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        
        const personPart = cleanPersonName ? `_${cleanPersonName}` : '';
        
        return `feedback_radar_chart${personPart}_${dateStr}_${timeStr}.${format}`;
    }

    // Utility method to check if export is supported
    isExportSupported() {
        // Check for required browser features
        const hasCanvas = !!document.createElement('canvas').getContext;
        const hasBlob = typeof Blob !== 'undefined';
        const hasURL = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
        
        return hasCanvas && hasBlob && hasURL;
    }

    // Initialize export functionality when chart is ready
    initializeForChart(personName) {
        this.setCurrentPersonName(personName);
        
        if (this.isExportSupported()) {
            this.showExportControls();
        } else {
            console.warn('Export functionality not supported in this browser');
            this.showExportStatus('error', '❌ Export niet ondersteund in deze browser');
        }
    }
}

// Create global instance
window.chartExporter = new ChartExporter();