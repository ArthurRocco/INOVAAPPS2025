const ticketsGrid = document.getElementById('ticketsGrid');
const ticketsEmpty = document.getElementById('ticketsEmpty');
const clearBtn = document.getElementById('clearTickets');
const filterBtns = document.querySelectorAll('#filtersBar .filter-pill');

let allTickets = [];      // Armazena todos os chamados
let activeFilter = null;  // Departamento ativo (null = sem filtro)

// Função auxiliar para status
function getStatusClass(status) {
  const n = String(status||'').toLowerCase();
  if (n.includes('analise') || n.includes('pendente')) return 'em-analise';
  if (n.includes('resolvido')) return 'resolvido';
  if (n.includes('fechado')) return 'fechado';
  return 'aberto';
}
function getStatusText(status) {
  const cls = getStatusClass(status);
  return { 'aberto':'Aberto','em-analise':'Em análise','resolvido':'Resolvido','fechado':'Fechado' }[cls];
}
function classToDbStatus(c) {
  switch(c){
    case 'em-analise': return 'em análise';
    case 'resolvido': return 'resolvido';
    case 'fechado': return 'fechado';
    default: return 'aberto';
  }
}

// Renderiza chamados filtrados
function renderTickets() {
  ticketsGrid.innerHTML = '';
  const filtered = activeFilter ? allTickets.filter(t => t.departamento === activeFilter) : allTickets;

  if (filtered.length === 0) {
    ticketsEmpty.style.display = 'block';
    return;
  } else {
    ticketsEmpty.style.display = 'none';
  }

  filtered.forEach(chamado => {
    const cls = getStatusClass(chamado.status);
    const txt = getStatusText(chamado.status);

    const div = document.createElement('div');
    div.className = 'col-12 col-md-6 col-lg-4';
    div.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 class="card-title mb-0">${chamado.titulo}</h5>
              <small class="text-muted">ID: ${chamado.id}</small>
            </div>
            <span class="badge status-badge ${cls}" data-role="status">${txt}</span>
          </div>
          <p class="card-text flex-grow-1">${chamado.descricao}</p>
          <p class="text-muted small mb-2">Status atual: <strong data-role="status-label">${txt}</strong></p>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <small class="text-muted">${chamado.departamento || 'Geral'}</small>
          </div>
          <div class="mt-2">
            <button class="btn btn-sm btn-outline-primary" data-action="toggle-status">Alterar status</button>
            <button class="btn btn-sm btn-outline-danger" data-action="remove">Remover</button>
          </div>
        </div>
      </div>
    `;
    ticketsGrid.appendChild(div);

    // Toggle status
    const badge = div.querySelector('[data-role="status"]');
    const toggleBtn = div.querySelector('[data-action="toggle-status"]');
    const order = ['aberto','em-analise','resolvido','fechado'];
    const label = { 'aberto':'Aberto','em-analise':'Em análise','resolvido':'Resolvido','fechado':'Fechado' };

    function currentClass(){ return order.find(k => badge.classList.contains(k)) || 'aberto'; }
    function nextClass(c){ return order[(order.indexOf(c)+1) % order.length]; }

    toggleBtn.addEventListener('click', async ()=>{
      const cur = currentClass();
      const nxt = nextClass(cur);

      // UI otimista
      order.forEach(k => badge.classList.remove(k));
      badge.classList.add(nxt);
      badge.textContent = label[nxt];
      const labelEl = div.querySelector('[data-role="status-label"]');
      if(labelEl) labelEl.textContent = label[nxt];
      badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');

      // Persistência backend
      try {
        const resp = await fetch(`${location.origin}/api/chamados/${chamado.id}`, {
          method:'PUT',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({status: classToDbStatus(nxt)})
        });
        if(!resp.ok) throw new Error(await resp.text() || 'Erro ao atualizar status');
      } catch(err){
        // Reverte UI
        order.forEach(k => badge.classList.remove(k));
        badge.classList.add(cur);
        badge.textContent = label[cur];
        const labelEl2 = div.querySelector('[data-role="status-label"]');
        if(labelEl2) labelEl2.textContent = label[cur];
        console.error('[status:update]', err);
        alert('Não foi possível atualizar o status no servidor.');
      }
    });

    // Remove chamado
    const removeBtn = div.querySelector('[data-action="remove"]');
    removeBtn.addEventListener('click', async ()=>{
      try{
        const resp = await fetch(`${location.origin}/api/chamados/${chamado.id}`, { method:'DELETE' });
        if(!resp.ok) throw new Error(await resp.text() || 'Erro ao remover chamado');
        // Remove da UI e da memória
        div.remove();
        allTickets = allTickets.filter(t => t.id !== chamado.id);
        if(ticketsGrid.children.length === 0) ticketsEmpty.style.display = 'block';
      } catch(err){
        console.error('[chamado:delete]', err);
        alert('Não foi possível remover o chamado do servidor.');
      }
    });

    // Efeito de peso do mouse
    const card = div.querySelector('.card');
    card.style.transition = 'transform 120ms ease, box-shadow 120ms ease';
    card.style.transformStyle = 'preserve-3d';
    card.style.willChange = 'transform';

    let ticking=false, lastX=0, lastY=0;
    card.addEventListener('mousemove', e=>{
      lastX=e.clientX; lastY=e.clientY;
      if(!ticking){
        window.requestAnimationFrame(()=>{
          const rect=card.getBoundingClientRect();
          const x=lastX-rect.left, y=lastY-rect.top;
          const cx=rect.width/2, cy=rect.height/2, maxDeg=9;
          card.style.transform=`perspective(700px) rotateX(${((y-cy)/cy)*maxDeg}deg) rotateY(${((x-cx)/cx)*-maxDeg}deg) scale(1.03)`;
          card.style.boxShadow='0 14px 28px rgba(0,0,0,0.12)';
          ticking=false;
        });
        ticking=true;
      }
    });
    card.addEventListener('mouseleave', ()=>{
      card.style.transform='perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)';
      card.style.boxShadow='';
    });
  });
}

// Carrega chamados do backend
async function loadTickets() {
  try{
    const res = await fetch('http://localhost:3000/api/chamados');
    allTickets = await res.json();
    renderTickets();
  } catch(err){
    console.error('Erro ao carregar chamados:', err);
  }
}

// Filtros
filterBtns.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    activeFilter = (activeFilter === btn.dataset.dept) ? null : btn.dataset.dept;
    filterBtns.forEach(b=>b.classList.remove('active'));
    if(activeFilter) btn.classList.add('active');
    renderTickets();
  });
});

// Limpar grid
clearBtn.addEventListener('click', ()=>{
  allTickets = [];
  renderTickets();
});

// Inicializa
loadTickets();
