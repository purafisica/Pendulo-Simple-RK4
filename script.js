// Inicializar constantes por defecto
let g = 9.81;  // Aceleración debido a la gravedad (m/s^2)
let chart;  // Variable para almacenar el gráfico
let simulationData = [];  // Variable para almacenar los datos simulados

// Función que representa la derivada de theta (velocidad angular)
function dTheta(omega) {
    return omega;
}

// Función que representa la derivada de omega (aceleración angular)
function dOmega(theta, L) {
    return -(g / L) * Math.sin(theta);
}

// Método de Runge-Kutta de cuarto orden
function rungeKuttaStep(theta, omega, dt, L) {
    let k1_theta = dt * dTheta(omega);
    let k1_omega = dt * dOmega(theta, L);

    let k2_theta = dt * dTheta(omega + 0.5 * k1_omega);
    let k2_omega = dt * dOmega(theta + 0.5 * k1_theta, L);

    let k3_theta = dt * dTheta(omega + 0.5 * k2_omega);
    let k3_omega = dt * dOmega(theta + 0.5 * k2_theta, L);

    let k4_theta = dt * dTheta(omega + k3_omega);
    let k4_omega = dt * dOmega(theta + k3_theta, L);

    let newTheta = theta + (1 / 6) * (k1_theta + 2 * k2_theta + 2 * k3_theta + k4_theta);
    let newOmega = omega + (1 / 6) * (k1_omega + 2 * k2_omega + 2 * k3_omega + k4_omega);

    return { newTheta, newOmega };
}

// Simulación
function simulatePendulum(steps, theta, L, dt) {
    let results = [];
    let omega = 0;  // Velocidad angular inicial
    let t = 0;  // Tiempo inicial

    for (let i = 0; i < steps; i++) {
        let { newTheta, newOmega } = rungeKuttaStep(theta, omega, dt, L);
        theta = newTheta;
        omega = newOmega;
        t += dt;
        results.push({ t, theta, omega });
    }
    return results;
}

// Función para calcular la amplitud y frecuencia angular
function calculatePendulumParameters(theta0, L) {
    let amplitude = theta0;  // Amplitud (en radianes)
    let omega = Math.sqrt(g / L);  // Frecuencia angular
    let period = 2 * Math.PI / omega;  // Período de oscilación
    return { amplitude, omega, period };
}

// Función para crear o actualizar el gráfico
function createChart(simulationData) {
    const ctx = document.getElementById('pendulumChart').getContext('2d');
    let timeData = simulationData.map(data => data.t.toFixed(2));
    let angleData = simulationData.map(data => data.theta.toFixed(4));
    let velocityData = simulationData.map(data => data.omega.toFixed(4));

    // Si el gráfico ya existe, actualizarlo
    if (chart) {
        chart.data.labels = timeData;
        chart.data.datasets[0].data = angleData;
        chart.data.datasets[1].data = velocityData;
        chart.update();
    } else {
        // Crear gráfico con Chart.js
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeData,
                datasets: [
                    {
                        label: 'Ángulo (rad)',
                        data: angleData,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        fill: false,
                        pointRadius: 1,  // Tamaño de los puntos en la línea
                        pointHoverRadius: 3  // Tamaño de los puntos cuando el cursor pasa sobre ellos
                    },
                    {
                        label: 'Velocidad Angular (rad/s)',
                        data: velocityData,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        fill: false,
                        pointRadius: 1,  // Tamaño de los puntos en la línea
                        pointHoverRadius: 3  // Tamaño de los puntos cuando el cursor pasa sobre ellos
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Movimiento del Péndulo Simple'
                    }
                }
            }
        });
    }
}

// Función para descargar los datos como CSV
function downloadCSV(data) {
    let csv = 'Tiempo (s),Ángulo (rad),Velocidad Angular (rad/s)\n';
    data.forEach(row => {
        csv += `${row.t.toFixed(2)},${row.theta.toFixed(4)},${row.omega.toFixed(4)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'simulacion_pendulo.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Manejo del evento de envío del formulario
document.getElementById('sim-form').addEventListener('submit', function (event) {
    event.preventDefault();

    let theta0 = parseFloat(document.getElementById('theta').value);
    let L = parseFloat(document.getElementById('length').value);
    let dt = parseFloat(document.getElementById('dt').value);
    let steps = parseInt(document.getElementById('steps').value);  // Obtener el número de pasos

    // Validación
    if (theta0 < 0 || isNaN(theta0)) {
        document.getElementById('thetaError').textContent = 'Por favor, ingrese un valor válido para el ángulo.';
        return;
    }
    if (L <= 0 || isNaN(L)) {
        document.getElementById('lengthError').textContent = 'Por favor, ingrese una longitud positiva.';
        return;
    }
    if (steps <= 0 || isNaN(steps)) {
        document.getElementById('stepsError').textContent = 'Por favor, ingrese un número válido de pasos.';
        return;
    }

    // Convertir ángulo a radianes
    theta0 = theta0 * Math.PI / 180;  // Convertir grados a radianes

    // Calcular la amplitud y la frecuencia
    let { amplitude, omega } = calculatePendulumParameters(theta0, L);

    // Mostrar los resultados
    document.getElementById('amplitude').textContent = `Amplitud: ${amplitude.toFixed(4)} rad`;
    document.getElementById('frequency').textContent = `Frecuencia angular: ${omega.toFixed(4)} rad/s`;
    document.getElementById('solution').textContent = `Ecuación solución: θ(t) = ${amplitude.toFixed(4)} rad . cos(${omega.toFixed(4)} rad/s . t)`;

    // Ejecutar la simulación
    simulationData = simulatePendulum(steps, theta0, L, dt);

    // Crear el gráfico
    createChart(simulationData);
});

// Reiniciar la simulación
document.getElementById('reset-btn').addEventListener('click', function () {
    if (chart) {
        chart.destroy();
        chart = null;
    }
    document.getElementById('amplitude').textContent = 'Amplitud: -';
    document.getElementById('frequency').textContent = 'Frecuencia angular: -';
    document.getElementById('solution').textContent = 'Ecuación solución: -';
});

// Descargar datos como CSV
document.getElementById('download-btn').addEventListener('click', function () {
    if (simulationData.length > 0) {
        downloadCSV(simulationData);
    } else {
        alert('No hay datos para descargar. Realiza la simulación primero.');
    }
});
