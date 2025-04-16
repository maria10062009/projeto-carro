class Manutencao {
    data; tipo; custo; descricao; _tipoClasse = 'Manutencao';
    constructor(dataInput, tipoInput, custoInput, descricaoInput = '') {
        if (!this.validar(dataInput, tipoInput, custoInput)) throw new Error("Dados inválidos: Verifique data, tipo e custo (>=0).");
        const dataObj = new Date(dataInput);
        if (!isNaN(dataObj.getTime())) this.data = new Date(Date.UTC(dataObj.getUTCFullYear(), dataObj.getUTCMonth(), dataObj.getUTCDate())).toISOString().split('T')[0];
        else throw new Error("Falha interna ao processar a data.");
        this.tipo = tipoInput.trim(); this.custo = parseFloat(custoInput); this.descricao = descricaoInput.trim();
    }
    validar(data, tipo, custo) {
        const dataObj = new Date(data); if (isNaN(dataObj.getTime())) { console.error("ERRO Validação Manutencao: Data inválida.", data); return false; }
        if (!tipo || typeof tipo !== 'string' || tipo.trim().length === 0) { console.error("ERRO Validação Manutencao: Tipo obrigatório.", tipo); return false; }
        const custoNum = parseFloat(custo); if (isNaN(custoNum) || custoNum < 0) { console.error("ERRO Validação Manutencao: Custo inválido.", custo); return false; }
        return true;
    }
    formatar() {
        try {
            const dataObj = new Date(this.data + 'T00:00:00Z'); const dataFormatada = dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const custoFormatado = this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            let retorno = `${dataFormatada} - ${this.tipo} (${custoFormatado})`; if (this.descricao) retorno += ` - Desc: ${this.descricao}`; return retorno;
        } catch (e) { console.error("ERRO ao formatar manutenção:", this, e); return "Erro ao formatar"; }
    }
    isAgendamentoFuturo() {
        try {
            const hojeInicioDiaUTC = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
            const dataManutencaoUTC = new Date(this.data + 'T00:00:00Z'); return dataManutencaoUTC > hojeInicioDiaUTC;
        } catch (e) { console.error("ERRO ao verificar agendamento futuro:", this, e); return false; }
    }
}
