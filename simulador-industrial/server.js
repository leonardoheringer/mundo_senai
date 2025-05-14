const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
// Adicione no início do script
const graficos = {}; // Objeto para armazenar as instâncias dos gráficos

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuração
const PORT = 3000;
const MAQUINAS = ['M-1001', 'M-1002', 'M-1003', 'M-1004'];

// Middleware para arquivos estáticos
app.use(express.static('public'));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Simulação de dados industriais
function gerarDadosSensor(maquina) {
  const baseTemp = 30 + Math.random() * 20 - 5;
  const pressaoBase = 1.0 + (Math.random() * 2);
  
  return {
    maquina,
    temperatura: baseTemp + (Math.sin(Date.now()/10000) * 5),
    pressao: pressaoBase,
    vibracao: Math.floor(Math.random() * 10) + 1,
    timestamp: new Date().toISOString(),
    produtos_processados: Math.floor(Math.random() * 16) + 5
  };
}

// Envia dados para todos os clientes conectados
function enviarDados() {
  const dados = {};
  MAQUINAS.forEach(maquina => {
    dados[maquina] = gerarDadosSensor(maquina);
  });
  io.emit('dados-sensores', dados);
}

// Controle de ações
io.on('connection', (socket) => {
  console.log('Novo cliente conectado');
  
  socket.on('acao-controle', (data) => {
    const log = `${new Date().toISOString()} - Máquina ${data.maquina} - Ação: ${data.acao}\n`;
    fs.appendFileSync('controle.log', log);
    console.log(`Ação registrada: ${log.trim()}`);
  });
});

// Inicia o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  
  // Atualiza dados a cada 2 segundos
  setInterval(enviarDados, 2000);
  enviarDados(); // Envia imediatamente ao iniciar
});
function gerarDadosSensor(maquina) {
    // Padrões diferentes para cada máquina
    const padroes = {
      'M-1001': { baseTemp: 32, tempVariation: 8, basePressao: 1.2 },
      'M-1002': { baseTemp: 35, tempVariation: 10, basePressao: 1.5 },
      'M-1003': { baseTemp: 30, tempVariation: 6, basePressao: 1.8 },
      'M-1004': { baseTemp: 38, tempVariation: 12, basePressao: 2.0 }
    };
    
    const padrao = padroes[maquina] || { baseTemp: 30, tempVariation: 8, basePressao: 1.5 };
    
    const ciclo = Date.now() / 10000;
    const tempVariation = Math.sin(ciclo) * padrao.tempVariation;
    const pressaoVariation = Math.cos(ciclo * 0.7) * 0.8;
    
    // 5% de chance de gerar um valor anormal
    const anomalia = Math.random() < 0.05;
    
    return {
      maquina,
      temperatura: anomalia 
        ? padrao.baseTemp + 15 + Math.random() * 10 
        : padrao.baseTemp + tempVariation + (Math.random() * 2 - 1),
      pressao: anomalia
        ? padrao.basePressao + 1.5 + Math.random() 
        : padrao.basePressao + pressaoVariation + (Math.random() * 0.2 - 0.1),
      vibracao: Math.floor(Math.random() * 3) + (anomalia ? 7 : 0),
      timestamp: new Date().toISOString(),
      produtos_processados: Math.floor(Math.random() * 5) + 10
    };
  }