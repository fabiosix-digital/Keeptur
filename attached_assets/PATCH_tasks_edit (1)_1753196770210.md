# Tarefa

    PUT api/v2/tasks/:id

## Descrição
Altera um cadastro de tarefa através do `id` de cadastro.

***

## Autenticação
**[JWT](../authentication/POST_tokens.md)**

***

## Parâmetros

- **type** - *Obrigatório* - Tipo do recurso. Deve ser informado sempre como `tasks`.
- **id** - Obrigatório-	ID da tarefa a ser alterada.
- **attributes[title]** - Obrigatório -	Título da tarefa.

***

## Exemplo
  **Requisição (Auth: JWT)**

    PUT https://web.monde.com.br/api/v2/tasks/{C73D41F9-EA1E-4A69-8A05-278B15AFC233}

  ``` json
  {
    "data": {
      "type": "tasks",
      "id": "b65e3b1a-ed86-4827-b916-5ab5ab4cafab",
      "attributes": {
        "title": "Task One"
      }
    }
  }
  ```

  **Resposta**

  #### Status de retorno

    200 - Ok

  ``` json
  {
    "data": {
      "id": "b65e3b1a-ed86-4827-b916-5ab5ab4cafab",
      "type": "tasks",
      "links": {
        "self": "http://web.monde.com.br/api/v2/tasks/b65e3b1a-ed86-4827-b916-5ab5ab4cafab"
      },
      "attributes": {
        "title": "Task One",
        "number": 3669,
        "due": "2021-10-29T00:00:00.000-03:00",
        "visualized": true,
        "completed": false,
        "completed-at": null,
        "registered-at": "2021-10-28T16:37:14.714-03:00"
      },
      "relationships": {
        "category": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/b65e3b1a-ed86-4827-b916-5ab5ab4cafab/relationships/category",
            "related": "http://web.monde.com.br/api/v2/tasks/b65e3b1a-ed86-4827-b916-5ab5ab4cafab/category"
          }
        },
        "person": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/b65e3b1a-ed86-4827-b916-5ab5ab4cafab/relationships/person",
            "related": "http://web.monde.com.br/api/v2/tasks/b65e3b1a-ed86-4827-b916-5ab5ab4cafab/person"
          }
        },
        "assignee": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/b65e3b1a-ed86-4827-b916-5ab5ab4cafab/relationships/assignee",
            "related": "http://web.monde.com.br/api/v2/tasks/b65e3b1a-ed86-4827-b916-5ab5ab4cafab/assignee"
          }
        },
        "author": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/b65e3b1a-ed86-4827-b916-5ab5ab4cafab/relationships/author",
            "related": "http://web.monde.com.br/api/v2/tasks/b65e3b1a-ed86-4827-b916-5ab5ab4cafab/author"
          }
        },
        "task-historics": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/b65e3b1a-ed86-4827-b916-5ab5ab4cafab/relationships/task-historics",
            "related": "http://web.monde.com.br/api/v2/tasks/b65e3b1a-ed86-4827-b916-5ab5ab4cafab/task-historics"
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
      "Título é obrigatório",
      "Categoria é obrigatório"
    ]
  }
  ```

  Status code:
  - **401** - Não autenticado
  - **403** - Não autorizado
  - **422** - Unprocessable Entity.
