// caminhao.js - VERSÃO FINAL COMPLETA

class Caminhao extends Carro {
    capacidadeCarga; cargaAtual; _tipoClasse = 'Caminhao';

    constructor(modelo, cor, capacidadeCargaInput, velocidadeMaxima = 120, id = null, historicoManutencao = [], ligado = false, velocidade = 0, cargaAtual = 0) {
        super(modelo, cor, velocidadeMaxima, id, historicoManutencao, ligado, velocidade);
        const capacidade = parseFloat(capacidadeCargaInput);
        if (isNaN(capacidade) || capacidade <= 0) { throw new Error("Capacidade de carga inválida."); }
        this.capacidadeCarga = capacidade;
        const cargaInicial = parseFloat(cargaAtual);
        this.cargaAtual = (!isNaN(cargaInicial) && cargaInicial >= 0) ? Math.min(cargaInicial, this.capacidadeCarga) : 0;
        this.imagem = 'imagens/scania1.webp';
    }

    carregar(pesoInput) {
        const peso = parseFloat(pesoInput);
        if (isNaN(peso) || peso <= 0) { this.alerta("Insira um peso válido.", 'erro'); tocarSom('somErro'); return false; }
        if (this.cargaAtual + peso > this.capacidadeCarga) {
            const espacoLivre = this.capacidadeCarga - this.cargaAtual;
            this.alerta(`Capacidade excedida! Livre: ${espacoLivre.toFixed(0)} kg.`, 'aviso'); tocarSom('somErro'); return false;
        }
        this.cargaAtual += peso;
        return true;
    }

    descarregar(pesoInput) {
        const peso = parseFloat(pesoInput);
        if (isNaN(peso) || peso <= 0) { this.alerta("Insira um peso válido.", 'erro'); tocarSom('somErro'); return false; }
        if (peso > this.cargaAtual) {
            this.alerta(`Não pode descarregar ${peso.toFixed(0)} kg.`, 'aviso'); tocarSom('somErro'); return false;
        }
        this.cargaAtual -= peso;
        return true;
    }

    acelerar(incremento = 5) {
        if (!this.ligado) { this.alerta("Ligue o veículo para acelerar!", 'erro'); tocarSom('somErro'); return false; }
        const fatorCarga = this.capacidadeCarga > 0 ? Math.max(0.3, 1 - (this.cargaAtual / this.capacidadeCarga) * 0.7) : 1;
        const aceleracaoReal = Math.max(0, incremento) * fatorCarga;
        return super.acelerar(aceleracaoReal);
    }

    ligar() {
        if (this.cargaAtual > this.capacidadeCarga) { this.alerta("Sobrecarregado! Remova o excesso.", "erro"); tocarSom('somErro'); return false; }
        return super.ligar();
    }

    exibirInformacoes() {
        const baseHtml = super.exibirInformacoes();
        const percCarga = this.capacidadeCarga > 0 ? (this.cargaAtual / this.capacidadeCarga) * 100 : 0;
        const cargaHtml = `
             <p><strong>Capacidade:</strong> ${this.capacidadeCarga.toLocaleString('pt-BR')} kg</p>
             <p><strong>Carga Atual:</strong> ${this.cargaAtual.toLocaleString('pt-BR')} kg (${percCarga.toFixed(1)}%)</p>
             <div class="carga-barra-container" title="${percCarga.toFixed(1)}% carregado">
                 <div class="carga-barra" style="width: ${percCarga.toFixed(1)}%;"></div>
             </div>`;
        const partes = baseHtml.split('<p><em>Manutenções:');
        return partes[0] + cargaHtml + '<p><em>Manutenções:' + partes[1];
    }
}