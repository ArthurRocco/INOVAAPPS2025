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
    const div = document.createElement('div');
    div.className = 'col-12 col-md-6 col-lg-4';
    div.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-body">
          <h5 class="card-title">${chamado.titulo}</h5>
          <p class="card-text">${chamado.descricao}</p>
          <p class="text-muted small">${chamado.departamento || 'Geral'} - Status: ${chamado.status}</p>
        </div>
      </div>
    `;
    ticketsGrid.appendChild(div);
  });
}

clearBtn.addEventListener('click', () => {
  ticketsGrid.innerHTML = '';
  ticketsEmpty.style.display = 'block';
});

// Carrega os tickets ao abrir a página
loadTickets();
