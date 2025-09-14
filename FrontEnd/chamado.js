const ticketsGrid = document.getElementById('ticketsGrid');
const ticketsEmpty = document.getElementById('ticketsEmpty');
const clearBtn = document.getElementById('clearTickets');

async function loadTickets() {
  const res = await fetch('http://localhost:3000/api/chamados');
  const chamados = await res.json();

  ticketsGrid.innerHTML = '';

  if (chamados.length === 0) {
    ticketsEmpty.style.display = 'block';
    return;
  } else {
    ticketsEmpty.style.display = 'none';
  }

  chamados.forEach(chamado => {
    const norm = (s) => String(s||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
    const toClass = (s) => {
      const n = norm(s);
      if (n.includes('analise') || n.includes('pendente')) return 'em-analise';
      if (n.includes('resolvido')) return 'resolvido';
      if (n.includes('fechado')) return 'fechado';
      return 'aberto';
    };
    const statusText = (s) => {
      const c = toClass(s);
      if (c === 'em-analise') return 'Em análise';
      if (c === 'resolvido') return 'Resolvido';
      if (c === 'fechado') return 'Fechado';
      return 'Aberto';
    };
    const classToDbStatus = (c) => {
      switch (c) {
        case 'em-analise': return 'em análise';
        case 'resolvido': return 'resolvido';
        case 'fechado': return 'fechado';
        default: return 'aberto';
      }
    };
    const cls = toClass(chamado.status);
    const txt = statusText(chamado.status);

    const div = document.createElement('div');
    div.className = 'col-12 col-md-6 col-lg-4';
    div.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title mb-0">${chamado.titulo}</h5>
            <span class="badge status-badge ${cls}" data-role="status">${txt}</span>
          </div>
          <p class="card-text flex-grow-1">${chamado.descricao}</p>
          <p class="text-muted small mb-2">Status atual: <strong data-role="status-label">${txt}</strong></p>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <small class="text-muted">${chamado.departamento || 'Geral'}</small>
            
          </div>
          <div>
          <button class="btn btn-sm btn-outline-primary" data-action="toggle-status">Alterar status</button>
          <button class="btn btn-sm btn-outline-danger" data-action="remove">Remover</button>
          </div>
          </div>
      </div>
    `;
    const removeBtn = div.querySelector('[data-action="remove"]');
    removeBtn.addEventListener('click', async () => {
      try {
        const resp = await fetch(`${location.origin}/api/chamados/${chamado.id}`, {
          method: 'DELETE'
        });
        if (!resp.ok) {
          const msg = await resp.text();
          throw new Error(msg || 'Erro ao remover chamado');
        }
        // Remove card da UI
        div.remove();

        // Atualiza grid vazia se não houver mais chamados
        if (ticketsGrid.children.length === 0) ticketsEmpty.style.display = 'block';

      } catch (err) {
        console.error('[chamado:delete]', err);
        alert('Não foi possível remover o chamado do servidor.');
      }
    });

    ticketsGrid.appendChild(div);

    const badge = div.querySelector('[data-role="status"]');
    const toggleBtn = div.querySelector('[data-action="toggle-status"]');
    const order = ['aberto','em-analise','resolvido','fechado'];
    const label = { 'aberto':'Aberto', 'em-analise':'Em análise', 'resolvido':'Resolvido', 'fechado':'Fechado' };

    function currentClass(){
      return order.find(k => badge.classList.contains(k)) || 'aberto';
    }
    function nextClass(c){
      const i = order.indexOf(c);
      return order[(i+1) % order.length];
    }

    toggleBtn.addEventListener('click', async ()=>{
      const cur = currentClass();
      const nxt = nextClass(cur);

      // Optimistic UI update
      order.forEach(k => badge.classList.remove(k));
      badge.classList.add(nxt);
      badge.textContent = label[nxt];
      const labelEl = div.querySelector('[data-role="status-label"]');
      if (labelEl) labelEl.textContent = label[nxt];
      badge.classList.remove('bump');
      void badge.offsetWidth; // reflow p/ reiniciar animação
      badge.classList.add('bump');

      // Persistência no backend
      try {
        const base = location.origin; // mesmo host do backend
        const resp = await fetch(`${base}/api/chamados/${chamado.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: classToDbStatus(nxt) })
        });
        if (!resp.ok) {
          const msg = await resp.text();
          throw new Error(msg || 'Falha ao atualizar status');
        }
      } catch (err) {
        // Reverte UI em caso de erro
        order.forEach(k => badge.classList.remove(k));
        badge.classList.add(cur);
        badge.textContent = label[cur];
        const labelEl2 = div.querySelector('[data-role="status-label"]');
        if (labelEl2) labelEl2.textContent = label[cur];
        console.error('[status:update] erro:', err);
        alert('Não foi possível atualizar o status no servidor.');
      }
    });

    // Efeito de peso do mouse nos cards
    const card = div.querySelector('.card');
    card.style.transition = 'transform 120ms ease, box-shadow 120ms ease';
    card.style.transformStyle = 'preserve-3d';
    card.style.willChange = 'transform';

    let ticking = false;
    let lastX = 0, lastY = 0;

    card.addEventListener('mousemove', (e) => {
      lastX = e.clientX; lastY = e.clientY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = lastX - rect.left;
          const y = lastY - rect.top;
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const maxDeg = 9;
          const rotateX = ((y - cy) / cy) * maxDeg;
          const rotateY = ((x - cx) / cx) * -maxDeg;
          card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
          card.style.boxShadow = '0 14px 28px rgba(0,0,0,0.12)';
          ticking = false;
        });
        ticking = true;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)';
      card.style.boxShadow = '';
    });
  });
}

clearBtn.addEventListener('click', () => {
  ticketsGrid.innerHTML = '';
  ticketsEmpty.style.display = 'block';
});

// Carrega os tickets ao abrir a página
loadTickets();
