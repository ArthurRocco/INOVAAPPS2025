# INOVAAPPS2025 — Chat + Backend (Gemini Proxy)

## Visão Geral

Este projeto consiste em um servidor proxy backend que faz interface com a API Gemini e uma interface de chat frontend. Além do proxy Gemini, o sistema integra um módulo de chamados completo, permitindo a abertura, gestão e acompanhamento de chamados de forma eficiente. O frontend apresenta uma interface responsiva, com design clean e inspirado em padrões Apple-like, proporcionando uma experiência de usuário intuitiva e moderna.

## Funcionalidades Principais

- Chat em tempo real integrado com a API Gemini via proxy seguro.
- Abertura automática e manual de chamados para suporte e acompanhamento.
- Filtros avançados por departamento para organização e priorização dos chamados.
- Integração com banco de dados SQLite para persistência local dos dados.
- Interface de usuário responsiva com animações suaves e design clean.

## Instruções de Configuração

### 1. Clonar o Repositório

```bash
git clone https://github.com/ArthurRocco/INOVAAPPS2025.git
cd INOVAAPPS2025
```

### 2. Instalar Dependências

Navegue até a pasta `BackEnd` e instale as dependências necessárias. Você pode instalar as dependências individualmente:

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

Ou, para maior conveniência, instale todas as dependências principais em um único comando:

```bash
npm install express cors dotenv sqlite3 node-fetch
```

Além disso, para facilitar o desenvolvimento com recarregamento automático, instale a dependência de desenvolvimento `nodemon`:

```bash
npm install --save-dev nodemon
```

> **Nota:** A partir do Node.js 18, o suporte nativo ao `fetch` está incluído, portanto, se você estiver usando Node.js 18 ou superior, não é necessário instalar o `node-fetch`.

> **Importante:** O Bootstrap é carregado via CDN no frontend, portanto não é necessário instalar via npm.

### 3. Executar o Servidor de Desenvolvimento

Inicie o servidor de desenvolvimento com:

```bash
cd BackEnd
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

- **Chamados API**

  - **GET /api/chamados**

    Retorna a lista de chamados, com opção de filtro por departamento via query parameter.

  - **POST /api/chamados**

    Cria um novo chamado com os dados fornecidos.

  - **PUT /api/chamados/:id**

    Atualiza um chamado existente identificado pelo ID.

  - **DELETE /api/chamados/:id**

    Remove um chamado específico pelo ID.

## Arquitetura do Projeto

O projeto é estruturado em duas camadas principais, garantindo separação clara de responsabilidades:

- **FrontEnd**

  Construído com Bootstrap e JavaScript, inclui páginas dedicadas para chat e gerenciamento de chamados. A interface é responsiva, com foco em usabilidade e design clean, garantindo compatibilidade com diferentes dispositivos.

- **BackEnd**

  Desenvolvido em Node.js com Express, o backend gerencia a lógica de negócio, comunicação segura com a API Gemini via proxy, e persistência dos dados utilizando SQLite. Ele também expõe endpoints REST para o gerenciamento dos chamados e do chat.

## Notas de Uso

- Mantenha sua chave de API segura e nunca a exponha no lado do cliente para evitar comprometimento.
- O backend é responsável por toda a comunicação com a API Gemini, garantindo confidencialidade e integridade dos dados.
- Utilize variáveis de ambiente para armazenar segredos e configure cofres seguros sempre que possível.
- Implemente práticas de segurança como validação e sanitização de entradas para proteger contra ataques comuns.
- Planeje a persistência dos dados considerando backups regulares do banco SQLite para evitar perda de informações.
- A arquitetura modular facilita a extensibilidade e manutenção contínua do sistema.

## Checklist de Produção

- Certifique-se de que o arquivo `.env` contendo as chaves de API esteja presente apenas no ambiente de produção e nunca no repositório público.
- Configure logs detalhados para monitoramento e diagnóstico de problemas em produção.
- Implemente monitoramento contínuo dos endpoints de verificação de saúde para garantir alta disponibilidade.
- Realize backups periódicos do banco de dados SQLite para prevenção contra falhas e perda de dados.
- Considere habilitar HTTPS para comunicação segura entre cliente e servidor.
- Teste e valide todas as funcionalidades antes do deploy em ambiente de produção.

---

Obrigado por usar o ChatBot do grupo WebWizards! Se você encontrar algum problema, por favor abra uma issue no repositório.
