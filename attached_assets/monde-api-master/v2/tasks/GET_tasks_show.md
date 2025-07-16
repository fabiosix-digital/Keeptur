# Tarefa

    GET api/v2/tasks/:id

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

  Veja [formato completo](v1/full_format.md#tarefas)

***

## Exemplo

  **Requisição (Auth: JWT)**

    GET https://web.monde.com.br/api/v2/tasks/8b33f31e-973d-4648-8bcf-791e33585e34

  **Resposta**

  #### Status de retorno
    200 - Ok

  ``` json
  {
    "data": {
      "id": "8b33f31e-973d-4648-8bcf-791e33585e34",
      "type": "tasks",
      "links": {
        "self": "http://web.monde.com.br/api/v2/tasks/8b33f31e-973d-4648-8bcf-791e33585e34"
      },
      "attributes": {
        "title": "Rerum similique suscipit eveniet.",
        "number": 3668,
        "due": "2021-10-29T00:00:00.000-03:00",
        "visualized": true,
        "completed": false,
        "completed-at": null,
        "registered-at": "2021-10-28T16:37:14.601-03:00"
      },
      "relationships": {
        "category": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/8b33f31e-973d-4648-8bcf-791e33585e34/relationships/category",
            "related": "http://web.monde.com.br/api/v2/tasks/8b33f31e-973d-4648-8bcf-791e33585e34/category"
          }
        },
        "person": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/8b33f31e-973d-4648-8bcf-791e33585e34/relationships/person",
            "related": "http://web.monde.com.br/api/v2/tasks/8b33f31e-973d-4648-8bcf-791e33585e34/person"
          }
        },
        "assignee": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/8b33f31e-973d-4648-8bcf-791e33585e34/relationships/assignee",
            "related": "http://web.monde.com.br/api/v2/tasks/8b33f31e-973d-4648-8bcf-791e33585e34/assignee"
          }
        },
        "author": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/8b33f31e-973d-4648-8bcf-791e33585e34/relationships/author",
            "related": "http://web.monde.com.br/api/v2/tasks/8b33f31e-973d-4648-8bcf-791e33585e34/author"
          }
        },
        "task-historics": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/8b33f31e-973d-4648-8bcf-791e33585e34/relationships/task-historics",
            "related": "http://web.monde.com.br/api/v2/tasks/8b33f31e-973d-4648-8bcf-791e33585e34/task-historics"
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
