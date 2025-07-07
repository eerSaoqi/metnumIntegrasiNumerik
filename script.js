document.getElementById('calculate').addEventListener('click', function() {
    // Reset error message
    document.getElementById('error-message').style.display = 'none';
    
    // Get input values
    const funcStr = document.getElementById('function').value;
    const method = document.getElementById('method').value;
    const a = parseFloat(document.getElementById('a').value);
    const b = parseFloat(document.getElementById('b').value);
    const h = parseFloat(document.getElementById('h').value);
    
    // Validate inputs
    if (isNaN(a) || isNaN(b) || isNaN(h)) {
        showError("Masukkan nilai yang valid untuk batas dan panjang pias.");
        return;
    }
    
    if (h <= 0) {
        showError("Panjang pias (h) harus lebih besar dari 0.");
        return;
    }
    
    if (b <= a) {
        showError("Batas atas (b) harus lebih besar dari batas bawah (a).");
        return;
    }
    
    try {
        // Calculate
        const n = Math.ceil((b - a) / h);
        const adjustedH = (b - a) / n; // Adjust h to fit exactly into interval
        
        let result;
        if (method === 'rectangle') {
            result = calculateRectangleMethod(funcStr, a, b, adjustedH, n);
        } else {
            result = calculateMidpointMethod(funcStr, a, b, adjustedH, n);
        }
        
        // Display results
        displayResults(result, method, funcStr, a, b, adjustedH);
    } catch (e) {
        showError("Error dalam evaluasi fungsi: " + e.message);
    }
});

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    document.getElementById('result-section').style.display = 'none';
    document.getElementById('chart-container').style.display = 'none';
}

function calculateRectangleMethod(funcStr, a, b, h, n) {
    const result = {
        method: 'Kaidah Segiempat',
        description: 'Metode ini mengaproksimasi integral sebagai jumlah luas persegi panjang dengan tinggi sesuai nilai fungsi di ujung interval.',
        table: [],
        integral: 0,
        formula: '∑(f(xi) * h) dengan f(xi) dikali 1 untuk ujung interval dan 2 untuk titik tengah',
        points: []
    };
    
    let sum = 0;
    
    for (let i = 0; i <= n; i++) {
        const xi = a + i * h;
        const fxi = evaluateFunction(funcStr, xi);
        let term;
        
        if (i === 0 || i === n) {
            term = fxi;
        } else {
            term = 2 * fxi;
        }
        
        sum += term;
        
        result.table.push({
            n: i,
            xi: xi,
            fxi: fxi,
            term: term
        });
        
        // Store points for chart
        if (i < n) {
            result.points.push({
                x1: xi,
                x2: xi + h,
                y: fxi
            });
        }
    }
    
    result.integral = (h / 2) * sum;
    return result;
}

function calculateMidpointMethod(funcStr, a, b, h, n) {
    const result = {
        method: 'Kaidah Titik Tengah',
        description: 'Metode ini mengaproksimasi integral sebagai jumlah luas persegi panjang dengan tinggi sesuai nilai fungsi di titik tengah interval.',
        table: [],
        integral: 0,
        formula: '∑(f(xi + h/2) * h)',
        points: []
    };
    
    let sum = 0;
    
    for (let i = 0; i < n; i++) {
        const xi = a + i * h;
        const xiNext = a + (i + 1) * h;
        const xiMid = (xi + xiNext) / 2;
        const fxiMid = evaluateFunction(funcStr, xiMid);
        
        sum += fxiMid;
        
        result.table.push({
            n: i + 1,
            xi: xi,
            xiMid: xiMid,
            fxiMid: fxiMid
        });
        
        // Store points for chart
        result.points.push({
            x1: xi,
            x2: xiNext,
            y: fxiMid
        });
    }
    
    result.integral = h * sum;
    return result;
}

