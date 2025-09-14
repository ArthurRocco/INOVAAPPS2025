# INOVAAPPS2025 — Chat + Backend (Gemini Proxy)

## Visão Geral

Este projeto consiste em um servidor proxy backend que faz interface com a API Gemini e uma interface de chat frontend. O backend lida com as requisições da API de forma segura, enquanto o frontend oferece uma experiência de chat amigável ao usuário.

## Instruções de Configuração

### 1. Clonar o Repositório

```bash
git clone https://github.com/ArthurRocco/INOVAAPPS2025.git
cd INOVAAPPS2025
```

### 2. Instalar Dependências

Navegue até a pasta `BackEnd` e instale as dependências necessárias:

```bash
cd BackEnd

# Dependências principais
npm install express
npm install cors
npm install dotenv
npm install sqlite3

# Se você estiver usando Node.js versão < 18, instale também:
npm install node-fetch
```

### 3. Executar o Servidor de Desenvolvimento

Inicie o servidor de desenvolvimento com:

```bash
cd Backend
npm run dev
```

O backend irá servir o frontend automaticamente.

### 4. Acessar a Aplicação

Abra o seu navegador e acesse:

```
http://localhost:3000
```

Você deverá ver a interface de chat pronta para uso.

## Endpoints da API

- **POST /api/gemini-chat**

  Este é o endpoint proxy principal para requisições de chat para a API Gemini.

- **GET /api/health** ou **GET /health**

  Endpoints de verificação de saúde para conferir o status do servidor.

## Notas de Uso

- Mantenha sua chave de API segura e **não a exponha no lado do cliente**.
- O backend gerencia toda a comunicação com a API Gemini, garantindo que sua chave permaneça confidencial.
- O frontend se comunica apenas com o proxy backend.

## Checklist de Produção

- Certifique-se de que o arquivo `.env` com a chave de API esteja presente apenas no servidor de produção.
- Use variáveis de ambiente ou cofres seguros para gerenciar segredos.
- Considere configurar HTTPS para comunicação segura.
- Monitore os endpoints de verificação de saúde para manter a disponibilidade.

---

Obrigado por usar o ChatBot do grupo WebWizards! Se você encontrar algum problema, por favor abra uma issue no repositório.

git checkout main
git fetch origin
git merge origin/main
