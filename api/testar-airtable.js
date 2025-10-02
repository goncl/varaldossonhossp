// /api/testar-airtable.js

import Airtable from 'airtable'; 

// Inicialize o Airtable (usa as variáveis de ambiente configuradas no Vercel)
const base = new Airtable({ apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN }) 
  .base(process.env.AIRTABLE_BASE_ID);
  
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME; 

// Exportação default para Vercel Serverless Function
export default async function (req, res) { 
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    try {
        // 1. Captura dos novos campos do corpo da requisição
        const { nome, email, senha, tipo } = req.body; 

        if (!nome || !email || !senha || !tipo) {
            return res.status(400).json({ message: 'Nome, email, senha e tipo são obrigatórios.' });
        }

        // 2. Lógica de CRIAÇÃO de registro no Airtable
        const records = await base(TABLE_NAME).create([
            {
                "fields": {
                    // Mapeamento EXATO para as colunas da sua tabela "Usuarios":
                    "Nome": nome,     
                    "Email": email,
                    "Senha": senha,   // Novo campo
                    "Tipo": tipo      // Novo campo
                }
            }
        ]);
        
        // Resposta de sucesso
        return res.status(200).json({ 
            message: 'Registro criado com sucesso no Airtable!',
            recordId: records[0].id,
            dataEnviada: { nome, email, senha, tipo }
        });

    } catch (error) {
        // Loga o erro COMPLETO no console do Vercel
        console.error("Erro na comunicação com Airtable:", error.message, error.stack); 
        
        // Resposta de falha
        return res.status(500).json({ 
            message: 'Falha ao comunicar com o Airtable. Verifique suas chaves/permissões.',
            details: error.message,
            code: error.code
        });
    }
};