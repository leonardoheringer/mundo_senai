const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

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
let totalProdutos = 0;
let historicoCompleto = {};

// Inicializar histórico
for (const maquina of MAQUINAS) {
  historicoCompleto[maquina] = [];
}

// Middleware para arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para exportação de dados
app.get('/exportar', async (req, res) => {
  const { maquinas, formato, dataInicial, dataFinal } = req.query;
  
  try {
    let maquinasExportar = maquinas === 'Todas' ? MAQUINAS : maquinas.split(',');
    
    // Filtrar dados pelo período (simplificado para demonstração)
    const dadosFiltrados = {};
    for (const maquina of maquinasExportar) {
      if (historicoCompleto[maquina]) {
        dadosFiltrados[maquina] = historicoCompleto[maquina]
          .filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return (!dataInicial || entryDate >= new Date(dataInicial)) && 
                   (!dataFinal || entryDate <= new Date(dataFinal));
          });
      }
    }
    
    // Gerar arquivo conforme o formato solicitado
    if (formato === 'csv') {
      let csvContent = 'maquina,temperatura,pressao,vibracao,produtos,timestamp,status\n';
      
      for (const maquina in dadosFiltrados) {
        for (const entry of dadosFiltrados[maquina]) {
          csvContent += `${maquina},${entry.temperatura},${entry.pressao},${entry.vibracao},${entry.produtos_processados},${entry.timestamp},${entry.status}\n`;
        }
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=dados-producao.csv');
      return res.send(csvContent);
      
    } else if (formato === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=dados-producao.json');
      return res.send(JSON.stringify(dadosFiltrados, null, 2));
      
    } else if (formato === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Dados de Produção');
      
      // Cabeçalhos
      worksheet.columns = [
        { header: 'Máquina', key: 'maquina' },
        { header: 'Temperatura (°C)', key: 'temperatura' },
        { header: 'Pressão (bar)', key: 'pressao' },
        { header: 'Vibração (/10)', key: 'vibracao' },
        { header: 'Produtos (unid.)', key: 'produtos' },
        { header: 'Data/Hora', key: 'timestamp' },
        { header: 'Status', key: 'status' }
      ];
      
      // Dados
      for (const maquina in dadosFiltrados) {
        for (const entry of dadosFiltrados[maquina]) {
          worksheet.addRow({
            maquina,
            temperatura: entry.temperatura,
            pressao: entry.pressao,
            vibracao: entry.vibracao,
            produtos: entry.produtos_processados,
            timestamp: entry.timestamp,
            status: entry.status
          });
        }
      }
      
      // Configurar resposta
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=dados-producao.xlsx');
      
      await workbook.xlsx.write(res);
      return res.end();
      
    } else {
      return res.status(400).send('Formato inválido');
    }
    
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return res.status(500).send('Erro ao exportar dados');
  }
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
  
  const dados = {
    maquina,
    temperatura: parseFloat(temperatura.toFixed(1)),
    pressao: parseFloat(pressao.toFixed(2)),
    vibracao: Math.floor(vibracao),
    timestamp: new Date().toISOString(),
    produtos_processados: produtos,
    status: falhaCritica ? 'FALHA' : alerta ? 'ALERTA' : 'NORMAL',
    etapa: etapaProducao
  };
  
  // Armazenar no histórico completo
  historicoCompleto[maquina].push(dados);
  
  // Manter apenas os últimos 1000 registros por máquina
  if (historicoCompleto[maquina].length > 1000) {
    historicoCompleto[maquina].shift();
  }
  
  return dados;
}

// Controle de ações e emergência
io.on('connection', (socket) => {
  console.log('Novo cliente conectado');
  
  socket.on('acao-controle', (data) => {
    const log = `${new Date().toISOString()} - Máquina ${data.maquina} - Ação: ${data.acao}\n`;
    fs.appendFileSync('controle.log', log);
    console.log(`Ação registrada: ${log.trim()}`);
    
    // Notificar todos os clientes
    io.emit('notificacao', {
      titulo: `Controle Manual - ${data.maquina}`,
      mensagem: `Ação realizada: ${data.acao}`,
      icone: 'fa-hand-paper'
    });
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
  
  // Requisição de exportação de dados
  socket.on('exportar-dados', async (data, callback) => {
    try {
      const { maquinas, formato, dataInicial, dataFinal } = data;
      
      let maquinasExportar = maquinas === 'Todas' ? MAQUINAS : maquinas;
      
      // Filtrar dados pelo período
      const dadosFiltrados = {};
      for (const maquina of maquinasExportar) {
        if (historicoCompleto[maquina]) {
          dadosFiltrados[maquina] = historicoCompleto[maquina]
            .filter(entry => {
              const entryDate = new Date(entry.timestamp);
              return (!dataInicial || entryDate >= new Date(dataInicial)) && 
                     (!dataFinal || entryDate <= new Date(dataFinal));
            });
        }
      }
      
      callback({ success: true, dados: dadosFiltrados });
      
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      callback({ success: false, error: 'Erro ao exportar dados' });
    }
  });
});

// Simulação do fluxo de produção
function simularFluxoProducao() {
  const etapas = ['Fusão', 'Vazamento', 'Laminação', 'Resfriamento'];
  const etapaIndex = etapas.indexOf(etapaProducao);
  const etapaAnterior = etapaProducao;
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
  
  // Incrementar produção total
  totalProdutos += 10 + Math.floor(Math.random() * 5);
  
  io.emit('etapa-producao', {
    etapa: etapaProducao,
    etapaAnterior,
    consumoEnergia: consumoEnergia,
    tempoCiclo: etapaIndex * 2 + 5,
    totalProdutos: totalProdutos
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