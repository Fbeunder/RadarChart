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

            // Create a complete export SVG with title and legend
            const completeSvg = await this.createCompleteExportSvg(svgElement);
            
            // Generate filename
            const filename = this.generateFileName(format);
            
            if (format === 'svg') {
                await this.downloadSVG(completeSvg, filename);
            } else if (format === 'png') {
                await this.convertSVGtoPNG(completeSvg, filename);
            }
            
        } catch (error) {
            console.error('Export error:', error);
            this.showExportStatus('error', `❌ Export mislukt: ${error.message}`);
        }
    }

    async createCompleteExportSvg(originalSvg) {
        // Clone the original SVG
        const svgClone = originalSvg.cloneNode(true);
        
        // Get original dimensions
        const originalWidth = parseInt(svgClone.getAttribute('width')) || 800;
        const originalHeight = parseInt(svgClone.getAttribute('height')) || 600;
        
        // Calculate new dimensions with space for title and legend
        const titleHeight = 80;
        const legendHeight = 60;
        const padding = 40;
        
        const newWidth = originalWidth + (padding * 2);
        const newHeight = originalHeight + titleHeight + legendHeight + (padding * 2);
        
        // Create new SVG container
        const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        newSvg.setAttribute('width', newWidth);
        newSvg.setAttribute('height', newHeight);
        newSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        newSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        
        // Add white background
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', 'white');
        newSvg.appendChild(background);
        
        // Add title
        const titleGroup = this.createTitleElement(newWidth, titleHeight, padding);
        newSvg.appendChild(titleGroup);
        
        // Create container for the original chart
        const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        chartGroup.setAttribute('transform', `translate(${padding}, ${titleHeight + padding})`);
        
        // Copy all children from the cloned SVG to the chart group
        while (svgClone.firstChild) {
            chartGroup.appendChild(svgClone.firstChild);
        }
        
        newSvg.appendChild(chartGroup);
        
        // Add legend
        const legendGroup = this.createLegendElement(newWidth, originalHeight + titleHeight + padding + 20);
        newSvg.appendChild(legendGroup);
        
        // Apply inline styles for proper export
        this.addInlineStyles(newSvg);
        
        return newSvg;
    }

    createTitleElement(containerWidth, titleHeight, padding) {
        const titleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        titleGroup.setAttribute('class', 'export-title');
        
        // Main title
        const mainTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        mainTitle.setAttribute('x', containerWidth / 2);
        mainTitle.setAttribute('y', padding + 25);
        mainTitle.setAttribute('text-anchor', 'middle');
        mainTitle.setAttribute('font-family', 'Arial, sans-serif');
        mainTitle.setAttribute('font-size', '20px');
        mainTitle.setAttribute('font-weight', 'bold');
        mainTitle.setAttribute('fill', '#2c3e50');
        mainTitle.textContent = `Feedback Analyse voor ${this.currentPersonName}`;
        titleGroup.appendChild(mainTitle);
        
        // Subtitle
        const subtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        subtitle.setAttribute('x', containerWidth / 2);
        subtitle.setAttribute('y', padding + 50);
        subtitle.setAttribute('text-anchor', 'middle');
        subtitle.setAttribute('font-family', 'Arial, sans-serif');
        subtitle.setAttribute('font-size', '14px');
        subtitle.setAttribute('fill', '#7f8c8d');
        
        // Add current date
        const currentDate = new Date().toLocaleDateString('nl-NL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        subtitle.textContent = `Radar Chart Analyse - ${currentDate}`;
        titleGroup.appendChild(subtitle);
        
        return titleGroup;
    }

    createLegendElement(containerWidth, yPosition) {
        const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        legendGroup.setAttribute('class', 'export-legend');
        
        // Legend title
        const legendTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        legendTitle.setAttribute('x', containerWidth / 2);
        legendTitle.setAttribute('y', yPosition);
        legendTitle.setAttribute('text-anchor', 'middle');
        legendTitle.setAttribute('font-family', 'Arial, sans-serif');
        legendTitle.setAttribute('font-size', '14px');
        legendTitle.setAttribute('font-weight', 'bold');
        legendTitle.setAttribute('fill', '#2c3e50');
        legendTitle.textContent = 'Legenda:';
        legendGroup.appendChild(legendTitle);
        
        // Individual score legend item
        const individualGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        individualGroup.setAttribute('transform', `translate(${containerWidth / 2 - 120}, ${yPosition + 25})`);
        
        const individualRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        individualRect.setAttribute('width', '20');
        individualRect.setAttribute('height', '15');
        individualRect.setAttribute('fill', '#3498db');
        individualRect.setAttribute('rx', '3');
        individualGroup.appendChild(individualRect);
        
        const individualText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        individualText.setAttribute('x', '30');
        individualText.setAttribute('y', '12');
        individualText.setAttribute('font-family', 'Arial, sans-serif');
        individualText.setAttribute('font-size', '12px');
        individualText.setAttribute('fill', '#2c3e50');
        individualText.textContent = this.currentPersonName;
        individualGroup.appendChild(individualText);
        
        legendGroup.appendChild(individualGroup);
        
        // Team average legend item
        const teamGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        teamGroup.setAttribute('transform', `translate(${containerWidth / 2 + 20}, ${yPosition + 25})`);
        
        const teamRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        teamRect.setAttribute('width', '20');
        teamRect.setAttribute('height', '15');
        teamRect.setAttribute('fill', '#27ae60');
        teamRect.setAttribute('rx', '3');
        teamGroup.appendChild(teamRect);
        
        const teamText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        teamText.setAttribute('x', '30');
        teamText.setAttribute('y', '12');
        teamText.setAttribute('font-family', 'Arial, sans-serif');
        teamText.setAttribute('font-size', '12px');
        teamText.setAttribute('fill', '#2c3e50');
        teamText.textContent = 'Team Gemiddelde';
        teamGroup.appendChild(teamText);
        
        legendGroup.appendChild(teamGroup);
        
        return legendGroup;
    }

    addInlineStyles(svgElement) {
        // Add white background
        svgElement.style.backgroundColor = 'white';
        
        // Get all elements and apply computed styles inline
        const allElements = svgElement.querySelectorAll('*');
        
        allElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            
            // Apply styling based on element type and class
            if (element.tagName === 'text') {
                // Preserve text styling
                element.style.fontFamily = computedStyle.fontFamily || 'Arial, sans-serif';
                element.style.fontSize = computedStyle.fontSize || '12px';
                element.style.fontWeight = computedStyle.fontWeight || 'normal';
                element.style.fill = computedStyle.fill || '#333';
                element.style.textAnchor = element.getAttribute('text-anchor') || 'middle';
                element.style.dominantBaseline = element.getAttribute('dominant-baseline') || 'auto';
            }
            
            if (element.tagName === 'path') {
                // Preserve path styling - especially important for radar areas and strokes
                const fill = computedStyle.fill;
                const stroke = computedStyle.stroke;
                const fillOpacity = computedStyle.fillOpacity;
                const strokeOpacity = computedStyle.strokeOpacity;
                const strokeWidth = computedStyle.strokeWidth;
                
                // Only set if not 'none' or has actual values
                if (fill && fill !== 'none' && fill !== 'rgba(0, 0, 0, 0)') {
                    element.style.fill = fill;
                }
                if (stroke && stroke !== 'none' && stroke !== 'rgba(0, 0, 0, 0)') {
                    element.style.stroke = stroke;
                }
                if (fillOpacity && fillOpacity !== '1') {
                    element.style.fillOpacity = fillOpacity;
                }
                if (strokeOpacity && strokeOpacity !== '1') {
                    element.style.strokeOpacity = strokeOpacity;
                }
                if (strokeWidth && strokeWidth !== '0px') {
                    element.style.strokeWidth = strokeWidth;
                }
                
                // Preserve class-based styling for radar areas
                if (element.classList.contains('radarArea')) {
                    // Ensure radar area colors are preserved
                    if (!element.style.fill || element.style.fill === 'none') {
                        element.style.fill = fill || '#3498db';
                    }
                    if (!element.style.fillOpacity) {
                        element.style.fillOpacity = fillOpacity || '0.35';
                    }
                }
                
                if (element.classList.contains('radarStroke')) {
                    // Ensure radar stroke colors are preserved
                    if (!element.style.stroke || element.style.stroke === 'none') {
                        element.style.stroke = stroke || '#3498db';
                    }
                    if (!element.style.strokeWidth) {
                        element.style.strokeWidth = strokeWidth || '2px';
                    }
                    element.style.fill = 'none';
                }
            }
            
            if (element.tagName === 'circle') {
                // Preserve circle styling - important for radar dots and grid circles
                const fill = computedStyle.fill;
                const stroke = computedStyle.stroke;
                const fillOpacity = computedStyle.fillOpacity;
                const strokeWidth = computedStyle.strokeWidth;
                
                if (fill && fill !== 'none' && fill !== 'rgba(0, 0, 0, 0)') {
                    element.style.fill = fill;
                }
                if (stroke && stroke !== 'none' && stroke !== 'rgba(0, 0, 0, 0)') {
                    element.style.stroke = stroke;
                }
                if (fillOpacity && fillOpacity !== '1') {
                    element.style.fillOpacity = fillOpacity;
                }
                if (strokeWidth && strokeWidth !== '0px') {
                    element.style.strokeWidth = strokeWidth;
                }
                
                // Special handling for radar circles (dots)
                if (element.classList.contains('radarCircle')) {
                    if (!element.style.fill || element.style.fill === 'none') {
                        element.style.fill = fill || '#3498db';
                    }
                    if (!element.style.fillOpacity) {
                        element.style.fillOpacity = fillOpacity || '0.8';
                    }
                }
                
                // Special handling for grid circles
                if (element.classList.contains('gridCircle')) {
                    element.style.fill = '#CDCDCD';
                    element.style.stroke = '#CDCDCD';
                    element.style.fillOpacity = '0.1';
                }
            }
            
            if (element.tagName === 'line') {
                // Preserve line styling
                const stroke = computedStyle.stroke;
                const strokeWidth = computedStyle.strokeWidth;
                const strokeOpacity = computedStyle.strokeOpacity;
                
                if (stroke && stroke !== 'none' && stroke !== 'rgba(0, 0, 0, 0)') {
                    element.style.stroke = stroke;
                }
                if (strokeWidth && strokeWidth !== '0px') {
                    element.style.strokeWidth = strokeWidth;
                }
                if (strokeOpacity && strokeOpacity !== '1') {
                    element.style.strokeOpacity = strokeOpacity;
                }
                
                // Special handling for axis lines
                if (element.classList.contains('line')) {
                    element.style.stroke = 'white';
                    element.style.strokeWidth = '2px';
                }
            }

            if (element.tagName === 'rect') {
                // Handle rectangles (for legend items)
                const fill = computedStyle.fill;
                const stroke = computedStyle.stroke;
                
                if (fill && fill !== 'none' && fill !== 'rgba(0, 0, 0, 0)') {
                    element.style.fill = fill;
                }
                if (stroke && stroke !== 'none' && stroke !== 'rgba(0, 0, 0, 0)') {
                    element.style.stroke = stroke;
                }
            }
        });
        
        // Ensure proper namespace and attributes for SVG export
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        
        // Add CSS styles directly to SVG for better compatibility
        const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        styleElement.textContent = `
            .radar { font-family: Arial, sans-serif; }
            .axisLabel { font-size: 10px; fill: #737373; }
            .legend { font-size: 12px; font-weight: 500; fill: #2c3e50; text-anchor: middle; }
            .gridCircle { fill: #CDCDCD; stroke: #CDCDCD; fill-opacity: 0.1; }
            .line { stroke: white; stroke-width: 2px; }
            .export-title text { font-family: Arial, sans-serif; }
            .export-legend text { font-family: Arial, sans-serif; }
            .export-legend rect { rx: 3; }
        `;
        svgElement.insertBefore(styleElement, svgElement.firstChild);
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