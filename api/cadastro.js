// api/cadastro.js

// Importa biblioteca bcryptjs para criptografar senhas (evita salvar senhas em texto puro)
import bcrypt from "bcryptjs";
// Importa o cliente do Airtable para salvar dados no banco
import Airtable from "airtable";
// Importa o módulo crypto do Node para gerar IDs únicos
import crypto from "crypto";

// As variáveis de ambiente (configurações secretas) são controladas pelo Vercel
// Aqui pegamos a chave de acesso e o ID da base do Airtable
const AIRTABLE_PERSONAL_ACCESS_TOKEN = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Conecta na base do Airtable com as credenciais
const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_ACCESS_TOKEN }).base(AIRTABLE_BASE_ID);

// Função serverless do Vercel que responde às requisições para /api/cadastro
export default async function handler(req, res) {
  // Permite apenas requisições POST (para cadastrar novos usuários)
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  // Extrai os campos enviados no corpo da requisição
  const { nome, email, senha, endereco, telefone, tipo_usuario } = req.body;

  // Validação: email, senha e tipo de usuário são obrigatórios
  if (!email || !senha || !tipo_usuario) {
    return res.status(400).json({ error: "Campos obrigatórios faltando." });
  }

  try {
    // 1. Verifica se o e-mail já existe na tabela "usuarios"
    const existingUsers = await base("usuarios")
      .select({
        maxRecords: 1, // retorna no máximo 1 registro
        filterByFormula: `{Email} = '${email}'`, // busca por e-mail igual
      })
      .firstPage();

    // Se já existe, retorna erro 409 (conflito)
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "Este e-mail já está cadastrado." });
    }

    // 2. Gera o hash (criptografia) da senha para segurança
    const senhaHash = await bcrypt.hash(senha, 10); // "10" = fator de custo
    // Gera um ID único para o usuário
    const userId = crypto.randomUUID();

    // 3. Cria um novo registro na tabela de "usuarios" no Airtable
    await base("usuarios").create([
      {
        fields: {
          Id: userId,
          Nome: nome,
          Email: email,
          Senha: senhaHash,
          Tipo: tipo_usuario,
        },
      },
    ]);

    // 4. Caso o usuário seja "Doador" ou "Ponto de Coleta", cria também o perfil específico
    if (tipo_usuario === "Doador" || tipo_usuario === "PontoColeta") {
      // Define em qual tabela criar: "doadores" ou "pontoscoleta"
      const profileTable = tipo_usuario === "Doador" ? "doadores" : "pontoscoleta";

      // Cria o perfil vinculado ao usuário
      await base(profileTable).create([
        {
          fields: {
            UsuarioId: userId, // relacionamento com a tabela usuarios
            Endereco: endereco,
            Telefone: telefone,
          },
        },
      ]);
    }

    // Se deu tudo certo, retorna status 201 (criado) com mensagem de sucesso
    res.status(201).json({ message: `${tipo_usuario} cadastrado com sucesso!`, id: userId });
  } catch (error) {
    // Caso ocorra algum erro no processo, loga no console e retorna erro 500
    console.error("Erro no cadastro:", error.message);
    res.status(500).json({ error: "Falha interna ao cadastrar o usuário." });
  }
}
