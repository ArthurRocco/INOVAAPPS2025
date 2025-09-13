// ====== Store de chamados (localStorage) ======
function ticketsLoad(){
  try { return JSON.parse(localStorage.getItem('tickets')||'[]'); } catch { return []; }
}
function ticketsSave(list){ localStorage.setItem('tickets', JSON.stringify(list||[])); }
function fmtDate(iso){ try { const d=new Date(iso); return d.toLocaleString(); } catch { return iso; } }

function render(){
  const grid = document.getElementById('ticketsGrid');
  const empty = document.getElementById('ticketsEmpty');
  const data = ticketsLoad();
  grid.innerHTML = '';
  if (!data.length){ empty.style.display='block'; return; }
  empty.style.display='none';

  for (const t of data){
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';
    col.innerHTML = `
      <div class="card shadow-soft h-100">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <strong class="me-2">${t.title || 'Chamado'}</strong>
            <span class="badge text-bg-light">${fmtDate(t.createdAt)}</span>
          </div>
          <div class="text-muted small mb-2">Aberto por: <strong>${t.name || 'Você'}</strong></div>
          <p class="flex-grow-1 mb-3" style="white-space: pre-wrap;">${(t.description||'').replace(/</g,'&lt;')}</p>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-sm btn-outline-secondary" data-action="remove" data-id="${t.id}">Remover</button>
          </div>
        </div>
      </div>`;
    grid.appendChild(col);
  }

  // Ações
  grid.querySelectorAll('button[data-action="remove"]').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      const id = Number(e.currentTarget.getAttribute('data-id'));
      const list = ticketsLoad().filter(x=>x.id!==id);
      ticketsSave(list);
      render();
    });
  });
}

document.getElementById('clearTickets').addEventListener('click', ()=>{
  if (confirm('Remover todos os chamados?')){
    ticketsSave([]);
    render();
  }
});

render();
