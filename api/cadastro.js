// Arquivo: /api/cadastro.js 

import Airtable from 'airtable'; 
import bcrypt from 'bcryptjs';

// 🚨 INÍCIO DO CÓDIGO GARANTINDO A IMPORTAÇÃO E AS VARIÁVEIS
const AIRTABLE_PAT = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const base = new Airtable({ apiKey: AIRTABLE_PAT }).base(AIRTABLE_BASE_ID);
// FIM DO BLOCO DE INICIALIZAÇÃO

export default async function (req, res) { 
    // ✅ CORREÇÃO 405: Esta é a única validação de método
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    try {
        const { nome, email, senha, tipo, endereco, telefone } = req.body;
        
        // 1. VALIDAÇÃO BÁSICA
        if (!nome || !email || !senha || !tipo) {
            return res.status(400).json({ message: 'Dados básicos (nome, email, senha, tipo) são obrigatórios.' });
        }
        
        // 2. CHECAGEM DE DUPLICIDADE
        const existingRecords = await base('Usuarios').select(
            {
                filterByFormula: `{Email} = '${email}'`,
                maxRecords: 1,
                view: "Grid view"
            }
        ).firstPage();

        if (existingRecords.length > 0) {
            return res.status(409).json({ message: 'Email já cadastrado.' });
        }

        // 3. CRIPTOGRAFIA DA SENHA (SEGURANÇA!)
        // Cria um 'salt' (valor aleatório) para segurança extra
        const salt = await bcrypt.genSalt(10);
        // Gera o hash final que será armazenado no Airtable
        const hashedPassword = await bcrypt.hash(senha, salt); 

        // 4. CADASTRO NA TABELA USUARIOS
        const userRecords = await base('Usuarios').create([
            {
                "fields": {
                    "Nome": nome,
                    "Email": email,
                    "Senha": hashedPassword,
                    "Tipo": tipo
                }
            }
        ]);

        const novoUsuarioId = userRecords[0].id; 
        
        // 5. FLUXO DOADOR E VINCULAÇÃO
        if (tipo === 'Doadores') {
            if (!endereco || !telefone) {
                return res.status(400).json({ message: 'Endereço e Telefone são obrigatórios para Doadores.'});
            }

            const doadorRecords = await base('Doadores').create([
                {
                    "fields": {
                        "Endereço": endereco,
                        "Telefone": telefone,
                        "Usuario": [novoUsuarioId] // Vinculação
                    }
                }
            ]);
            
            return res.status(200).json({ 
                message: 'Cadastro de Usuário e Doador concluído!',
                usuarioId: userRecords[0].id,
                doadorId: doadorRecords[0].id
            });
        } 
        
        // 6. FLUXO PONTO DE COLETA
        else if (tipo === 'PontoDeColeta') {
            // Se precisar de Endereço/Telefone na tabela PontosDeColeta, o código deve ser adicionado aqui
            return res.status(200).json({ 
                message: 'Cadastro de Usuário (Ponto de Coleta) concluído!',
                usuarioId: userRecords[0].id
            });
        }
        
        // 7. FLUXO BÁSICO (Outros Tipos)
        else {
            return res.status(200).json({ 
                message: 'Cadastro de Usuário Básico concluído! (Tipo não mapeado).',
                usuarioId: userRecords[0].id
            });
        }
    } 
    catch (error) {
        console.error("Erro no Fluxo de Cadastro:", error.message, error.stack); 
        return res.status(500).json({ 
            message: 'Erro interno ao processar o cadastro. Verifique logs do Vercel.',
            details: error.message,
            code: error.code
        });
    }
};
