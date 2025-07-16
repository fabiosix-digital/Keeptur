# Histórico de Tarefas

    DELETE /api/v2/task-historics/:id

## Descrição
Excluir histórico de tarefa pelo `id`.

***

## Autenticação
**[JWT](../authentication/POST_tokens.md)**

***

## Parâmetros

  - **id** - ID do histórico de tarefa a ser excluído.

***

## Exemplo

  **Requisição (Auth: JWT)**
  
    DELETE https://web.monde.com.br/api/v2/task-historics/69d4e8ce-0c27-4ced-84e8-265580a21224
 
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
