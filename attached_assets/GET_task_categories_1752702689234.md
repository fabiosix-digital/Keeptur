# Categorias de Tarefa

    GET api/v2/task-categories

## Descrição
Retorna as categorias de tarefas cadastradas.

***

## Autenticação
**[JWT](../authentication/POST_tokens.md)**

***

## Parâmetros

  - **sort** - Ordena os resultados por qualquer atributo. Para ordenar em ordem descendente, adicione um hífen (-) antes do campo:

  ```
    GET /api/v2/task-categories?sort=description        # Ordena por descrição (A-Z)
    GET /api/v2/task-categories?sort=-description       # Ordena por descrição (Z-A)
  ```

***

## Exemplo
  **Requisição (Auth: JWT)**

    https://web.monde.com.br/api/v2/task-categories

  **Resposta**

  #### Status de retorno

    200 - Ok

  ``` json
  {
    "data": {
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
      "title": "Erro de autenticação",
      "detail": "O token de autenticação fornecido está expirado ou é inválido",
      "code": "401",
      "status": "401"
    }
  ]
}
```
