// /api/testar-airtable.js

// 1. O import de Airtable é suficiente para JavaScript ESM
import Airtable from 'airtable'; 

// ATENÇÃO: Use AIRTABLE_API_KEY se você não mudou o nome da variável no Vercel. 
// Use AIRTABLE_PERSONAL_ACCESS_TOKEN apenas se você renomeou ela.
const base = new Airtable({ apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN })
  .base(process.env.AIRTABLE_BASE_ID);
  
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

// 2. A função de exportação principal (export default)
export default async function (req, res) { 
    // Validação de entrada para evitar travamento se os campos não existirem
    if (!req.body) {
        return res.status(400).json({ message: 'Dados inválidos na requisição.' });
    }
    
    // Verifique se o método é POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    try {
        const { nome, email } = req.body;

        if (!nome || !email) {
            return res.status(400).json({ message: 'Nome e email são obrigatórios.' });
        }

        // Lógica COMPLETA do Airtable:
        const records = await base(TABLE_NAME).create([
            {
                "fields": {
                    // Mapeie para os NOMES EXATOS das suas colunas no Airtable!
                    "Nome": nome, 
                    "Email": email,
                    "Data do Teste": new Date().toISOString()
                }
            }
        ]);
        
        return res.status(200).json({ 
            message: 'Registro criado com sucesso no Airtable!',
            recordId: records[0].id,
            dataEnviada: { nome, email }
        });

    } catch (error) {
        // Loga o erro no console do Vercel para diagnóstico
        console.error("Erro no Airtable:", error.message, error.stack); 
        
        return res.status(500).json({ 
            message: 'Falha ao comunicar com o Airtable.',
            details: error.message,
            code: error.code // O código do erro do Airtable ajuda no diagnóstico
        });
    }
};