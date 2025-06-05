const express = require('express');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});

const io = new Server(server);

// Estado do sistema
const systemState = {
    reservoir: 400,
    waterTank: 0,
    tapOpen: true,
    pumpOn: false,
    draining: false
};

// Controle de simulação
let simulationInterval;
let isPaused = false;

function updateSystem() {
    if (isPaused) return;

    // 1. Controle da torneira
    systemState.tapOpen = systemState.reservoir <= 400 || 
                         (systemState.reservoir < 2000 && !systemState.pumpOn);

    // 2. Controle da bomba
    systemState.pumpOn = systemState.reservoir >= 2000 && 
                        systemState.waterTank < 500 && 
                        !systemState.draining;

    // 3. Esvaziamento automático
    if (systemState.waterTank >= 500) {
        systemState.pumpOn = false;
        systemState.draining = true;
    }

    // 4. Processos de transferência
    if (systemState.tapOpen && systemState.reservoir < 2000) {
        systemState.reservoir += 10;
    }

    if (systemState.pumpOn && systemState.reservoir > 0) {
        const transfer = Math.min(10, systemState.reservoir, 500 - systemState.waterTank);
        systemState.reservoir -= transfer;
        systemState.waterTank += transfer;
    }

    if (systemState.draining && systemState.waterTank > 0) {
        systemState.waterTank = Math.max(0, systemState.waterTank - 5);
        if (systemState.waterTank === 0) {
            systemState.draining = false;
        }
    }

    io.emit('update', systemState);
}

// Inicia simulação
function startSimulation() {
    clearInterval(simulationInterval);
    simulationInterval = setInterval(updateSystem, 1000);
}
startSimulation();

// Configurações do Socket.IO
io.on('connection', (socket) => {
    socket.on('change-speed', (speed) => {
        clearInterval(simulationInterval);
        simulationInterval = setInterval(updateSystem, speed);
    });
    
    socket.on('pause', (paused) => {
        isPaused = paused;
    });
});

app.use(express.static(path.join(__dirname, 'public')));