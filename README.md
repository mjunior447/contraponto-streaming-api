
# Contraponto Streaming API - Backend & Transcoder

  

Este é o microsserviço de gerenciamento e transcodificação de vídeo da plataforma **Contraponto Streaming**. A arquitetura foi projetada seguindo os princípios de Clean Architecture e Domain Driven Design (DDD), isolando regras de negócio da infraestrutura externa e garantindo alta performance no processamento de mídia.


Originalmente planejado em um modelo Serverless usando AWS Lambda, o coração do processamento pesado de vídeos foi migrado para uma arquitetura local via script nativo. Essa decisão removeu limitações severas de tempo de execução (Timeout de 15 minutos do Lambda), reduziu custos de computação na nuvem e permitiu o processamento estável de conteúdos longos (vídeos com mais de 1 hora de duração).

  

## Arquitetura do sistema e fluxo de dados

  

O sistema funciona de forma híbrida: o coração do sistema (o transcodificador de vídeos) roda localmente na máquina do administrador, consumindo e integrando os serviços da nuvem AWS (Amazon S3 e Amazon DynamoDB). Enquanto isso, a API em si fica no Render, aguardando requisições do front para a listagem de vídeos que já foram processados e que estejam com a flag READY.


## Como funciona o fluxo de transcodificação

Sempre que um novo vídeo precisa ser adicionado à plataforma, o processo síncrono controlado segue esta ordem:
1. Upload de vídeo: O arquivo bruto `.mp4` é armazenado no Bucket do Amazon S3, especificamente na pasta `raw-uploads/`.

2. Disparo da Automação: O administrador configura as variáveis de identificação do vídeo que vai ser processado (pegando o videoId no S3 ou no DynamoDB) e executa o script local: `node runTranscoder.js`.

3. Download e Cache: O caso de uso (`ProcessVideoHlsUseCase`) busca os metadados iniciais no DynamoDB (onde o status do vídeo consta como `PENDING`), faz o download do fluxo de bytes do `.mp4` original da nuvem e grava um arquivo temporário em disco (`/tmp/{videoId}/input.mp4`).

4. Fatiamento HLS via FFmpeg: O microsserviço dispara um `child_process` utilizando o FFmpeg (`ffmpeg-static`). O vídeo é transcodificado, otimizado com taxa de quadros, fatiado em segmentos contínuos de 6 segundos (`.ts`) e amarrado por um arquivo de manifesto (`playlist.m3u8`), que é quem vai coordenar a reprodução dos segmentos lá no front.

5. Upload em Massa: O backend faz a leitura da pasta de saída e realiza o upload em lote de todos os fragmentos HLS gerados de volta para o S3 sob a estrutura `streams/{videoId}/`.

6. Disponibilização: O status do vídeo no DynamoDB é atualizado para `READY` e o campo `hlsUrl` é injetado com o link definitivo do manifesto.

7. Limpeza: O diretório temporário local é completamente apagado do disco rígido para evitar acúmulo de lixo eletrônico.

8. Uso no front: Ao final do processo, o arquivo de manifesto está disponível publicamente no S3, podendo ser consumido por um cliente

  

## Tecnologias Utilizadas
- Node.js
- Express
- Render para hospedagem da API
- Transcoder FFmpeg via spawn process nativo
- Amazon DynamoDB
- Amazon S3

## Executando localmente

### Pré-requisitos
- Ter o Node.js v20.19 ou superior instalado

### 1 - Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto e preencha os valores das variáveis:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=seu_access_key_aqui
AWS_SECRET_ACCESS_KEY=seu_secret_key_aqui
AWS_DYNAMODB_TABLE_NAME=sua_tabela_do_dynamodb
AWS_S3_BUCKET_NAME=seu_bucket_do_s3
```

### 3 - Instale as dependências
Rode `npm install` na raiz do projeto

### 4 - Envie um vídeo através da API
Você pode enviar via Postman, Insomnia ou outro client, fazendo uma requisição na rota `POST /admin/upload`. Essa requisição é autenticada e deve ser do tipo `form-data`. Configure a requisição assim:
- No `header`, informe o `x-api-key` da API
- No `body`, preencha
	- O `videoTitle`, do tipo TEXT, com o nome do vídeo
	- O `video`, do tipo FILE, com o arquivo .mp4 que vai subir
- Caso tudo dê certo, a API vai retornar uma mensagem informando o videoId e a s3OriginalKey associada. Isso significa que o arquivo de vídeo foi armazenado no seu bucket do S3, na pasta `/raw-uploads`, com formato original .mp4

### 5 - Transcodificação do video para HLS
Para que o vídeo possa ser consumido sem travar o front, é feita a transcodificação, quebrando-o em segmentos de até 6 segundos, com formato `.ts`, sendo esses segmentos orquestrados pelo manifesto `.m3u8`. Para isso, faça:
- Na raiz do projeto, encontre o arquivo `runTranscoder.js`
- Nele, preencha a constante `videoId` com o id do vídeo enviado anteriormente
- Rode o comando `node runTranscoder.js` para iniciar a transcodificação
- Caso tudo dê certo, os arquivos de segmento `.ts` e o manifesto `.m3u8` terão sido gerados e estarão disponíveis publicamente no seu bucket do S3, dentro da pasta `/streams`

### 6 - Rota pública de listagem de vídeos
A rota para listagem de vídeos cadastrados é `GET /videos`