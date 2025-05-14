const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Configurações
// Adicione estas linhas no início do arquivo após o require do express
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Estado do sistema
let systemState = {
    caixa: 50,
    reservatorio: 50,
    bomba: false,
    torneira: false,
    sa: false,
    sb: false,
    sc: false,
    erro: false
};

// Atualiza o estado do sistema
function updateSystem() {
    systemState.caixa = Math.max(0, Math.min(100, systemState.caixa - 2));
    
    // Lógica dos sensores
    if(systemState.reservatorio < 30) {
        systemState.sa = false;
        systemState.sb = false;
    } else if(systemState.reservatorio > 30 && systemState.reservatorio < 80) {
        systemState.sa = true;
        systemState.sb = false;
    } else if(systemState.reservatorio > 80) {
        systemState.sa = true;
        systemState.sb = true;
    }

    systemState.sc = systemState.caixa > 80;
    
    // Lógica da torneira
    systemState.torneira = !systemState.sa && !systemState.sb;
    
    // Lógica da bomba
    systemState.bomba = !systemState.sc;
    
    // Atualiza reservatório
    if(systemState.torneira) {
        systemState.reservatorio = Math.min(100, systemState.reservatorio + 4);
    }
    
    if(systemState.bomba) {
        systemState.reservatorio = Math.max(0, systemState.reservatorio - 3);
        systemState.caixa = Math.min(100, systemState.caixa + 3);
    }
}

// Rota principal
app.get('/', (req, res) => {
    updateSystem();
    res.render('index', { system: systemState });
});

// Rota para atualização via AJAX
app.get('/status', (req, res) => {
    updateSystem();
    res.json(systemState);
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});