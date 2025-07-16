# Histórico de Tarefas

    PATCH /api/v2/task-historics/:id

## Descrição
Alteração do histórico de uma tarefa.

***

## Autenticação
**[JWT](v1/authentication/POST_tokens.md)**

***

## Parâmetros
- **type** - *Obrigatório* - Tipo do recurso. Deve ser informado sempre como `task-historics`.
- **id** - *Obrigatório* - ID do histórico de tarefa a ser alterada.
- **attributes[text]** - Mensagem de histórico.

***

## Exemplo
  **Requisição (Auth: JWT)**

    PATCH https://web.monde.com.br/api/v2/task-historics/686ada72-be9b-42ad-8f1c-68d0b85985b1

  ``` json
  {
    "data": {
      "type": "task-historics",
      "id": "686ada72-be9b-42ad-8f1c-68d0b85985b1",
      "attributes": {
        "text": "First comment edited"
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
      "id": "686ada72-be9b-42ad-8f1c-68d0b85985b1",
      "type": "task-historics",
      "links": {
        "self": "http://web.monde.com.br/api/v2/task-historics/686ada72-be9b-42ad-8f1c-68d0b85985b1"
      },
      "attributes": {
        "date-time": "2021-10-27T00:00:00.000-03:00",
        "text": "First comment edited",
        "historic": null
      },
      "relationships": {
        "task": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/task-historics/686ada72-be9b-42ad-8f1c-68d0b85985b1/relationships/task",
            "related": "http://web.monde.com.br/api/v2/task-historics/686ada72-be9b-42ad-8f1c-68d0b85985b1/task"
          }
        },
        "person": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/task-historics/686ada72-be9b-42ad-8f1c-68d0b85985b1/relationships/person",
            "related": "http://web.monde.com.br/api/v2/task-historics/686ada72-be9b-42ad-8f1c-68d0b85985b1/person"
          }
        }
      }
    }
  }
  ```

***

## Erros
  Status code:
  - **401** - Não autenticado
  - **403** - Não permitido
  - **404** - Não encontrado

***
