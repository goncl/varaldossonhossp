import Airtable from 'airtable'; 

const AIRTABLE_PAT = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const base = new Airtable({ apiKey: AIRTABLE_PAT }).base(AIRTABLE_BASE_ID);

export default async function (req, res) { 
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    try {
        const { nome, email, senha, tipo, endereco, telefone } = req.body;

        if (!nome || !email || !senha || !tipo) {
            return res.status(400).json({ message: 'Dados básicos (nome, email, senha, tipo) são obrigatórios.' });
        }
        
        const existingRecords = await base('Usuarios').select(
            {
                filterByFormula: `{Email} = '${email}'`,
                maxRecords: 1,
                view: "Grid view"
            }
        ).firstPage();

        if (existingRecords.length > 0)
        {
            return res.status(409).json({ message: 'Email já cadastrado.' });
        }

        const userRecords = await base('Usuarios').create
        ([
            {
                    "fields": {
                    "Nome": nome,     
                    "Email": email,
                    "Senha": senha,   
                    "Tipo": tipo      
                    }
                }
        ]);

        const novoUsuarioId = userRecords[0].id; 
        if (tipo === 'Doador')
        {
            if (!endereco || !telefone)
            {
                return res.status(400).json({ message: 
                    'Endereço e Telefone são obrigatórios para Doadores.'});
            }

            const doadorRecords = await base('Doadores').create
            ([
                {
                    "fields": {
                        "Endereço": endereco,     
                        "Telefone": telefone,
                        "Usuario": [novoUsuarioId] 
                    }
                }
            ]);
            return res.status(200).json
            ({ 
                message: 'Cadastro de Usuário e Doador concluído!',
                usuarioId: userRecords[0].id,
                doadorId: doadorRecords[0].id
            });
        } 
        else if (tipo === 'PontoDeColeta')
        {
            return res.status(200).json
            ({ 
                message: 'Cadastro de Usuário (Ponto de Coleta) concluído!',
                usuarioId: userRecords[0].id
            });
        }      
        else 
        {
            return res.status(200).json
            ({ 
                message: 'Cadastro de Usuário Básico concluído! (Tipo não mapeado).',
                usuarioId: userRecords[0].id
            });
        }
    } 
    catch (error) 
    {
        console.error("Erro no Fluxo de Cadastro:", error.message, error.stack); 
        return res.status(500).json({ 
            message: 'Erro interno ao processar o cadastro.',
            details: error.message,
            code: error.code
        });
    }
};
