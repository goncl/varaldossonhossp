// api/cadastro.js

import bcrypt from "bcryptjs";
import Airtable from "airtable";
import crypto from "crypto";

// Importante: O Vercel gerencia as variáveis de ambiente
// Acesse-as via process.env
const AIRTABLE_PERSONAL_ACCESS_TOKEN = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_ACCESS_TOKEN }).base(AIRTABLE_BASE_ID);

// Função Serverless do Vercel
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { nome, email, senha, endereco, telefone, tipo_usuario } = req.body;

  if (!email || !senha || !tipo_usuario) {
    return res.status(400).json({ error: "Campos obrigatórios faltando." });
  }

  try {
    // 1. Verifica se o e-mail já existe
    const existingUsers = await base("usuarios")
      .select({
        maxRecords: 1,
        filterByFormula: `{Email} = '${email}'`,
      })
      .firstPage();

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "Este e-mail já está cadastrado." });
    }

    // 2. Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);
    const userId = crypto.randomUUID();

    // 3. Cria registro na tabela de usuários
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

    // 4. Dependendo do tipo, cria perfil extra
    if (tipo_usuario === "Doador" || tipo_usuario === "PontoColeta") {
      const profileTable = tipo_usuario === "Doador" ? "doadores" : "pontoscoleta";

      await base(profileTable).create([
        {
          fields: {
            UsuarioId: userId,
            Endereco: endereco,
            Telefone: telefone,
          },
        },
      ]);
    }

    res.status(201).json({ message: `${tipo_usuario} cadastrado com sucesso!`, id: userId });
  } catch (error) {
    console.error("Erro no cadastro:", error.message);
    res.status(500).json({ error: "Falha interna ao cadastrar o usuário." });
  }
}