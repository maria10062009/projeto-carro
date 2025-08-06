// carro.js - VERSÃO FINAL COMPLETA

class Carro {
    id; modelo; cor; ligado; velocidade; velocidadeMaxima; historicoManutencao; imagem;
    _tipoClasse = 'Carro';

    constructor(modelo, cor, velocidadeMaxima = 180, id = null, historicoManutencao = [], ligado = false, velocidade = 0) {
        if (!modelo || !cor) throw new Error("Modelo e Cor são obrigatórios.");
        this.id = id || `temp_${Date.now()}`;
        this.modelo = modelo.trim();
        this.cor = cor;
        this.velocidadeMaxima = Math.max(0, velocidadeMaxima);
        this.ligado = ligado;
        this.velocidade = velocidade;
        this.historicoManutencao = this.reidratarHistorico(historicoManutencao);
        this.imagem = 'imagens/fusca1.webp';
    }

    reidratarHistorico(historicoArray) {
        if (!Array.isArray(historicoArray)) return [];
        return historicoArray.map(item => {
            if (item instanceof Manutencao) return item;
            if (typeof item === 'object' && item !== null && item._tipoClasse === 'Manutencao') {
                try {
                    return new Manutencao(item.data, item.tipo, item.custo, item.descricao);
                } catch (e) { console.error(`ERRO Reidratar Manutencao: ${e.message}`, item); return null; }
            }
            return null;
        }).filter(Boolean);
    }

    ligar() {
        if (this.ligado) { this.alerta("Veículo já está ligado.", 'aviso'); return false; }
        this.ligado = true;
        tocarSom('somLigar');
        return true;
    }

    desligar() {
        if (!this.ligado) { this.alerta("Veículo já está desligado.", 'aviso'); return false; }
        if (this.velocidade > 0) { this.alerta("Pare o veículo antes de desligar!", 'erro'); tocarSom('somErro'); return false; }
        this.ligado = false;
        tocarSom('somDesligar');
        return true;
    }

    acelerar(incremento = 10) {
        if (!this.ligado) { this.alerta("Ligue o veículo para acelerar!", 'erro'); tocarSom('somErro'); return false; }
        const inc = Math.max(0, incremento);
        const novaVelocidade = Math.min(this.velocidade + inc, this.velocidadeMaxima);
        if (novaVelocidade === this.velocidade) {
            if (this.velocidade === this.velocidadeMaxima) { this.alerta("Velocidade máxima atingida!", 'aviso'); }
            return false;
        }
        this.velocidade = novaVelocidade;
        tocarSom('somAcelerar');
        return true;
    }

    frear(decremento = 20) {
        if (this.velocidade === 0) { this.alerta("Veículo já está parado.", 'aviso'); return false; }
        const dec = Math.max(0, decremento);
        this.velocidade = Math.max(0, this.velocidade - dec);
        tocarSom('somFrear');
        return true;
    }

    buzinar() {
        tocarSom('somBuzina');
        this.alerta("Buzinou!", "info", 2000);
        return true;
    }

    async adicionarManutencao(manutencaoObj) {
        if (!(manutencaoObj instanceof Manutencao)) { throw new Error("Objeto de manutenção inválido."); }
        this.historicoManutencao.push(manutencaoObj);
        this.historicoManutencao.sort((a, b) => new Date(b.data) - new Date(a.data));
        await this.notificarAtualizacao();
        return true;
    }

    getHistoricoPassado() {
        return this.historicoManutencao.filter(m => !m.isAgendamentoFuturo());
    }

    getAgendamentosFuturos() {
        return this.historicoManutencao.filter(m => m.isAgendamentoFuturo());
    }

    exibirInformacoes() {
        const statusClass = this.ligado ? 'status-ligado' : 'status-desligado';
        const statusTexto = this.ligado ? 'Ligado' : 'Desligado';
        const historicoCount = this.getHistoricoPassado().length;
        const agendamentosCount = this.getAgendamentosFuturos().length;
        return `
            <img src="${this.imagem}" alt="Imagem de ${this.modelo}" class="veiculo-imagem" onerror="this.onerror=null; this.src='imagens/fusca1.webp';">
            <p><strong>ID:</strong> <small>${this.id}</small></p>
            <p><strong>Modelo:</strong> ${this.modelo}</p>
            <p><strong>Cor:</strong> <span class="color-swatch" style="background-color: ${this.cor};" title="${this.cor}"></span> ${this.cor}</p>
            <p class="${statusClass}"><span class="status-indicator"></span> <span>${statusTexto}</span></p>
            <p><strong>Velocidade:</strong> ${this.velocidade.toFixed(0)} km/h (Máx: ${this.velocidadeMaxima} km/h)</p>
            <p><em>Manutenções: ${historicoCount} | Agendamentos: ${agendamentosCount}</em></p>
        `;
    }

    alerta(mensagem, tipo = 'info', duracao = 5000) {
        adicionarNotificacao(`${this.modelo}: ${mensagem}`, tipo, duracao);
    }

    async notificarAtualizacao() {
        if (veiculoSelecionadoId === this.id) {
            atualizarDisplayVeiculo();
        }
        await atualizarVeiculoNoServidor(this);
    }
}