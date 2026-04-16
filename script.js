
const pageLogin    = document.getElementById('page-login');
const pageRegistro = document.getElementById('page-registro');
const pageHome     = document.getElementById('page-home');
const pageCadastro = document.getElementById('page-cadastro');
const pageCofre    = document.getElementById('page-cofre');
const pagePlanos   = document.getElementById('page-planos');
const mainHeader   = document.getElementById('main-header');
const mainContent  = document.getElementById('main-content');

let cofreDeAtivos = [];
let usuarioAtual  = null;     

const LIMITE_BASICO = 3;       



function navegar(pagina) {
    [pageLogin, pageRegistro, pageHome, pageCadastro, pageCofre, pagePlanos]
        .forEach(p => p.classList.remove('active'));
    pagina.classList.add('active');
    window.scrollTo(0, 0);
}

function mostrarAlerta(id, msg, tipo = 'error') {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = `alert alert-${tipo}`;
    el.classList.remove('hidden');
}

function esconderAlerta(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}


function toggleSenha(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '👁';
    } else {
        input.type = 'password';
        btn.textContent = '👁';
    }
}


async function sha256(texto) {
    const encoder = new TextEncoder();
    const data     = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray  = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function atualizarHashPreview(senha) {
    const box = document.getElementById('hash-preview');
    if (!box) return;
    if (!senha) {
        box.textContent = 'Digite a senha para visualizar...';
        return;
    }
    const hash = await sha256(senha);
    box.textContent = hash;
}

const regras = {
    'rule-len':   s => s.length >= 8,
    'rule-upper': s => /[A-Z]/.test(s),
    'rule-lower': s => /[a-z]/.test(s),
    'rule-num':   s => /[0-9]/.test(s),
    'rule-spec':  s => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(s),
};

function validarSenha() {
    const senha = document.getElementById('reg-senha').value;
    let pontos  = 0;


    for (const [id, fn] of Object.entries(regras)) {
        const el  = document.getElementById(id);
        const ok  = fn(senha);
        if (ok) pontos++;
        el.classList.toggle('pass', ok);
        el.classList.toggle('fail', senha.length > 0 && !ok);
    }

    const cores = ['', '#ff5c5c', '#f5a623', '#f5d623', '#00c896'];
    const labels = ['', 'Muito fraca', 'Fraca', 'Moderada', 'Forte'];
    const bars = [sb1, sb2, sb3, sb4];
    bars.forEach((b, i) => {
        b.style.background = i < pontos ? cores[pontos] : 'var(--border-color, #1e2a47)';
    });
    const lbl = document.getElementById('strength-label');
    lbl.textContent = senha.length === 0 ? '— aguardando senha' : labels[pontos] || 'Fraca';
    lbl.style.color  = cores[pontos] || '#7a8499';


    atualizarHashPreview(senha);


    verificarConfirmacao();
}

function verificarConfirmacao() {
    const senha     = document.getElementById('reg-senha').value;
    const confirmar = document.getElementById('reg-confirmar').value;
    const msg       = document.getElementById('confirm-msg');
    const btn       = document.getElementById('btn-registrar');

    const todasRegrasOk = Object.values(regras).every(fn => fn(senha));

    if (confirmar.length === 0) {
        msg.classList.add('hidden');
    } else if (senha !== confirmar) {
        msg.textContent = ' As senhas não coincidem';
        msg.style.color = '#ff5c5c';
        msg.classList.remove('hidden');
    } else {
        msg.textContent = ' Senhas coincidem';
        msg.style.color = '#00c896';
        msg.classList.remove('hidden');
    }

    btn.disabled = !(todasRegrasOk && senha === confirmar && confirmar.length > 0);
}



document.getElementById('link-ir-registro').addEventListener('click', (e) => {
    e.preventDefault();
    navegar(pageRegistro);
});

document.getElementById('link-voltar-login').addEventListener('click', (e) => {
    e.preventDefault();
    navegar(pageLogin);
});


document.getElementById('form-registro').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome     = document.getElementById('reg-nome').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const senha    = document.getElementById('reg-senha').value;
    const confirmar = document.getElementById('reg-confirmar').value;

    if (!nome) return mostrarAlerta('reg-alert', 'Informe seu nome completo.');
    if (!email) return mostrarAlerta('reg-alert', 'Informe um e-mail válido.');

    const todasOk = Object.values(regras).every(fn => fn(senha));
    if (!todasOk) return mostrarAlerta('reg-alert', 'A senha não atende todos os requisitos.');
    if (senha !== confirmar) return mostrarAlerta('reg-alert', 'As senhas não coincidem.');


    const senhaHash = await sha256(senha);

  
    const usuarios = JSON.parse(localStorage.getItem('souldata_usuarios') || '{}');
    if (usuarios[email]) return mostrarAlerta('reg-alert', 'E-mail já cadastrado. Faça login.');

    usuarios[email] = { nome, email, senhaHash, plano: 'basico' };
    localStorage.setItem('souldata_usuarios', JSON.stringify(usuarios));

    alert(' Conta criada com sucesso! Faça login.');
    navegar(pageLogin);
});
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    esconderAlerta('login-alert');

    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-password').value;


    if (senha.length < 8) {
        mostrarAlerta('login-alert', ' A senha deve ter pelo menos 8 caracteres.');
        document.getElementById('login-password').classList.add('input-error');
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem('souldata_usuarios') || '{}');
    const user = usuarios[email];

    if (!user) {
        mostrarAlerta('login-alert', ' E-mail não encontrado. Cadastre-se primeiro.');
        return;
    }

    const senhaHash = await sha256(senha);
    if (senhaHash !== user.senhaHash) {
        mostrarAlerta('login-alert', ' Senha incorreta. Tente novamente.');
        document.getElementById('login-password').classList.add('input-error');
        return;
    }


    usuarioAtual = user;
    cofreDeAtivos = JSON.parse(localStorage.getItem(`souldata_cofre_${email}`) || '[]');

    pageLogin.classList.remove('active');
    mainHeader.classList.remove('hidden');
    mainContent.classList.remove('hidden');

    atualizarBadgePlano();
    navegar(pageHome);
});