function evaluateFunction(funcStr, x) {
    // Replace ^ with ** for exponentiation
    const expr = funcStr.replace(/\^/g, '**');
    
    // Create a safe evaluation function
    const evaluate = new Function('x', `
        try {
            return ${expr};
        } catch (e) {
            throw new Error('Tidak dapat mengevaluasi fungsi pada x = ' + x + ': ' + e.message);
        }
    `);
    
    return evaluate(x);
}
function calculateExactIntegral(funcStr, a, b) {
    try {
        // Untuk fungsi polinomial sederhana
        const processedFunc = funcStr
            .replace(/\^/g, '**')  // Ubah ^ menjadi **
            .replace(/\s+/g, '');  // Hapus spasi
        
        // Coba parsing fungsi
        if (processedFunc.includes('x')) {
            // Jika mengandung x, coba hitung integral analitik
            if (processedFunc === 'x') {
                return (b**2 - a**2)/2;
            } else if (processedFunc === 'x**2') {
                return (b**3 - a**3)/3;
            } else if (processedFunc === 'x**3') {
                return (b**4 - a**4)/4;
            } else if (processedFunc === 'Math.sin(x)') {
                return -Math.cos(b) + Math.cos(a);
            } else if (processedFunc === 'Math.cos(x)') {
                return Math.sin(b) - Math.sin(a);
            } else if (processedFunc === 'Math.exp(x)') {
                return Math.exp(b) - Math.exp(a);
            } else {
                // Jika fungsi tidak dikenali, gunakan metode numerik sebagai fallback
                return calculateNumericalIntegral(funcStr, a, b);
            }
        } else {
            // Jika tidak mengandung x (konstanta)
            const c = evaluateFunction(funcStr, 0); // Evaluasi di titik mana saja
            return c * (b - a);
        }
    } catch (e) {
        console.error("Error in calculateExactIntegral:", e);
        return calculateNumericalIntegral(funcStr, a, b); // Fallback ke numerik
    }
}

function calculateNumericalIntegral(funcStr, a, b) {
    // Metode Simpson sebagai fallback
    const n = 1000; // Jumlah pias besar
    const h = (b - a)/n;
    let sum = evaluateFunction(funcStr, a) + evaluateFunction(funcStr, b);
    
    for (let i = 1; i < n; i++) {
        const x = a + i*h;
        const coeff = (i % 2 === 0) ? 2 : 4;
        sum += coeff * evaluateFunction(funcStr, x);
    }
    
    return sum * h / 3;
}

function displayResults(result, method, funcStr, a, b, h) {
    const resultSection = document.getElementById('result-section');
    const methodDescription = document.getElementById('method-description');
    const tableContainer = document.getElementById('table-container');
    const integralResult = document.getElementById('integral-result');
    const chartContainer = document.getElementById('chart-container');
    
    // Set method description
    methodDescription.innerHTML = `
        <h3>${result.method}</h3>
        <p>${result.description}</p>
        <p><strong>Rumus:</strong> ${result.formula}</p>
    `;
    
    // Create table based on method
    let tableHtml;
    if (method === 'rectangle') {
        tableHtml = `
            <table>
                <thead>
                    <tr>
                        <th>n</th>
                        <th>Xi</th>
                        <th>F(Xi)</th>
                        <th>Hasil</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        result.table.forEach(row => {
            tableHtml += `
                <tr>
                    <td>${row.n}</td>
                    <td>${row.xi.toFixed(4)}</td>
                    <td>${row.fxi.toFixed(6)}</td>
                    <td>${row.term.toFixed(6)}</td>
                </tr>
            `;
        });
        
        tableHtml += `
                <tr class="total-row">
                    <td colspan="3">Jumlah</td>
                    <td>${result.table.reduce((sum, row) => sum + row.term, 0).toFixed(6)}</td>
                </tr>
            </tbody>
            </table>
        `;
    } else {
        tableHtml = `
            <table>
                <thead>
                    <tr>
                        <th>n</th>
                        <th>Xi</th>
                        <th>Xi + h/2</th>
                        <th>F(Xi + h/2)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        result.table.forEach(row => {
            tableHtml += `
                <tr>
                    <td>${row.n}</td>
                    <td>${row.xi.toFixed(4)}</td>
                    <td>${row.xiMid.toFixed(4)}</td>
                    <td>${row.fxiMid.toFixed(6)}</td>
                </tr>
            `;
        });
        
        tableHtml += `
                <tr class="total-row">
                    <td colspan="3">Jumlah</td>
                    <td>${result.table.reduce((sum, row) => sum + row.fxiMid, 0).toFixed(6)}</td>
                </tr>
            </tbody>
            </table>
        `;
    }
    tableContainer.innerHTML = tableHtml;
    
    // Calculate exact integral and error
    const exactValue = calculateExactIntegral(funcStr, a, b);
    let errorInfo = '';
    
    if (exactValue !== null) {
        const absoluteError = Math.abs(result.integral - exactValue);
        const relativeError = (absoluteError / Math.abs(exactValue)) * 100;
        
        errorInfo = `
            <div class="error-info">
                <strong>Nilai Eksak:</strong> ${exactValue.toFixed(6)}<br>
                <strong>Galat Mutlak:</strong> ${absoluteError.toFixed(6)}<br>
                <strong>Galat Relatif:</strong> ${relativeError.toFixed(4)}%
            </div>
        `;
    } else {
        errorInfo = `<div class="error-info">Tidak dapat menghitung nilai eksak untuk fungsi ini</div>`;
    }
    
    // Set integral result with error info and function display
    integralResult.innerHTML = `
        <strong>∫${funcStr} dx ≈ ${result.integral.toFixed(6)}</strong><br>
        (dari ${a} sampai ${b})<br>
        ${errorInfo}
    `;
    
    // Show result section
    resultSection.style.display = 'block';
    
    // Draw chart (with function string in title)
    drawChart(result, funcStr, a, b, method);
}


