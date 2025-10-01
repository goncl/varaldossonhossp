// api/testar-airtable.js

const Airtable = require('airtable');

// Inicialize o Airtable com as variáveis de ambiente
const base = new Airtable({ apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN })
  .base(process.env.AIRTABLE_BASE_ID);
  
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

module.exports = async (req, res) => {
    // Verifique se o método é POST (esperado do formulário)
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    try {
        const { nome, email } = req.body;

        if (!nome || !email) {
            return res.status(400).json({ message: 'Nome e email são obrigatórios.' });
        }

        // 1. O teste principal: Tentar criar um novo registro no Airtable
        const records = await base(TABLE_NAME).create([
            {
                "fields": {
                    // Mapeie os campos do seu formulário com os nomes exatos das COLUNAS do Airtable
                    "Nome": nome, 
                    "Email": email,
                    "Data do Teste": new Date().toISOString()
                }
            }
        ]);
        
        // 2. Se a requisição for bem-sucedida, retorne o sucesso
        return res.status(200).json({ 
            message: 'Registro criado com sucesso no Airtable!',
            recordId: records[0].id,
            dataEnviada: { nome, email }
        });

    } catch (error) {
        // 3. Se houver erro, retorne a falha com detalhes
        console.error("Erro na comunicação com Airtable:", error);
        return res.status(500).json({ 
            message: 'Falha ao comunicar com o Airtable.',
            details: error.message,
            code: error.code // Ajuda a diagnosticar (ex: AUTHENTICATION_REQUIRED, INVALID_REQUEST_UNKNOWN)
        });
    }
};