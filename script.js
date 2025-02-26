class Carro {
    constructor(modelo, cor) {
        this.modelo = modelo;
        this.cor = cor;
        this.ligado = false;
    }

    ligar() {
        if (!this.ligado) {
            this.ligado = true;
            return "Carro ligado!";
        } else {
            return "O carro já está ligado.";
        }
    }

    desligar() {
        if (this.ligado) {
            this.ligado = false;
            return "Carro desligado!";
        } else {
            return "O carro já está desligado.";
        }
    }

    exibirInfo() {
        return `Modelo: ${this.modelo}, Cor: ${this.cor}, Ligado: ${this.ligado ? "Sim" : "Não"}`;
    }
}

// Criação de um objeto Carro
const meuCarro = new Carro("Fusca", "Azul");

// Obtendo elementos HTML
const carroImagem = document.getElementById("carro-imagem");
const carroInfo = document.getElementById("carro-info");
const ligarBtn = document.getElementById("ligar-btn");
const desligarBtn = document.getElementById("desligar-btn");

// Exibindo informações iniciais do carro
carroInfo.textContent = meuCarro.exibirInfo();

// Adicionando event listeners aos botões
ligarBtn.addEventListener("click", () => {
    const mensagem = meuCarro.ligar();
    carroInfo.textContent = meuCarro.exibirInfo();
    alert(mensagem);
});

desligarBtn.addEventListener("click", () => {
    const mensagem = meuCarro.desligar();
    carroInfo.textContent = meuCarro.exibirInfo();
    alert(mensagem);
});