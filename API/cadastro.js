// api/cadastro.js

const bcrypt = require('bcrypt');
const Airtable = require('airtable');
const crypto = require('crypto');

// Importante: O Vercel gerencia as variáveis de ambiente
// Acesse-as via process.env
const AIRTABLE_PERSONAL_ACCESS_TOKEN = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_ACCESS_TOKEN }).base(AIRTABLE_BASE_ID);

// Função Serverless do Vercel
module.exports = async (req, res) => {
    // A função só processa requisições POST para o cadastro
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    // 1. Receber dados (CORREÇÃO: Lendo 'tipo_usuario' conforme o Front-end envia)
    const { nome, email, senha, endereco, telefone, tipo_usuario } = req.body;

    if (!email || !senha || !tipo_usuario) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }

    try {
        // --- OTIMIZAÇÃO: 1. Checar se o E-mail já existe ---
        const existingUsers = await base('usuarios').select({
            maxRecords: 1,
            filterByFormula: `{Email} = '${email}'`
        }).firstPage();

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
        }
        
        // 2. Segurança: HASH da Senha e Geração de ID
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);
        const userId = crypto.randomUUID(); 

        // --- ETAPA 2: Inserção na Tabela 'usuarios' (Dados de Login) ---
        await base('usuarios').create([
            {
                fields: {
                    'Id': userId,
                    'Nome': nome,
                    'Email': email,
                    'Senha': senhaHash,
                    'Tipo': tipo_usuario, // Usando o nome correto
                },
            },
        ]);

        // --- ETAPA 3: Inserção na Tabela de Perfil Específica (Dados Adicionais) ---
        let profileTable;
        let profileFields = {
            'UsuarioId': userId, // Para ligação no Airtable
        };

        if (tipo_usuario === 'Doador') {
            profileTable = 'doadores';
            profileFields['Endereco'] = endereco;
            profileFields['Telefone'] = telefone;
        } else if (tipo_usuario === 'PontoColeta') {
            profileTable = 'pontoscoleta';
            profileFields['Endereco'] = endereco;
            profileFields['Telefone'] = telefone;
        } else {
            // Se for 'Comum', o cadastro termina após a Etapa 2
            return res.status(201).json({ message: 'Usuário Comum cadastrado com sucesso!' });
        }

        // Se for Doador ou Ponto de Coleta, insere o perfil
        await base(profileTable).create([{ fields: profileFields }]);

        // 4. Resposta de Sucesso
        res.status(201).json({ message: `${tipo_usuario} cadastrado com sucesso! ID: ${userId}` });

    } catch (error) {
        // Log para depuração
        console.error('Erro no cadastro:', error.message, error.stack); 
        // Resposta genérica para o Front-end
        res.status(500).json({ error: 'Falha interna ao cadastrar o usuário. Tente novamente.' });
    }
};