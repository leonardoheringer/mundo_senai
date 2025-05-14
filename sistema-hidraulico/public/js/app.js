document.addEventListener('DOMContentLoaded', function() {
    // Atualiza o sistema a cada 1 segundo
    setInterval(updateSystem, 1000);
});

function updateSystem() {
    fetch('/status')
        .then(response => response.json())
        .then(data => {
            // Atualiza caixa d'água
            document.querySelector('#caixa .water').style.height = data.caixa + '%';
            document.querySelector('#caixa .water-level').textContent = data.caixa + '%';
            
            // Atualiza reservatório
            document.querySelector('#reservatorio .water').style.height = data.reservatorio + '%';
            document.querySelector('#reservatorio .water-level').textContent = data.reservatorio + '%';
            
            // Atualiza sensores
            document.getElementById('sa').className = 'sensor ' + (data.sa ? 'on' : 'off');
            document.getElementById('sb').className = 'sensor ' + (data.sb ? 'on' : 'off');
            document.getElementById('sc').className = 'sensor ' + (data.sc ? 'on' : 'off');
            
            // Atualiza bomba
            const bomba = document.getElementById('bomba');
            bomba.className = 'pump ' + (data.bomba ? 'on' : 'off');
            bomba.querySelector('.pump-label').textContent = 'Bomba: ' + (data.bomba ? 'LIGADA' : 'DESLIGADA');
            
            // Atualiza torneira
            const torneira = document.getElementById('torneira');
            torneira.className = 'valve ' + (data.torneira ? 'on' : 'off');
            torneira.querySelector('.valve-label').textContent = 'Torneira: ' + (data.torneira ? 'ABERTA' : 'FECHADA');
            
            // Atualiza status dos sensores
            document.querySelectorAll('.sensor-status')[0].className = 'sensor-status ' + (data.sa ? 'on' : 'off');
            document.querySelectorAll('.sensor-status')[0].textContent = 'SA: ' + (data.sa ? 'ATIVADO' : 'DESATIVADO');
            
            document.querySelectorAll('.sensor-status')[1].className = 'sensor-status ' + (data.sb ? 'on' : 'off');
            document.querySelectorAll('.sensor-status')[1].textContent = 'SB: ' + (data.sb ? 'ATIVADO' : 'DESATIVADO');
            
            document.querySelectorAll('.sensor-status')[2].className = 'sensor-status ' + (data.sc ? 'on' : 'off');
            document.querySelectorAll('.sensor-status')[2].textContent = 'SC: ' + (data.sc ? 'ATIVADO' : 'DESATIVADO');
        })
        .catch(error => console.error('Erro ao atualizar sistema:', error));
}