document.getElementById('link-home').addEventListener('click',    (e) => { e.preventDefault(); navegar(pageHome); });
document.getElementById('link-planos').addEventListener('click',  (e) => { e.preventDefault(); navegar(pagePlanos); marcarPlanoAtual(); });
document.getElementById('btn-start').addEventListener('click',    ()  => navegar(pageCadastro));
document.getElementById('link-logout').addEventListener('click',  (e) => { e.preventDefault(); fazerLogout(); });

document.getElementById('link-cadastro').addEventListener('click', (e) => {
    e.preventDefault();
    verificarLimiteCadastro();
});

document.getElementById('link-cofre').addEventListener('click', (e) => {
    e.preventDefault();
    navegar(pageCofre);
    renderizarCofre();
});

function fazerLogout() {
    usuarioAtual = null;
    cofreDeAtivos = [];
    mainHeader.classList.add('hidden');
    mainContent.classList.add('hidden');
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    navegar(pageLogin);
}


function escolherPlano(plano) {
    if (!usuarioAtual) return;

    const usuarios = JSON.parse(localStorage.getItem('souldata_usuarios') || '{}');
    usuarios[usuarioAtual.email].plano = plano;
    localStorage.setItem('souldata_usuarios', JSON.stringify(usuarios));
    usuarioAtual.plano = plano;

    atualizarBadgePlano();
    marcarPlanoAtual();

    const nomes = { basico: 'Básico', premium: 'Premium' };
    alert(` Plano ${nomes[plano]} ativado com sucesso!`);
    navegar(pageHome);
}

function atualizarBadgePlano() {
    const badge = document.getElementById('user-plan-badge');
    if (!badge || !usuarioAtual) return;
    const isPremium = usuarioAtual.plano === 'premium';
    badge.innerHTML = `
        <span class="user-plan-tag ${isPremium ? 'tag-premium' : 'tag-basico'}">
            ${isPremium ? ' 🔹Premium' : '🔹 Básico'} — ${usuarioAtual.nome}
        </span>`;
}

function marcarPlanoAtual() {
    const basico   = document.getElementById('card-basico');
    const premium  = document.getElementById('card-premium');
    if (!basico || !premium || !usuarioAtual) return;

    basico.classList.toggle('plano-ativo',  usuarioAtual.plano === 'basico');
    premium.classList.toggle('plano-ativo', usuarioAtual.plano === 'premium');

    const btnBasico   = basico.querySelector('.btn-plano');
    const btnPremium  = premium.querySelector('.btn-plano');
    if (usuarioAtual.plano === 'basico')   btnBasico.textContent   = '✔ Plano Atual';
    if (usuarioAtual.plano === 'premium')  btnPremium.textContent  = '✔ Plano Atual';
}

function verificarLimiteCadastro() {
    navegar(pageCadastro);
    const bloqueio = document.getElementById('cadastro-bloqueio');
    const formAtivo = document.getElementById('form-ativo');
    if (usuarioAtual?.plano === 'basico' && cofreDeAtivos.length >= LIMITE_BASICO) {
        bloqueio.classList.remove('hidden');
        formAtivo.classList.add('hidden');
    } else {
        bloqueio.classList.add('hidden');
        formAtivo.classList.remove('hidden');
    }
}


