class GerenciadorGraficos {
    constructor() {
        this.graficos = {};
        this.historico = {};
    }

    inicializarGrafico(maquina) {
        const ctx = document.getElementById(`chart-${maquina}`).getContext('2d');
        
        this.graficos[maquina] = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: { /* ... (opções do gráfico) ... */ }
        });
        
        this.historico[maquina] = {
            temperatura: [],
            pressao: [],
            labels: [],
            maxPontos: 15
        };
    }

    atualizarGrafico(maquina, dados) {
        if (!this.graficos[maquina]) {
            this.inicializarGrafico(maquina);
        }

        const historico = this.historico[maquina];
        
        // Adiciona novos dados
        historico.temperatura.push(dados.temperatura);
        historico.pressao.push(dados.pressao);
        historico.labels.push(new Date().toLocaleTimeString());

        // Remove dados antigos se exceder o máximo
        if (historico.temperatura.length > historico.maxPontos) {
            historico.temperatura.shift();
            historico.pressao.shift();
            historico.labels.shift();
        }

        // Atualiza o gráfico
        this.graficos[maquina].data = {
            labels: historico.labels,
            datasets: [
                { /* dataset temperatura */ },
                { /* dataset pressão */ }
            ]
        };
        
        this.graficos[maquina].update();
    }
}

// Uso:
const gerenciadorGraficos = new GerenciadorGraficos();

// No socket.on:
socket.on('dados-sensores', (dados) => {
    for (const maquina in dados) {
        gerenciadorGraficos.atualizarGrafico(maquina, dados[maquina]);
    }
});