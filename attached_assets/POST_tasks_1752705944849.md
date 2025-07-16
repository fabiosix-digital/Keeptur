# Tarefa

    POST api/v2/tasks

## Descrição
Cria um cadastro de tarefa.

***

## Autenticação
**[JWT](../authentication/POST_tokens.md)**

***

## Parâmetros
- **type** - *Obrigatório* -	Tipo do recurso. Deve ser informado sempre como `tasks`.
- **attributes[title]** - *Obrigatório* -	Título da tarefa
- **attributes[description]**	Descrição da tarefa
- **attributes[due]** - *Obrigatório* -	Data de vencimento
- **attributes[completed]**	Finaliza a tarefa
- **relationships[category]** - *Obrigatório* -	Categoria da tarefa
- **relationships[assignee]** - *Obrigatório* -	Pessoa responsável pela tarefa
- **relationships[person]**	Pessoa relacionada a tarefa

***

## Exemplo
  **Requisição (Auth: JWT)**

    POST https://web.monde.com.br/api/v2/tasks

  ``` json
  {
    "data": {
      "type": "tasks",
      "attributes": {
        "title": "Task One",
        "description": "Teste",
        "due": "2021-10-30T16:37:15.298-03:00",
        "completed": true
      },
      "relationships": {
        "category": {
          "data": {
            "id": "Geral",
            "type": "task-categories"
          }
        },
        "assignee": {
          "data": {
            "id": "cfc2ebe6-a1a5-42e1-bebf-201ffe87a810",
            "type": "people"
          }
        },
        "person": {
          "data": {
            "id": "28be0205-1eda-4a55-828e-53d4802b1e9c",
            "type": "people"
          }
        }
      }
    }
  }
  ```

  **Resposta**
    
  #### Status de retorno

      201 - Created


  ``` json
  {
    "data": {
      "id": "cdfdbb7c-2f43-429a-87c3-31553370a39a",
      "type": "tasks",
      "links": {
        "self": "http://web.monde.com.br/api/v2/tasks/cdfdbb7c-2f43-429a-87c3-31553370a39a"
      },
      "attributes": {
        "title": "Task One",
        "number": 3675,
        "due": "2021-10-30T16:37:15.298-03:00",
        "visualized": true,
        "completed": true,
        "completed-at": "2021-10-28T16:37:15.314-03:00",
        "registered-at": "2021-10-28T16:37:15.323-03:00",
        "description": "Teste"
      },
      "relationships": {
        "category": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/cdfdbb7c-2f43-429a-87c3-31553370a39a/relationships/category",
            "related": "http://web.monde.com.br/api/v2/tasks/cdfdbb7c-2f43-429a-87c3-31553370a39a/category"
          }
        },
        "person": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/cdfdbb7c-2f43-429a-87c3-31553370a39a/relationships/person",
            "related": "http://web.monde.com.br/api/v2/tasks/cdfdbb7c-2f43-429a-87c3-31553370a39a/person"
          }
        },
        "assignee": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/cdfdbb7c-2f43-429a-87c3-31553370a39a/relationships/assignee",
            "related": "http://web.monde.com.br/api/v2/tasks/cdfdbb7c-2f43-429a-87c3-31553370a39a/assignee"
          }
        },
        "author": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/cdfdbb7c-2f43-429a-87c3-31553370a39a/relationships/author",
            "related": "http://web.monde.com.br/api/v2/tasks/cdfdbb7c-2f43-429a-87c3-31553370a39a/author"
          }
        },
        "task-historics": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/cdfdbb7c-2f43-429a-87c3-31553370a39a/relationships/task-historics",
            "related": "http://web.monde.com.br/api/v2/tasks/cdfdbb7c-2f43-429a-87c3-31553370a39a/task-historics"
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
      "title": "é obrigatório(a)",
      "detail": "category - é obrigatório(a)",
      "code": "100",
      "source": {
        "pointer": "/data/relationships/category"
      },
      "status": "422"
    },
    {
      "title": "não pode ficar em branco",
      "detail": "title - não pode ficar em branco",
      "code": "100",
      "source": {
        "pointer": "/data/attributes/title"
      },
      "status": "422"
    }
  ]
}
```

Status code:
- **401** - Não autenticado
- **403** - Não autorizado
- **422** - Unprocessable Entity.
