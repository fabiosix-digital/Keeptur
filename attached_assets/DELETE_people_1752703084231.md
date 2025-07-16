# Pessoa

    DELETE /api/v2/people/:id

## Descrição
Exclui uma pessoa através do `id` de cadastro.

***

## Autenticação
**[JWT](../authentication/POST_tokens.md)**

***

## Parâmetros

  - **id** - código identificador do cadastro

***

## Exemplo

  **Requisição (Auth: JWT)**
  
    DELETE https://web.monde.com.br/api/v2/people/C73D41F9-EA1E-4A69-8A05-278B15AFC233
 
  **Resposta**
  #### Status de retorno

    204 - No Content

***

## Erros
  Os erros possuem um status code específico, geralmente com alguma mensagem de erro no formato:
  ``` json
  {
    "errors": [
      {
        "title": "Recurso não encontrado", "detail": "Recurso informado não encontrado",
        "code": "404",
        "status": "404"
      }
    ]
  }
  ```

  Status code:
  - **401** - Não autenticado
  - **404** - Registro não encontrado.
  - **422** - Erro de validação (ex.: Cadastro possui vínculo com algum outro cadastro, não permitindo excluir)