document.getElementById('tipoAtivo').addEventListener('change', (e) => {
    const valor    = e.target.value;
    const container = document.getElementById('container-senha');
    const label    = document.getElementById('label-senha');

    if (valor !== '') {
        container.classList.remove('hidden');
        const labels = {
            banco:      'Senha do banco',
            redesocial: 'Senha da rede social',
            crypto:     'Chave de acesso / seed phrase',
            documentos: 'Senha do cofre de documentos',
        };
        label.textContent = labels[valor] || 'Senha do Ativo';
    } else {
        container.classList.add('hidden');
    }
});

document.getElementById('form-ativo').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Verificar limite do plano básico
    if (usuarioAtual?.plano === 'basico' && cofreDeAtivos.length >= LIMITE_BASICO) {
        document.getElementById('modalUpgradeMsg').textContent =
            `O plano Básico permite até ${LIMITE_BASICO} ativos. Faça upgrade para o Premium.`;
        document.getElementById('modalUpgrade').style.display = 'flex';
        return;
    }

    const senhaTexto = document.getElementById('senhaAtivo').value;
    const senhaHash  = senhaTexto ? await sha256(senhaTexto) : null;

    const novoAtivo = {
        id:             Date.now(),
        titular:        document.getElementById('titular').value,
        tipo:           document.getElementById('tipoAtivo').options[document.getElementById('tipoAtivo').selectedIndex].text,
        tipoValor:      document.getElementById('tipoAtivo').value,
        identificacao:  document.getElementById('identificacao').value,
        herdeiro:       document.getElementById('emailHerdeiro').value,
        tempo:          document.getElementById('tempoInatividade').value,
        criadoEm:       new Date().toLocaleDateString('pt-BR'),
    };

    cofreDeAtivos.push(novoAtivo);
    localStorage.setItem(`souldata_cofre_${usuarioAtual.email}`, JSON.stringify(cofreDeAtivos));

    document.getElementById('form-ativo').reset();
    document.getElementById('container-senha').classList.add('hidden');
    document.getElementById('modalSucesso').style.display = 'flex';
});

document.getElementById('btnFecharModal').addEventListener('click', () => {
    document.getElementById('modalSucesso').style.display = 'none';
    navegar(pageCofre);
    renderizarCofre();
});

function fecharModalUpgrade() {
    document.getElementById('modalUpgrade').style.display = 'none';
}
function irParaPlanos() {
    fecharModalUpgrade();
    navegar(pagePlanos);
    marcarPlanoAtual();
}


const icones = {
    crypto:     '₿',
    redesocial: '📱',
    banco:      '🏦',
    documentos: '📁',
};

function renderizarCofre() {
    const lista = document.getElementById('lista-ativos');
    const bloqueioEl = document.getElementById('cofre-bloqueio');

    if (usuarioAtual?.plano === 'basico') {
        bloqueioEl.classList.remove('hidden');
    } else {
        bloqueioEl.classList.add('hidden');
    }

    if (cofreDeAtivos.length === 0) {
        lista.innerHTML = '<p class="cofre-vazio">Seu cofre está vazio. Cadastre seu primeiro ativo digital.</p>';
        return;
    }

    lista.innerHTML = '';
    cofreDeAtivos.forEach((ativo, idx) => {
        const card = document.createElement('div');
        card.className = 'ativo-card';
        card.innerHTML = `
            <div class="ativo-header">
                <span class="ativo-icon">${icones[ativo.tipoValor] || ''}</span>
                <h3>${ativo.tipo}</h3>
                <span class="ativo-data">${ativo.criadoEm}</span>
            </div>
            <p><span class="info-label">Titular:</span> ${ativo.titular}</p>
            <p><span class="info-label">ID / Link:</span> ${ativo.identificacao}</p>
            <p><span class="info-label">Senha:</span> <span class="senha-badge">${ativo.senhaProtegida}</span></p>
            <p><span class="info-label">Herdeiro:</span> ${ativo.herdeiro}</p>
            <p><span class="info-label">Gatilho:</span> ${ativo.tempo}</p>
            <div class="ativo-footer">
                <span class="cripto-tag">✓ Criptografado</span>
                <button class="btn-remover" onclick="removerAtivo(${idx})">🗑 Remover</button>
            </div>
        `;
        lista.appendChild(card);
    });
}

function removerAtivo(idx) {
    if (!confirm('Remover este ativo do cofre?')) return;
    cofreDeAtivos.splice(idx, 1);
    localStorage.setItem(`souldata_cofre_${usuarioAtual.email}`, JSON.stringify(cofreDeAtivos));
    renderizarCofre();
}
