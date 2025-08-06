// carroesportivo.js - VERSÃO FINAL COMPLETA

class CarroEsportivo extends Carro {
    turboAtivado; _tipoClasse = 'CarroEsportivo';

    constructor(modelo, cor, velocidadeMaxima = 250, id = null, historicoManutencao = [], ligado = false, velocidade = 0, turboAtivado = false) {
        super(modelo, cor, velocidadeMaxima, id, historicoManutencao, ligado, velocidade);
        this.turboAtivado = turboAtivado;
        this.imagem = 'imagens/ferrari1.webp';
    }

    ativarTurbo() {
        if (!this.ligado) { this.alerta("Ligue o carro para ativar o turbo!", 'erro'); tocarSom('somErro'); return false; }
        if (this.turboAtivado) { this.alerta("Turbo já está ativo!", 'aviso'); return false; }
        this.turboAtivado = true;
        this.alerta("Turbo ativado!", "sucesso", 3000);
        return true;
    }

    desativarTurbo() {
        if (!this.turboAtivado) { return false; }
        this.turboAtivado = false;
        return true;
    }

    acelerar(incremento = 20) {
        if (!this.ligado) { this.alerta("Ligue o carro para acelerar!", 'erro'); tocarSom('somErro'); return false; }
        const boost = this.turboAtivado ? 1.5 : 1.0;
        const aceleracaoReal = Math.max(0, incremento) * boost;
        return super.acelerar(aceleracaoReal);
    }

    desligar() {
        const estavaComTurbo = this.turboAtivado;
        const desligou = super.desligar();
        if (desligou && estavaComTurbo) {
            this.desativarTurbo();
        }
        return desligou;
    }

    frear(decremento = 25) {
        const estavaComTurbo = this.turboAtivado;
        const freou = super.frear(decremento);
        if (freou && estavaComTurbo && this.velocidade < 30) {
            this.desativarTurbo();
            this.alerta("Turbo desativado (baixa velocidade).", "info");
        }
        return freou;
    }

    exibirInformacoes() {
        const baseHtml = super.exibirInformacoes();
        const statusTurboTexto = this.turboAtivado ? 'ATIVADO 🚀' : 'Desativado';
        const turboHtml = `<p><strong>Turbo:</strong> ${statusTurboTexto}</p>`;
        const partes = baseHtml.split('<p><em>Manutenções:');
        return partes[0] + turboHtml + '<p><em>Manutenções:' + partes[1];
    }
}