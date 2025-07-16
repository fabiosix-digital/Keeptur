# Tarefas

    GET api/v2/tasks

## Descrição
Retorna as tarefas cadastradas.

***

## Autenticação
**[JWT](../authentication/POST_tokens.md)**

***

## Parâmetros

  - **filter** - Filtra tarefas pelo `título` informado:

  ```
    GET api/v2/tasks?filter[search]=título-da-tarefa
  ```

  - **situation** - Filtra pela situação(`done`: `finalizada`, `open`: `não concluída`):

  ```
    GET api/v2/tasks?filter[situation]=done
  ```

  - **assigned** - Filtra por como o usuário é vinculado a tarefa (`user_tasks`: `tarefas do usuário`,
  `author`: `criada pelo usuário` e `delegated`: `delegadas pelo usuário`):

  ```
    GET api/v2/tasks?filter[assigned]=user_tasks
    GET api/v2/tasks?filter[assigned]=author
    GET api/v2/tasks?filter[assigned]=delegated
  ```

  - **page** - navega entre a paginação:

  ```
    GET api/v2/tasks?page[number]=1
  ```

  - **per_page** - Sobrescreve o valor padrão(50) de registros por página:

  ```
    GET api/v2/tasks?page[number]=1&page[size]=5
  ```

  - **due_until** - Seleciona as tarefas que vencem até aquela data limite, o parâmetro `today` vai demonstrar todas as tarefas que vencem até o fim do dia de hoje

  ```
    GET api/v2/tasks?filter[due_until]=today
  ```

  - **include** - Carrega relacionamentos específicos

  ```
    GET api/v2/tasks?include=assignee,person,category
  ```

  - **fields** - Carrega campos específicos

  ```
    GET api/v2/tasks?fields[people]=name
  ```

  - **sort** - Ordena os resultados por qualquer atributo. Para ordenar em ordem descendente, adicione um hífen (-) antes do campo:

  ```
    GET /api/v2/tasks?sort=title      # Ordena por título (A-Z)
    GET /api/v2/tasks?sort=-title     # Ordena por título (Z-A)
  ```

***

## Formato de retorno

  Veja [formato completo](../full_format.md#tarefas)

***

## Exemplo
  **Requisição (Auth: JWT)**

    GET https://web.monde.com.br/api/v2/tasks?include=assignee,person,category&fields[people]=name

  **Resposta**

  #### Status de retorno
    200 - Ok

  ``` json
  {
    "data": [
      {
        "id": "07971a1b-638f-4d91-a9f1-a947c3192ce1",
        "type": "tasks",
        "links": {
          "self": "http://web.monde.com.br/api/v2/tasks/07971a1b-638f-4d91-a9f1-a947c3192ce1"
        },
        "attributes": {
          "title": "Beatae eaque ad nihil.",
          "number": 106,
          "due": "2021-11-11T15:04:49.398-03:00",
          "visualized": false,
          "completed": false,
          "completed-at": null,
          "registered-at": "2021-11-11T15:04:49.432-03:00"
        },
        "relationships": {
          "category": {
            "links": {
              "self": "http://web.monde.com.br/api/v2/tasks/07971a1b-638f-4d91-a9f1-a947c3192ce1/relationships/category",
              "related": "http://web.monde.com.br/api/v2/tasks/07971a1b-638f-4d91-a9f1-a947c3192ce1/category"
            },
            "data": {
              "type": "task-categories",
              "id": "Geral"
            }
          },
          "person": {
            "links": {
              "self": "http://web.monde.com.br/api/v2/tasks/07971a1b-638f-4d91-a9f1-a947c3192ce1/relationships/person",
              "related": "http://web.monde.com.br/api/v2/tasks/07971a1b-638f-4d91-a9f1-a947c3192ce1/person"
            },
            "data": {
              "type": "people",
              "id": "734a5103-5c11-4053-9897-ab0fb3187997"
            }
          }
        },
        "assignee": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/07971a1b-638f-4d91-a9f1-a947c3192ce1/relationships/assignee",
            "related": "http://web.monde.com.br/api/v2/tasks/07971a1b-638f-4d91-a9f1-a947c3192ce1/assignee"
          },
          "data": {
            "type": "people",
            "id": "dd917eb1-db45-4795-852d-ab41dc324030"
          }
        },
        "author": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/07971a1b-638f-4d91-a9f1-a947c3192ce1/relationships/author",
            "related": "http://web.monde.com.br/api/v2/tasks/07971a1b-638f-4d91-a9f1-a947c3192ce1/author"
          }
        },
        "task-historics": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/tasks/07971a1b-638f-4d91-a9f1-a947c3192ce1/relationships/task-historics",
            "related": "http://web.monde.com.br/api/v2/tasks/07971a1b-638f-4d91-a9f1-a947c3192ce1/task-historics"
          }
        }
      }
    ],
    "included": [
      {
        "id": "Geral",
        "type": "task-categories",
        "links": {
          "self": "http://web.monde.com.br/api/v2/task-categories/Geral"
        },
        "attributes": {
          "description": "Geral"
        },
        "relationships": {
          "tasks": {
            "links": {
              "self": "http://web.monde.com.br/api/v2/task-categories/Geral/relationships/tasks",
              "related": "http://web.monde.com.br/api/v2/task-categories/Geral/tasks"
            }
          }
        }
      },
      {
        "id": "734a5103-5c11-4053-9897-ab0fb3187997",
        "type": "people",
        "links": {
          "self": "http://web.monde.com.br/api/v2/people/734a5103-5c11-4053-9897-ab0fb3187997"
        },
        "attributes": {
          "name": "Maria"
        }
      },
      {
        "id": "dd917eb1-db45-4795-852d-ab41dc324030",
        "type": "people",
        "links": {
          "self": "http://web.monde.com.br/api/v2/people/dd917eb1-db45-4795-852d-ab41dc324030"
        },
        "attributes": {
          "name": "Admin"
        }
      }
    ],
    "links": {
      "first": "http://web.monde.com.br/api/v2/tasks?fields%5Bpeople%5D=name&include=assignee%2Cperson%2Ccategory&page%5Bnumber%5D=1&page%5Bsize%5D=50",
      "last": "http://web.monde.com.br/api/v2/tasks?fields%5Bpeople%5D=name&include=assignee%2Cperson%2Ccategory&page%5Bnumber%5D=1&page%5Bsize%5D=50"
    }
  }
  ```

***

## Erros
  Status code:
  - **401** - Não autenticado
  - **403** - Não autorizado
