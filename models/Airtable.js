export default class Airtable {
  constructor(token, baseId) {
    this.token = token;
    this.baseId = baseId;
  }

  async request(method, table, data = null) {
    const url = `https://api.airtable.com/v0/${this.baseId}/${table}`;

    const options = {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json"
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    return response.json();
  }

  // Listar registros
  async listar(table) {
    return this.request("GET", table);
  }

  // Inserir registro
  async inserir(table, fields) {
    const data = {
      records: [
        { fields }
      ]
    };
    return this.request("POST", table, data);
  }

  async carregarEExibirCartinhas(tableName, elementId) {
    try {
      // 1. Carrega os dados da tabela
      const dados = await this.listar(tableName);
      
      // 2. Obtém o elemento HTML para renderização
      const lista = document.getElementById(elementId);
      
      if (!lista) {
        console.error(`Elemento com ID "${elementId}" não encontrado.`);
        return;
      }
      
      // 3. Itera sobre os registros e os insere na lista
      dados.records.forEach(registro => {
        const li = document.createElement("li");
        // Assumindo os campos "Nome da Criança" e "Sonho"
        li.textContent = `${registro.fields["Nome da Criança"]} - ${registro.fields["Sonho"]}`;
        lista.appendChild(li);
      });
      
    } catch (error) {
      console.error("Erro ao carregar e exibir cartinhas:", error);
      // Você pode adicionar um tratamento de erro mais amigável aqui
      const lista = document.getElementById(elementId);
      if (lista) {
          lista.innerHTML = "<li>Não foi possível carregar as cartinhas. Tente novamente mais tarde.</li>";
      }
    }
  }
}