function drawChart(result, funcStr, a, b, method) {
    const chartContainer = document.getElementById('chart-container');
    chartContainer.style.display = 'block';
    chartContainer.innerHTML = `
        <h4>Grafik Fungsi f(x) = ${funcStr}</h4>
        <canvas id="integralChart"></canvas>
    `;
    // Prepare data for the actual function
    const functionPoints = 200;
    const functionData = [];
    const step = (b - a) / functionPoints;
    
    for (let x = a; x <= b; x += step) {
        try {
            const y = evaluateFunction(funcStr, x);
            functionData.push({x, y});
        } catch (e) {
            console.error(`Error evaluating function at x=${x}:`, e);
        }
    }
    
    // Prepare data for the approximation rectangles
    const rectangleData = result.points.map(point => {
        return {
            x: point.x1,
            y: 0,
            width: point.x2 - point.x1,
            height: point.y,
            midX: (point.x1 + point.x2)/2  // Titik tengah untuk metode midpoint
        };
    });
    
    // Create chart
    const ctx = document.getElementById('integralChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Fungsi Asli',
                    data: functionData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    pointRadius: 0,
                    showLine: true,
                    fill: false
                },
                // Dataset untuk menampilkan titik-titik penting
                {
                    label: (method === 'rectangle' ? 'Titik Ujung' : 'Titik Tengah'),
                    data: rectangleData.map(rect => ({
                        x: method === 'rectangle' ? rect.x : rect.midX,
                        y: rect.height
                    })),
                    backgroundColor: method === 'rectangle' ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 1)',
                    pointRadius: 5,
                    showLine: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'center',
                    title: {
                        display: true,
                        text: 'x'
                    },
                    min: a,
                    max: b
                },
                y: {
                    title: {
                        display: true,
                        text: 'f(x)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `f(${context.parsed.x.toFixed(2)}) = ${context.parsed.y.toFixed(4)}`;
                            } else {
                                return `${method === 'rectangle' ? 'Titik ujung' : 'Titik tengah'}: f(${context.parsed.x.toFixed(2)}) = ${context.parsed.y.toFixed(4)}`;
                            }
                        }
                    }
                },
                legend: {
                    position: 'top',
                },
                annotation: {
                    annotations: []
                }
            },
            animation: {
                duration: 1000
            }
        }
    });
    
    // Tambahkan kotak untuk setiap pias
    rectangleData.forEach((rect, index) => {
        chart.options.plugins.annotation.annotations.push({
            type: 'box',
            xMin: rect.x,
            xMax: rect.x + rect.width,
            yMin: 0,
            yMax: rect.height,
            backgroundColor: method === 'rectangle' ? 
                'rgba(255, 99, 132, 0.2)' : 'rgba(54, 162, 235, 0.2)',
            borderColor: method === 'rectangle' ? 
                'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            label: {
                display: true,
                content: `Pias ${index+1}`,
                position: 'bottom',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                font: {
                    size: 10
                }
            }
        });
    });
    
    chart.update();
}