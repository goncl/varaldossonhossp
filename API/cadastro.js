// api/cadastro.js

const bcrypt = require('bcrypt');
const Airtable = require('airtable');
const crypto = require('crypto');

// Importante: O Vercel gerencia as variáveis de ambiente
// Acesse-as via process.env
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// Função Serverless do Vercel
module.exports = async (req, res) => {
    // A função só processa requisições POST para o cadastro
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    // 1. Receber dados
    const { nome, email, senha, endereco, telefone, tipo_usuario } = req.body;

    if (!email || !senha || !tipo_usuario) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }

    try {
        // 2. Segurança: HASH da Senha
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);
        const userId = crypto.randomUUID(); 

        // --- ETAPA 1: Inserção na Tabela 'usuarios' (Dados de Login) ---
        await base('usuarios').create([
            {
                fields: {
                    'Id': userId,
                    'Nome': nome,
                    'Email': email,
                    'Senha': senhaHash,
                    'Tipo': tipo_usuario, 
                },
            },
        ]);

        // --- ETAPA 2: Inserção na Tabela de Perfil Específica (Dados Adicionais) ---
        let profileTable;
        let profileFields = {
            'Endereco': endereco,
            'Telefone': telefone,
            'UsuarioId': userId, // Para ligação no Airtable
        };

        if (tipo_usuario === 'Doador') {
            profileTable = 'doadores';
        } else if (tipo_usuario === 'PontoColeta') {
            profileTable = 'pontoscoleta';
        } else {
            return res.status(201).json({ message: 'Usuário Comum cadastrado com sucesso!' });
        }

        await base(profileTable).create([{ fields: profileFields }]);

        // 3. Resposta de Sucesso
        res.status(201).json({ message: `${tipo_usuario} cadastrado com sucesso! ID: ${userId}` });

    } catch (error) {
        console.error('Erro no cadastro:', error.message);
        res.status(500).json({ error: 'Falha ao cadastrar o usuário.' });
    }
};