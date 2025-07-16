# Tarefa

    DELETE api/v2/tasks/:id

## Descrição
Excluí uma tarefa através do `id` de cadastro.

***

## Autenticação
**[JWT](../authentication/POST_tokens.md)**

***

## Parâmetros

  - **id** - código identificador do cadastro

***

## Exemplo

  **Requisição (Auth: JWT)**

    DELETE https://web.monde.com.br/api/v2/tasks/C73D41F9-EA1E-4A69-8A05-278B15AFC233

  #### Status de retorno

    204 - No Content
    
***

## Erros
  Os erros possuem um status code específico, geralmente com alguma mensagem de erro no formato:
  ``` json
  {
    "errors": [
      "Registro não encontrado"
    ]
  }
  ```

  Status code:
  - **401** - Não autenticado
  - **403** - Não autorizado
  - **404** - Registro não encontrado.
