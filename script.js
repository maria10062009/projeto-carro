// Classes de Veículos
class Veiculo {
    constructor(modelo, cor, combustivelMaximo = 100) {
        this.modelo = modelo;
        this.cor = cor;
        this.ligado = false;
        this.velocidade = 0;
        this.combustivel = combustivelMaximo;
        this.combustivelMaximo = combustivelMaximo;
    }

    ligar() {
        if (this.combustivel > 0) {
            this.ligado = true;
           // return `O ${this.modelo} foi ligado.`;
        } else {
            //return `O ${this.modelo} não tem combustível para ligar.`;
        }
    }

    desligar() {
        this.ligado = false;
        this.velocidade = 0;
       // return `O ${this.modelo} foi desligado.`;
    }

    acelerar(incremento) {
        if (this.ligado && this.combustivel > 0) {
            this.velocidade += incremento;
            this.combustivel -= 1; // Consome combustível ao acelerar
           // return `O ${this.modelo} acelerou para ${this.velocidade} km/h. Combustível: ${this.combustivel}`;
        } else if (!this.ligado) {
           // return `O ${this.modelo} precisa estar ligado para acelerar.`;
        } else {
            //return `O ${this.modelo} está sem combustível.`;
        }
    }

    frear(decremento) {
        this.velocidade = Math.max(0, this.velocidade - decremento);
       // return `O ${this.modelo} freou para ${this.velocidade} km/h.`;
    }

    pintar(novaCor) {
        this.cor = novaCor;
       // return `O ${this.modelo} foi pintado de ${novaCor}.`;
    }

    mudarModelo(novoModelo) {
        this.modelo = novoModelo;
       // return `O veículo agora é um ${novoModelo}.`;
    }

    exibirInformacoes() {
        return `Modelo: ${this.modelo}, Cor: ${this.cor}, Ligado: ${this.ligado}, Velocidade: ${this.velocidade} km/h, Combustível: ${this.combustivel}/${this.combustivelMaximo}`;
    }

    usarCombustivel(quantidade) {
        this.combustivel = Math.max(0, this.combustivel - quantidade);
    }
}

class CarroEsportivo extends Veiculo {
    constructor(modelo, cor) {
        super(modelo, cor);
        this.turboAtivado = false;
    }

    ativarTurbo() {
        if (this.ligado && this.combustivel > 0) {
            this.turboAtivado = true;
           // return `Turbo do ${this.modelo} ativado!`;
        } else {
           // return `O ${this.modelo} precisa estar ligado e ter combustível para ativar o turbo.`;
        }
    }

    desativarTurbo() {
        this.turboAtivado = false;
       // return `Turbo do ${this.modelo} desativado!`;
    }

    acelerar(incremento) {
        let incrementoTurbo = this.turboAtivado ? incremento * 2 : incremento;
        const resultadoSuper = super.acelerar(incrementoTurbo);
        if (this.turboAtivado && this.ligado && this.combustivel > 0) {
             this.usarCombustivel(2); // Turbo consome mais combustível
             //return resultadoSuper + ` (Turbo consumiu combustível adicional. Combustível: ${this.combustivel})`;
        } else {
            //return resultadoSuper;
        }
    }

    exibirInformacoes() {
        return `${super.exibirInformacoes()}, Turbo: ${this.turboAtivado ? 'Ativado' : 'Desativado'}`;
    }
}

class Caminhao extends Veiculo {
    constructor(modelo, cor, capacidadeCarga) {
        super(modelo, cor);
        this.capacidadeCarga = capacidadeCarga;
        this.cargaAtual = 0;
    }

    carregar(quantidade) {
        if (this.cargaAtual + quantidade <= this.capacidadeCarga) {
            this.cargaAtual += quantidade;
           // return `Caminhão ${this.modelo} carregado com ${quantidade} unidades. Carga atual: ${this.cargaAtual}.`;
        } else {
            //return `Carga máxima excedida. Capacidade: ${this.capacidadeCarga}, Carga atual: ${this.cargaAtual}.`;
        }
    }

    descarregar(quantidade) {
        this.cargaAtual = Math.max(0, this.cargaAtual - quantidade);
        //return `Caminhão ${this.modelo} descarregado com ${quantidade} unidades. Carga atual: ${this.cargaAtual}.`;
    }

    acelerar(incremento) {
        const resultadoSuper = super.acelerar(incremento);
        if(this.ligado && this.combustivel > 0){
             this.usarCombustivel(0.5); //Caminhão consome mais combustível
           //  return resultadoSuper + ` (Caminhão consumiu combustível adicional. Combustível: ${this.combustivel})`;
        } else {
           // return resultadoSuper;
        }
    }

