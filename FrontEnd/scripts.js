// ===== Demo fallback (sem backend) =====
const STOPWORDS_PT = new Set(['a','o','os','as','um','uma','uns','umas','de','do','da','dos','das','em','no','na','nos','nas','para','por','com','sem','sobre','entre','e','ou','mas','que','se','meu','minha','meus','minhas','seu','sua','seus','suas','ao','à','às','pra','pro','pela','pelo','pelos','pelas','já','bem','tá','ta','olá','boa','tarde','bom','dia','noite','ola']);
function cap(s){return s.split(/\s+/).map(w=>w.length>2?w[0].toUpperCase()+w.slice(1):w).join(' ')}
function keywords(t){const ws=t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w&&!STOPWORDS_PT.has(w)&&w.length>2);const f=new Map();for(const w of ws)f.set(w,(f.get(w)||0)+1);return [...f.entries()].sort((a,b)=>b[1]-a[1]).map(([w])=>w)}
function demoReply(userText){
  const ks=keywords(userText||'');
  const title=ks.length?cap(ks.slice(0,3).join(' ')):cap((userText||'').split(/[.!?\n]/)[0]?.slice(0,60)||'Assunto');
  const desc='O usuário relatou que '+(userText||'sem detalhes').replace(/^[A-Z]/,c=>c.toLowerCase());
  return `Título: ${title}\nDescrição: ${desc}`;
}

// ===== UI wiring =====
const $log = document.getElementById('chatLog');
const $input = document.getElementById('chatInput');
const $send  = document.getElementById('sendBtn');
const $typing= document.getElementById('typing');
const $modeBadge = document.getElementById('modeBadge');
const $modeHint  = document.getElementById('modeHint');
const $settingsBtn = document.getElementById('settingsBtn');
const history = [];

function timeNow(){ return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
function scrollToBottom(){ $log.scrollTop = $log.scrollHeight; }
function addBubble(text, role){
  const row = document.createElement('div');
  row.className = 'bubble-row ' + (role==='user'?'user':'bot');
  const bubble = document.createElement('div');
  bubble.className = 'msg ' + (role==='user'?'user':'bot');
  const body = document.createElement('div');
  body.innerText = text;
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerText = (role==='user'?'Você':'Assistente') + ' · ' + timeNow();
  bubble.appendChild(body); bubble.appendChild(meta); row.appendChild(bubble); $log.appendChild(row);
  scrollToBottom();
}

// ===== Config (local) =====
const CFG = {
  get model() { return localStorage.getItem('gemini:model') || 'gemini-1.5-flash'; },
  set model(v){ localStorage.setItem('gemini:model', v || 'gemini-1.5-flash'); },
  get endpoint() { return localStorage.getItem('gemini:endpoint') || '/api/gemini-chat'; },
  set endpoint(v){ localStorage.setItem('gemini:endpoint', v || '/api/gemini-chat'); }
};
function refreshMode(usingGemini){
  $modeBadge.textContent = usingGemini ? 'Gemini' : 'Demo';
  $modeBadge.className = 'badge ' + (usingGemini ? 'text-bg-success':'text-bg-secondary');
  $modeHint.innerHTML = usingGemini ? 'Modo atual: <strong>Gemini</strong>.' : 'Modo atual: <strong>Demo</strong>. Execute o backend para usar o Gemini.';
}

// Modal
const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
const $geminiModel = document.getElementById('geminiModel');
const $backendUrl  = document.getElementById('backendUrl');
const $saveSettings= document.getElementById('saveSettings');

function loadSettingsIntoModal(){
  $geminiModel.value = CFG.model;
  $backendUrl.value = CFG.endpoint;
}
$settingsBtn.addEventListener('click', () => { loadSettingsIntoModal(); settingsModal.show(); });
$saveSettings.addEventListener('click', () => {
  CFG.model = $geminiModel.value;
  CFG.endpoint = $backendUrl.value.trim() || '/api/gemini-chat';
  settingsModal.hide();
});

// ===== Backend probe =====
let backendAvailable = false;
async function probeBackend(){
  try {
    const res = await fetch(CFG.endpoint.replace(/\/gemini-chat.*$/,'/health'));
    backendAvailable = res.ok;
  } catch { backendAvailable = false; }
  refreshMode(backendAvailable);
}
probeBackend();

// ===== Chamada ao backend =====

let systemInstruction = "Você é um assistente de suporte técnico em PT-BR. Responda apenas aos seguintes tópicos de forma curta:";

async function loadSystemInstruction() {
  try {
    const res = await fetch('Suport/teste.txt');
    if (!res.ok) throw new Error('Não foi possível carregar o arquivo systemInstruction.txt');
    systemInstruction += await res.text();
    console.log('systemInstruction carregado com sucesso');
    systemInstruction += " Se o usuário não relatar nenhum problema, converse normalmente. Se o usuário perguntar algo **fora desses tópicos** ou quiser ABRIR UM CHAMADO, responda **APENAS**: Não tenho uma solução pronta, mas vou criar um chamado para suporte técnico."
  } catch (err) {
    console.error(err);
    systemInstruction = 'Erro: não foi possível carregar instruções.';
  }
}

// Chame essa função no início do seu script
loadSystemInstruction();

// Função que envia as mensagens para o backend
async function callBackend(messages){
  const contents = [
    { role: "user", parts: [{ text: systemInstruction }] },
    ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }))
  ];

  const res = await fetch(CFG.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: CFG.model, contents })
  });

  if (!res.ok) throw new Error('Proxy falhou: ' + res.status);
  const data = await res.json(); 
  return data.text || '(sem resposta)';
}

