let myChart = null;

async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const resultSection = document.getElementById('result-section');
    const container = document.getElementById('keyword-container');

    if (fileInput.files.length === 0) {
        alert("Please select a file.");
        return;
    }

    const formData = new FormData();
    formData.append('report', fileInput.files[0]);

    container.innerHTML = "Processing data...";
    resultSection.classList.remove('hidden');

    try {
        const response = await fetch('https://technova112.app.n8n.cloud/webhook/extract-report', {
            method: 'POST',
            body: formData
        });

        const responseText = await response.text();

        if (!response.ok) {
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch (jsonError) {
                throw new Error(responseText || `HTTP error! status: ${response.status}`);
            }
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (jsonError) {
            // If response is not JSON, treat it as raw text keywords
            processAndDisplay(responseText);
            return;
        }
        
        // Handle different response formats
        if (result.success) {
            processAndDisplay(result.keywords);
        } else if (result.data) {
            processAndDisplay(result.data);
        } else {
            processAndDisplay(responseText);
        }
    } catch (error) {
        console.error("Upload Error:", error);
        let errorMessage = "Connection failed.";
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes('HTTP error')) {
            errorMessage = `Server error: ${error.message}`;
        } else {
            errorMessage = `Error: ${error.message}`;
        }
        
        container.innerHTML = errorMessage;
    }
}

function processAndDisplay(text) {
    // 1. Clean and split keywords from AI output
    const keywords = text.split(/[,\n]/).map(k => k.trim()).filter(k => k.length > 0);
    
    // 2. Display Tags
    const container = document.getElementById('keyword-container');
    container.innerHTML = "";
    keywords.forEach(k => {
        const span = document.createElement('span');
        span.className = 'keyword-tag';
        span.innerText = k;
        container.appendChild(span);
    });

    // 3. Generate Chart Data (Simulating frequency for visualization)
    renderChart(keywords);
}

function renderChart(labels) {
    const ctx = document.getElementById('keywordChart').getContext('2d');
    
    // If chart already exists, destroy it before creating a new one
    if (myChart) { myChart.destroy(); }

    const mockData = labels.map(() => Math.floor(Math.random() * 10) + 1);

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Relevance Score',
                data: mockData,
                backgroundColor: '#1a1a1a',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });
}