    exibirInformacoes() {
        return `${super.exibirInformacoes()}, Carga: ${this.cargaAtual}/${this.capacidadeCarga}`;
    }
}

class Moto extends Veiculo {
    constructor(modelo, cor) {
        super(modelo, cor, 50); // Moto tem menos combustível
    }

    acelerar(incremento) {
        const resultadoSuper = super.acelerar(incremento);
        if(this.ligado && this.combustivel > 0){
             this.usarCombustivel(1.5); //Caminhão consome mais combustível
             //return resultadoSuper + ` (Moto consumiu combustível adicional. Combustível: ${this.combustivel})`;
        } else {
            //return resultadoSuper;
        }
    }

    exibirInformacoes() {
        return `${super.exibirInformacoes()}, Tipo: Moto`;
    }
}

class Bicicleta extends Veiculo {
    constructor(modelo, cor) {
        super(modelo, cor, Infinity); // Bicicleta não usa combustível
    }

    ligar() {
        return "Bicicleta não precisa ser ligada.";
    }

    acelerar(incremento) {
        this.velocidade += incremento;
       // return `Bicicleta ${this.modelo} acelerou para ${this.velocidade} km/h.`;
    }

    exibirInformacoes() {
        return `${super.exibirInformacoes()}, Tipo: Bicicleta (Não usa combustível)`;
    }
}

// Classe Garagem
class Garagem {
    constructor() {
        this.veiculos = [
            new Veiculo("Civic", "Prata"),
            new CarroEsportivo("Ferrari", "Vermelha"),
            new Caminhao("Volvo", "Branco", 1000),
            new Moto("Harley", "Preta"),
            new Bicicleta("Caloi", "Verde")
        ];
        this.veiculoSelecionado = null;
    }

    adicionarVeiculo(veiculo) {
        this.veiculos.push(veiculo);
    }

    selecionarVeiculo(index) {
        if (index >= 0 && index < this.veiculos.length) {
            this.veiculoSelecionado = this.veiculos[index];
            this.atualizarCombustivelInfo();
            this.exibirInformacoes();
        } else {
            console.log("Veículo não encontrado."); // Troca o alert por um console.log
        }
    }

    interagir(acao) {
        if (!this.veiculoSelecionado) {
            console.log("Selecione um veículo primeiro!"); // Troca o alert por um console.log
            return;
        }

        switch (acao) {
            case "ligar":
                this.veiculoSelecionado.ligar();
                break;
            case "desligar":
                this.veiculoSelecionado.desligar();
                break;
            case "acelerar":
                this.veiculoSelecionado.acelerar(10);
                break;
            case "frear":
                this.veiculoSelecionado.frear(5);
                break;
            case "ativarTurbo":
                if (this.veiculoSelecionado instanceof CarroEsportivo) {
                    this.veiculoSelecionado.ativarTurbo();
                } else {
                   //console.log("Ação não aplicável a este veículo.");
                }
                break;
            case "desativarTurbo":
                if (this.veiculoSelecionado instanceof CarroEsportivo) {
                    this.veiculoSelecionado.desativarTurbo();
                } else {
                   //console.log("Ação não aplicável a este veículo.");
                }
                break;
            case "carregar":
                if (this.veiculoSelecionado instanceof Caminhao) {
                    this.veiculoSelecionado.carregar(200);
                } else {
                   // console.log("Ação não aplicável a este veículo.");
                }
                break;
            case "descarregar":
                if (this.veiculoSelecionado instanceof Caminhao) {
                    this.veiculoSelecionado.descarregar(100);
                } else {
                    //console.log("Ação não aplicável a este veículo.");
                }
                break;
            case "pintar":
                const novaCor = document.getElementById("novaCor").value;
                this.veiculoSelecionado.pintar(novaCor);
                break;
            case "mudarModelo":
                const novoModelo = document.getElementById("novoModelo").value;
                this.veiculoSelecionado.mudarModelo(novoModelo);
                break;
            default:
                console.log("Ação inválida.");
        }

        this.atualizarCombustivelInfo();
        this.exibirInformacoes();
    }

    exibirInformacoes() {
        if (this.veiculoSelecionado) {
            document.getElementById("info").textContent = this.veiculoSelecionado.exibirInformacoes();
        } else {
            document.getElementById("info").textContent = "Nenhum veículo selecionado.";
        }
    }

    atualizarCombustivelInfo() {
        if (this.veiculoSelecionado) {
            document.getElementById("combustivel").textContent = `Combustível: ${this.veiculoSelecionado.combustivel}/${this.veiculoSelecionado.combustivelMaximo}`;
        } else {
            document.getElementById("combustivel").textContent = "";
        }
    }
    
}

// Instancia a Garagem
const garagem = new Garagem();

// Inicializa: Seleciona o primeiro veículo