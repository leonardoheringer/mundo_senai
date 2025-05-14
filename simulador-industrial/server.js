const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuração
const PORT = 3000;
const MAQUINAS = [
  'Forno de Arco Elétrico', 
  'Lingoteira Contínua',
  'Laminação a Quente',
  'Resfriamento Rápido'
];

// Variáveis de estado
let emergenciaAtiva = false;
let etapaProducao = 'Fusão';
let consumoEnergia = 0;

// Middleware para arquivos estáticos
app.use(express.static('public'));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Simulação de dados industriais para produção de aço
function gerarDadosSensor(maquina) {
  const padroes = {
    'Forno de Arco Elétrico': { 
      baseTemp: 1500, tempVariation: 100, 
      basePressao: 1.8, vibracaoBase: 4,
      produtosBase: 2
    },
    'Lingoteira Contínua': { 
      baseTemp: 1200, tempVariation: 50, 
      basePressao: 2.2, vibracaoBase: 6,
      produtosBase: 3
    },
    'Laminação a Quente': { 
      baseTemp: 800, tempVariation: 40, 
      basePressao: 1.5, vibracaoBase: 8,
      produtosBase: 5
    },
    'Resfriamento Rápido': { 
      baseTemp: 200, tempVariation: 20, 
      basePressao: 1.0, vibracaoBase: 3,
      produtosBase: 2
    }
  };
  
  const padrao = padroes[maquina];
  const ciclo = Date.now() / 10000;
  
  // 5% de chance de falha crítica
  const falhaCritica = !emergenciaAtiva && Math.random() < 0.05;
  // 10% de chance de alerta
  const alerta = !falhaCritica && Math.random() < 0.1;
  
  // Cálculo de valores base
  let temperatura = padrao.baseTemp + (Math.sin(ciclo) * padrao.tempVariation);
  let pressao = padrao.basePressao + (Math.cos(ciclo * 0.7)) * 0.5;
  let vibracao = padrao.vibracaoBase + Math.random() * 2;
  
  // Ajustes para falhas
  if (falhaCritica) {
    temperatura += 300 + Math.random() * 200;
    pressao += 1.5 + Math.random();
    vibracao += 5 + Math.random() * 3;
  } else if (alerta) {
    temperatura += 100 + Math.random() * 50;
    pressao += 0.5 + Math.random() * 0.3;
    vibracao += 2 + Math.random();
  }
  
  // Ajuste de produção baseado na etapa
  let produtos = padrao.produtosBase;
  if (etapaProducao === 'Laminação') {
    produtos += 2;
  }
  
  return {
    maquina,
    temperatura: parseFloat(temperatura.toFixed(1)),
    pressao: parseFloat(pressao.toFixed(2)),
    vibracao: Math.floor(vibracao),
    timestamp: new Date().toISOString(),
    produtos_processados: produtos,
    status: falhaCritica ? 'FALHA' : alerta ? 'ALERTA' : 'NORMAL',
    etapa: etapaProducao
  };
}

// Controle de ações e emergência
io.on('connection', (socket) => {
  console.log('Novo cliente conectado');
  
  socket.on('acao-controle', (data) => {
    const log = `${new Date().toISOString()} - Máquina ${data.maquina} - Ação: ${data.acao}\n`;
    fs.appendFileSync('controle.log', log);
    console.log(`Ação registrada: ${log.trim()}`);
  });
  
  socket.on('ativar-emergencia', () => {
    if (!emergenciaAtiva) {
      emergenciaAtiva = true;
      console.log('EMERGÊNCIA ATIVADA - PARANDO TODAS AS MÁQUINAS');
      io.emit('sistema-parado', { 
        motivo: 'emergencia', 
        timestamp: new Date().toISOString() 
      });
      
      // Simula tempo de parada
      setTimeout(() => {
        emergenciaAtiva = false;
        io.emit('sistema-reiniciando');
        console.log('Sistema reiniciando após emergência');
      }, 10000);
    }
  });
});

// Simulação do fluxo de produção
function simularFluxoProducao() {
  const etapas = ['Fusão', 'Vazamento', 'Laminação', 'Resfriamento'];
  const etapaIndex = etapas.indexOf(etapaProducao);
  etapaProducao = etapas[(etapaIndex + 1) % etapas.length];
  
  // Atualiza consumo de energia baseado na etapa
  switch(etapaProducao) {
    case 'Fusão':
      consumoEnergia += 150;
      break;
    case 'Laminação':
      consumoEnergia += 80;
      break;
    default:
      consumoEnergia += 30;
  }
  
  io.emit('etapa-producao', {
    etapa: etapaProducao,
    consumoEnergia: consumoEnergia,
    tempoCiclo: etapaIndex * 2 + 5
  });
}

// Envia dados para todos os clientes conectados
function enviarDados() {
  if (emergenciaAtiva) return;
  
  const dados = {};
  MAQUINAS.forEach(maquina => {
    dados[maquina] = gerarDadosSensor(maquina);
  });
  io.emit('dados-sensores', dados);
}

// Inicia o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  
  // Atualiza dados a cada 2 segundos
  setInterval(enviarDados, 2000);
  enviarDados(); // Envia imediatamente ao iniciar
  
  // Simula mudança de etapas a cada 15 segundos
  setInterval(simularFluxoProducao, 15000);
});