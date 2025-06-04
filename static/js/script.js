document.addEventListener('DOMContentLoaded', () => {
    const uploadInput = document.getElementById('excelUpload');
    const selector = document.getElementById('personSelector');

    uploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        selector.innerHTML = '';
        data.persons.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            selector.appendChild(opt);
        });
    });

    selector.addEventListener('change', async (e) => {
        const name = e.target.value;
        if (!name) return;

        const response = await fetch(`/get_scores/${encodeURIComponent(name)}`);
        const data = await response.json();
        drawRadarChart('#radarChartContainer', data);
    });
});
