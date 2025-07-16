# Histórico de Tarefas

    POST /api/v2/task-historics

## Descrição
Registar um histórico de tarefa

***

## Autenticação
**[JWT](v1/authentication/POST_tokens.md)**

***

## Parâmetros
- **type** - *Obrigatório* - Tipo do recurso. Deve ser informado sempre como `task-historics`.
- **relationships[task]**	- *Obrigatório* - Tarefa que o histórico é vinculado.
- **attributes[text]** - Mensagem de histórico.

## Exemplo
  **Requisição (Auth: JWT)**

    POST https://web.monde.com.br/api/v2/task-historics

  ``` json
  {
    "data": {
      "type": "task-historics",
      "attributes": {
        "text": "First comment"
      },
      "relationships": {
        "task": {
          "data": {
            "id": "0d12f348-1148-470a-81bc-b30e27fc5bf2",
            "type": "tasks"
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
      "id": "1793cc8f-4253-4486-ba93-51d2a7b3d7ac",
      "type": "task-historics",
      "links": {
        "self": "http://web.monde.com.br/api/v2/task-historics/1793cc8f-4253-4486-ba93-51d2a7b3d7ac"
      },
      "attributes": {
        "date-time": "2021-10-28T16:37:17.354-03:00",
        "text": "First comment",
        "historic": null
      },
      "relationships": {
        "task": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/task-historics/1793cc8f-4253-4486-ba93-51d2a7b3d7ac/relationships/task",
            "related": "http://web.monde.com.br/api/v2/task-historics/1793cc8f-4253-4486-ba93-51d2a7b3d7ac/task"
          }
        },
        "person": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/task-historics/1793cc8f-4253-4486-ba93-51d2a7b3d7ac/relationships/person",
            "related": "http://web.monde.com.br/api/v2/task-historics/1793cc8f-4253-4486-ba93-51d2a7b3d7ac/person"
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

## Formato do erro de validação
Caso algum erro de validação ocorra, será retornado no seguinte formato:

``` json
{
  "errors": [
    {
      "title": "não pode ficar em branco",
      "detail": "name - não pode ficar em branco",
      "code": "100",
      "source": {
        "pointer": "/data/attributes/name"
      },
      "status": "422"
    },
    {
      "title": "não pode ficar em branco",
      "detail": "kind - não pode ficar em branco",
      "code": "100",
      "source": {
        "pointer": "/data/attributes/kind"
      },
      "status": "422"
    }
  ]
}
```
Status code de erro de validação: `422 Unprocessable Entity`
