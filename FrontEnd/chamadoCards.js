// Utilitário para escapar strings
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Função que cria um elemento de card de chamado
export function createChamadoCard({ id, title, name, setor, description, createdAt }) {
  const safe = {
    id: id ?? Date.now(),
    title: title || 'Chamado sem título',
    name: name || 'Anônimo',
    setor: setor || 'Geral',
    description: description || '',
    createdAt: createdAt || new Date().toISOString()
  };

  const col = document.createElement('div');
  col.className = 'col-12 col-md-6 col-lg-4';
  col.innerHTML = `
    <div class="card shadow-soft h-100 rounded-4 chamado-card" data-id="${safe.id}">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title mb-2 text-center">${esc(safe.title)}</h5>
        <div class="text-muted small mb-1">Aberto por: <strong>${esc(safe.name)}</strong></div>
        <div class="text-muted small mb-3">Setor: <strong>${esc(safe.setor)}</strong></div>
        <p class="flex-grow-1 mb-3" style="white-space: pre-wrap;">${esc(safe.description)}</p>
        <div class="text-muted small mb-2">Data: ${new Date(safe.createdAt).toLocaleString()}</div>
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-sm btn-outline-secondary" data-action="remove" data-id="${safe.id}">Remover</button>
        </div>
      </div>
    </div>
  `;
  return col;
}