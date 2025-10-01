// /api/testar-airtable.js

// Usando sintaxe ES Module para Node.js no Vercel
import Airtable from 'airtable'; 

// Inicialize o Airtable
// ATENÇÃO: Verifique se o nome da sua variável de ambiente no Vercel está correta (ex: AIRTABLE_API_KEY)
const base = new Airtable({ apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN }) 
  .base(process.env.AIRTABLE_BASE_ID);
  
// Importante: Verifique se sua variável de ambiente AIRTABLE_TABLE_NAME está definida como "Usuarios"
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME; 

// Exportação default para Vercel Serverless Function
export default async function (req, res) { 
    // Validação inicial para o método HTTP
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    try {
        const { nome, email } = req.body;

        if (!nome || !email) {
            return res.status(400).json({ message: 'Nome e email são obrigatórios.' });
        }

        // Lógica de CRIAÇÃO de registro no Airtable
        const records = await base(TABLE_NAME).create([
            {
                "fields": {
                    // Mapeamento EXATO para as colunas da sua tabela "Usuarios":
                    "Nome": nome,     
                    "Email": email,
                    // Campos adicionais para o teste (ajuste se você quiser incluir Senha ou Tipo)
                    "Tipo": "Teste Vercel", 
                    "Data do Teste": new Date().toISOString() 
                }
            }
        ]);
        
        // Resposta de sucesso
        return res.status(200).json({ 
            message: 'Registro criado com sucesso no Airtable!',
            recordId: records[0].id,
            dataEnviada: { nome, email }
        });

    } catch (error) {
        // Loga o erro COMPLETO no console do Vercel
        console.error("Erro na comunicação com Airtable:", error.message, error.stack); 
        
        // Resposta de falha
        return res.status(500).json({ 
            message: 'Falha ao comunicar com o Airtable. Verifique suas chaves/permissões.',
            details: error.message,
            code: error.code // O código do erro do Airtable (útil para diagnosticar 401, 403, 422)
        });
    }
};