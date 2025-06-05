const socket = io();
let simulationSpeed = 2000;
let isPaused = false;

// Atualiza a interface
socket.on('update', (data) => {
    if (isPaused) return;
    
    // Reservatório
    updateTank('reservoir', data.reservoir, 2000);
    document.getElementById('tap-status').textContent = `Torneira: ${data.tapOpen ? 'Aberta' : 'Fechada'}`;
    document.getElementById('tap-status').className = `valve-status ${data.tapOpen ? '' : 'valve-closed'}`;
    
    // Caixa d'Água
    updateTank('tank', data.waterTank, 500);
    const pumpStatus = document.getElementById('pump-status');
    
    if (data.pumpOn) {
        pumpStatus.textContent = 'Bomba: Ligada';
        pumpStatus.className = 'pump-status pump-on';
    } else if (data.draining) {
        pumpStatus.textContent = 'Bomba: Esvaziando';
        pumpStatus.className = 'pump-status draining';
    } else {
        pumpStatus.textContent = 'Bomba: Desligada';
        pumpStatus.className = 'pump-status';
    }
    
    // Animação da bomba
    document.querySelector('.pump-icon').style.color = data.pumpOn ? '#f39c12' : '#95a5a6';
});

function updateTank(prefix, current, max) {
    document.getElementById(`${prefix}-level`).textContent = current;
    document.getElementById(`${prefix}-percent`).textContent = Math.round((current / max) * 100);
    document.getElementById(`${prefix}-water`).style.height = `${(current / max) * 100}%`;
}

// Controles
document.getElementById('speed-btn').addEventListener('click', () => {
    simulationSpeed = simulationSpeed === 2000 ? 500 : 2000;
    document.getElementById('speed-btn').innerHTML = 
        `⏩ Velocidade: ${simulationSpeed === 2000 ? 'Normal' : 'Rápida'}`;
    socket.emit('change-speed', simulationSpeed);
});

document.getElementById('pause-btn').addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('pause-btn').innerHTML = 
        isPaused ? '▶️ Retomar' : '⏸️ Pausar';
    socket.emit('pause', isPaused);
});