// ===== Envio =====
async function handleSend() {
  const text = $input.value.trim();
  if (!text) return;

  addBubble(text, 'user');
  history.push({ role:'user', text });
  $input.value = '';

  $typing.style.display = 'block';
  try {
    if (!systemInstruction) await loadSystemInstruction(); // garante carregamento
    const reply = backendAvailable ? await callBackend(history) : demoReply(text);
    addBubble(reply, 'bot');
    history.push({ role:'model', text: reply });

    // ====== TRIGGER para abrir chamado ======
    // Uso:
  if (/abrir um chamado|vou criar um chamado/i.test(reply)) {
    const chamado = await abrirChamado({
      titulo: "Chamado criado por: Usuário ",
      departamento_id: 1,
      descricao: text
    });
    addBubble(`✅ Chamado aberto com ID ${chamado.id}`, 'bot');
  }
    // ========================================

  } catch (err) {
    console.error(err);
    addBubble('Ops! Não consegui responder agora. ' + String(err), 'bot');
    history.push({ role:'model', text: 'Erro: ' + String(err) });
  } finally {
    $typing.style.display = 'none';
  }
}

async function abrirChamado({ titulo, departamento_id, descricao }) {
  const res = await fetch('/api/chamados', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo, departamento_id, descricao })
  });
  if (!res.ok) throw new Error('Falha ao abrir chamado');
  return await res.json();
}



document.getElementById('createTicket').addEventListener('click', async () => {
  const titulo = document.getElementById('ticketTitle').value.trim();
  const descricao = document.getElementById('ticketDescription').value.trim();
  const deptCheckbox = document.querySelector('#newTicketModal input[type=checkbox]:checked');

  if (!titulo || !descricao || !deptCheckbox) {
    alert('Preencha título, descrição e selecione um departamento.');
    return;
  }

  const departamento_id = 1; // Aqui você pode mapear pelo nome do departamento no backend

  try {
    const res = await fetch('/api/chamados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, descricao, departamento_id })
    });
    if (!res.ok) throw new Error('Falha ao criar chamado');
    const chamado = await res.json();

    alert(`✅ Chamado criado com ID ${chamado.id}`);

    // Fecha o modal
    const modalEl = document.getElementById('newTicketModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    // Limpa campos
    document.getElementById('ticketTitle').value = '';
    document.getElementById('ticketDescription').value = '';
    deptCheckbox.checked = false;

  } catch (err) {
    console.error(err);
    alert('Erro ao criar chamado: ' + err.message);
  }
});

// ===== Garantir escolha única no modal Novo Chamado =====
const deptCheckboxes = document.querySelectorAll('#newTicketModal input[type=checkbox]');
deptCheckboxes.forEach(cb => {
  cb.addEventListener('change', () => {
    if (cb.checked) {
      // desmarcar os demais
      deptCheckboxes.forEach(other => {
        if (other !== cb) other.checked = false;
      });
    }
  });
});

document.getElementById('sendBtn').addEventListener('click', handleSend);
document.getElementById('chatInput').addEventListener('keydown', (e)=>{
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
});
