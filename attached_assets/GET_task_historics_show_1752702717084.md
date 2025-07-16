# Histórico de Tarefas

    GET api/v2/task-historics/:id

## Descrição
Retorna uma tarefa especifica através do `id` de cadastro.

***

## Autenticação
**[JWT](../authentication/POST_tokens.md)**

***

## Parâmetros

  - **id** - código identificador do cadastro

***

## Formato de retorno

  Veja [formato completo](v1/full_format.md#historico-de-tarefa)

***

## Exemplo

  **Requisição (Auth: JWT)**

    GET https://web.monde.com.br/api/v2/task-historics/d87ba237-e1f0-407d-ba0c-ce9e9286bd60

  **Resposta**

  #### Status de retorno
    200 - Ok

  ``` json
  {
    "data": {
      "id": "d87ba237-e1f0-407d-ba0c-ce9e9286bd60",
      "type": "task-historics",
      "links": {
        "self": "http://web.monde.com.br/api/v2/task-historics/d87ba237-e1f0-407d-ba0c-ce9e9286bd60"
      },
      "attributes": {
        "date-time": "2021-10-27T00:00:00.000-03:00",
        "text": "First comment",
        "historic": null
      },
      "relationships": {
        "task": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/task-historics/d87ba237-e1f0-407d-ba0c-ce9e9286bd60/relationships/task",
            "related": "http://web.monde.com.br/api/v2/task-historics/d87ba237-e1f0-407d-ba0c-ce9e9286bd60/task"
          }
        },
        "person": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/task-historics/d87ba237-e1f0-407d-ba0c-ce9e9286bd60/relationships/person",
            "related": "http://web.monde.com.br/api/v2/task-historics/d87ba237-e1f0-407d-ba0c-ce9e9286bd60/person"
          }
        }
      }
    }
  }
  ```

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
  - **403** - Não autorizado
  - **404** - Registro não encontrado.
