# Histórico de Tarefas

    GET api/v2/task-historics

## Descrição
Gerencia os cadastros de históricos de tarefas

***

## Autenticação
**[JWT](../authentication/POST_tokens.md)**

***

## Parâmetros

  - **page** - navega entre a paginação:

  ```
    GET api/v2/task-historics?page[number]=1
  ```

  - **per_page** - Sobrescreve o valor padrão(50) de registros por página:

  ```
    GET api/v2/task-historics?page[number]=1&page[size]=5
  ```

  - **sort** - Ordena os resultados por qualquer atributo. Para ordenar em ordem descendente, adicione um hífen (-) antes do campo:

  ```
    GET /api/v2/task-historics?sort=text             # Ordena por texto do histórico (A-Z)
    GET /api/v2/task-historics?sort=-text            # Ordena por texto do histórico (Z-A)
  ```

***

## Formato de retorno

  Veja [formato completo](../full_format.md#historico-de-tarefa)

***

## Exemplo
  **Requisição (Auth: JWT)**

    GET https://web.monde.com.br/api/v2/task-historics

  **Resposta**

  #### Status de retorno
    200 - Ok

  ``` json
  {
    "data": [
      {
        "id": "006a946e-b40a-419b-8f1e-0ddcb4e988bc",
        "type": "task-historics",
        "links": {
          "self": "http://web.monde.com.br/api/v2/task-historics/006a946e-b40a-419b-8f1e-0ddcb4e988bc"
        },
        "attributes": {
          "date-time": "2021-10-27T00:00:00.000-03:00",
          "text": "First comment",
          "historic": null
        },
        "relationships": {
          "task": {
            "links": {
              "self": "http://web.monde.com.br/api/v2/task-historics/006a946e-b40a-419b-8f1e-0ddcb4e988bc/relationships/task",
              "related": "http://web.monde.com.br/api/v2/task-historics/006a946e-b40a-419b-8f1e-0ddcb4e988bc/task"
            }
          },
          "person": {
            "links": {
              "self": "http://web.monde.com.br/api/v2/task-historics/006a946e-b40a-419b-8f1e-0ddcb4e988bc/relationships/person",
              "related": "http://web.monde.com.br/api/v2/task-historics/006a946e-b40a-419b-8f1e-0ddcb4e988bc/person"
            }
          }
        }
      }
    ],
    "links": {
      "first": "http://web.monde.com.br/api/v2/task-historics?page%5Bnumber%5D=1&page%5Bsize%5D=50",
      "last": "http://web.monde.com.br/api/v2/task-historics?page%5Bnumber%5D=1&page%5Bsize%5D=50"
    }
  }
  ```

***

## Erros
  Status code:
  - **401** - Não autenticado
  - **403** - Não autorizado
