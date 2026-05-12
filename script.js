
    const API_URL = 'https://backend-edugamify.onrender.com';

    let alunoAtualId = 1;
    let config = { pontosPresenca: 5, pontosTarefa: 10, pontosParticipacao: 10 };

    async function apiGet(url) {
      const res = await fetch(`${API_URL}${url}`);
      return res.json();
    }

    async function apiPost(url, data) {
      const res = await fetch(`${API_URL}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    }

    async function apiPut(url, data) {
      const res = await fetch(`${API_URL}${url}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    }

    async function apiDelete(url) {
      const res = await fetch(`${API_URL}${url}`, { method: 'DELETE' });
      return res.json();
    }

    function mostrarNotificacao(msg, tipo) {
      const notif = document.createElement('div');
      notif.className = 'notification';
      notif.innerHTML = msg;
      notif.style.borderLeftColor = tipo === 'success' ? '#4CAF50' : '#f44336';
      document.body.appendChild(notif);
      setTimeout(() => notif.remove(), 3000);
    }

    // ========== PROFESSOR ==========
    async function carregarAlunos() {
      const alunos = await apiGet('/api/alunos');
      const tbody = document.getElementById('listaAlunosBody');
      tbody.innerHTML = '';

      alunos.forEach(aluno => {
        const row = tbody.insertRow();
        row.insertCell(0).innerHTML = `<strong>${aluno.nome}</strong>`;
        row.insertCell(1).innerHTML = `<span style="font-size:20px;color:#ff9800">${aluno.pontos}</span>`;
        row.insertCell(2).innerHTML = `
                <button class="btn-success" onclick="adicionarPontos(${aluno.id}, ${config.pontosPresenca}, 'Presença')">✓ Presença</button>
                <button class="btn-success" onclick="adicionarPontos(${aluno.id}, ${config.pontosTarefa}, 'Tarefa')">📚 Tarefa</button>
                <button class="btn-success" onclick="adicionarPontos(${aluno.id}, ${config.pontosParticipacao}, 'Participação')">💬 Participação</button>
                <div class="ponto-form">
                    <input type="number" id="pts_${aluno.id}" value="5" style="width:60px">
                    <button class="btn-primary" onclick="pontosPersonalizados(${aluno.id})">+</button>
                </div>
            `;
      });

      const pontos = alunos.map(a => a.pontos);
      const media = pontos.reduce((a, b) => a + b, 0) / alunos.length || 0;
      const baixo = alunos.filter(a => a.pontos < 30).length;

      document.getElementById('estatisticasTurma').innerHTML = `
            <p>📊 Média: <strong>${media.toFixed(1)}</strong></p>
            <p>⚠️ Baixo engajamento: <strong>${baixo}</strong></p>
        `;
    }

    async function adicionarPontos(id, pontos, motivo) {
      await apiPut(`/api/alunos/${id}/pontos`, { pontos, motivo });
      await carregarAlunos();
      await carregarSolicitacoes();
      mostrarNotificacao(`+${pontos} pontos!`, 'success');
    }

    async function pontosPersonalizados(id) {
      const input = document.getElementById(`pts_${id}`);
      const pontos = parseInt(input.value);
      if (pontos) await adicionarPontos(id, pontos, 'Personalizado');
    }

    async function adicionarAluno() {
      const nome = document.getElementById('novoAlunoNome').value.trim();
      if (nome) {
        await apiPost('/api/alunos', { nome });
        document.getElementById('novoAlunoNome').value = '';
        await carregarAlunos();
        mostrarNotificacao(`Aluno ${nome} adicionado!`, 'success');
      }
    }

    async function resetarPontuacaoGeral() {
      if (confirm('Resetar todos os pontos?')) {
        await apiPost('/api/alunos/reset-all', {});
        await carregarAlunos();
        mostrarNotificacao('Pontuação resetada!', 'success');
      }
    }

    async function carregarRecompensasProfessor() {
      const recompensas = await apiGet('/api/recompensas');
      const container = document.getElementById('catalogoRecompensasProfessor');
      container.innerHTML = '';
      recompensas.forEach(rec => {
        container.innerHTML += `
                <div class="recompensa-card">
                    <div><h4>${rec.nome}</h4><p>Custo: ${rec.custo} pts</p></div>
                    <button class="btn-danger" onclick="removerRecompensa(${rec.id})">Remover</button>
                </div>
            `;
      });
    }

    async function adicionarRecompensa() {
      const nome = document.getElementById('novaRecompensaNome').value.trim();
      const custo = parseInt(document.getElementById('novaRecompensaCusto').value);
      if (nome && custo) {
        await apiPost('/api/recompensas', { nome, custo });
        document.getElementById('novaRecompensaNome').value = '';
        document.getElementById('novaRecompensaCusto').value = '';
        await carregarRecompensasProfessor();
        mostrarNotificacao('Recompensa adicionada!', 'success');
      }
    }

    async function removerRecompensa(id) {
      await apiDelete(`/api/recompensas/${id}`);
      await carregarRecompensasProfessor();
    }

    async function carregarSolicitacoes() {
      const solicitacoes = await apiGet('/api/solicitacoes');
      const container = document.getElementById('resgatesPendentes');
      if (solicitacoes.length === 0) {
        container.innerHTML = '<p>Nenhum resgate pendente</p>';
        return;
      }
      container.innerHTML = '';
      for (const sol of solicitacoes) {
        const alunos = await apiGet('/api/alunos');
        const aluno = alunos.find(a => a.id === sol.aluno_id);
        container.innerHTML += `
                <div class="recompensa-card">
                    <div>
                        <strong>${aluno ? aluno.nome : 'Aluno'}</strong> solicitou: ${sol.recompensa_nome}<br>
                        Custo: ${sol.custo} pts
                    </div>
                    <div>
                        <button class="btn-success" onclick="aprovarResgate(${sol.id}, ${sol.aluno_id}, ${sol.custo}, '${sol.recompensa_nome}')">Aprovar</button>
                        <button class="btn-danger" onclick="rejeitarResgate(${sol.id})">Rejeitar</button>
                    </div>
                </div>
            `;
      }
    }

    async function aprovarResgate(id, alunoId, custo, nome) {
      await apiPut(`/api/solicitacoes/${id}/aprovar`, { aluno_id: alunoId, custo, recompensa_nome: nome });
      await carregarAlunos();
      await carregarSolicitacoes();
      mostrarNotificacao('Resgate aprovado!', 'success');
    }

    async function rejeitarResgate(id) {
      await apiDelete(`/api/solicitacoes/${id}/rejeitar`);
      await carregarSolicitacoes();
    }

    // ========== ALUNO ==========
     async function carregarDadosAluno() {
  const alunos = await apiGet('/api/alunos');
  const aluno = alunos.find(a => a.id === alunoAtualId);
  if (!aluno) return;

  document.getElementById('alunoSaldo').innerText = aluno.pontos;

  const historico = await apiGet(`/api/historico/${alunoAtualId}`);
  const histDiv = document.getElementById('alunoHistorico');

  if (historico.length > 0) {
    histDiv.innerHTML = `
      <table style="width:100%">
        <tr>
          <th>Data</th>
          <th>Atividade</th>
          <th>Pontos</th>
        </tr>
      </table>
    `;

    const tabela = histDiv.querySelector("table");

    historico.slice(0, 10).forEach(h => {
      tabela.innerHTML += `
        <tr>
          <td style="font-size:12px">${h.data}</td>
          <td>${h.tipo}</td>
          <td style="color:${h.pontos > 0 ? 'green' : 'red'}">
            ${h.pontos > 0 ? '+' : ''}${h.pontos}
          </td>
        </tr>
      `;
    });

    } else {
    histDiv.innerHTML = '<p>Nenhuma atividade</p>';
  }

      const ranking = [...alunos].sort((a, b) => b.pontos - a.pontos);
      const posicao = ranking.findIndex(a => a.id === alunoAtualId) + 1;
      let rankingHtml = `<p><strong>Sua posição: ${posicao}º</strong></p><ul class="ranking-list">`;
      ranking.slice(0, 5).forEach((a, i) => {
        rankingHtml += `<li class="ranking-item ${i === 0 ? 'top-1' : ''}"><span>${i + 1}. ${a.nome}</span><span class="pontos">${a.pontos} pts</span></li>`;
      });
      rankingHtml += '</ul>';
      document.getElementById('rankingAluno').innerHTML = rankingHtml;

      const recompensas = await apiGet('/api/recompensas');
      const recompDiv = document.getElementById('recompensasAluno');
      recompDiv.innerHTML = '';
      recompensas.forEach(rec => {
        recompDiv.innerHTML += `
                <div class="recompensa-card">
                    <div><h4>${rec.nome}</h4><p>${rec.custo} pts</p></div>
                    <button class="btn-primary" onclick="solicitarResgate(${rec.id}, '${rec.nome}', ${rec.custo})" ${aluno.pontos >= rec.custo ? '' : 'disabled'}>Resgatar</button>
                </div>
            `;
      });
    }

    async function solicitarResgate(id, nome, custo) {
      await apiPost('/api/solicitacoes', {
        aluno_id: alunoAtualId,
        recompensa_id: id,
        recompensa_nome: nome,
        custo: custo
      });
      mostrarNotificacao(`Solicitação de "${nome}" enviada!`, 'success');
    }

    // ========== TROCAR TELA ==========
    async function switchRole(role) {
      document.querySelectorAll('.btn-role').forEach(btn => btn.classList.remove('active'));
      document.querySelector(`.btn-role.${role}`).classList.add('active');

      const profDiv = document.getElementById('professorDashboard');
      const alunoDiv = document.getElementById('alunoDashboard');

      if (role === 'professor') {
        profDiv.classList.add('active');
        alunoDiv.classList.remove('active');
        await carregarAlunos();
        await carregarRecompensasProfessor();
        await carregarSolicitacoes();
      } else {
        profDiv.classList.remove('active');
        alunoDiv.classList.add('active');
        await carregarDadosAluno();
      }
    }

    // Inicializar
    carregarAlunos();
    carregarRecompensasProfessor();
    carregarSolicitacoes();

    window.switchRole = switchRole;
    window.adicionarPontos = adicionarPontos;
    window.pontosPersonalizados = pontosPersonalizados;
    window.adicionarAluno = adicionarAluno;
    window.resetarPontuacaoGeral = resetarPontuacaoGeral;
    window.adicionarRecompensa = adicionarRecompensa;
    window.removerRecompensa = removerRecompensa;
    window.aprovarResgate = aprovarResgate;
    window.rejeitarResgate = rejeitarResgate;
    window.solicitarResgate = solicitarResgate;
