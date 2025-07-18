# Cidades

    GET api/v2/cities/:id

## Descrição
Busca um cadastro através do seu código identificador(id)

***

## Autenticação
**[JWT](../authentication/POST_tokens.md)**

***

## Parâmetros

  - **id** - código identificador do cadastro

***

## Formato de retorno

  Veja [formato completo](../full_format.md#cidades)

***

## Exemplo

  **Requisição (Auth: JWT)**

    GET https://web.monde.com.br/api/v2/cities/ab1ea4f9-21a9-4d0f-b630-dc1dbc94dc6f
  **Resposta**

  #### Status de retorno
    200 - Ok

  ``` json
  {
    "data": {
      "id": "ab1ea4f9-21a9-4d0f-b630-dc1dbc94dc6f",
      "type": "cities",
      "links": {
        "self": "http://web.monde.com.br/api/v2/cities/ab1ea4f9-21a9-4d0f-b630-dc1dbc94dc6f"
      },
      "attributes": {
        "name": "Americana",
        "state-acronym": "SP"
      },
      "relationships": {
        "people": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/cities/ab1ea4f9-21a9-4d0f-b630-dc1dbc94dc6f/relationships/people",
            "related": "http://web.monde.com.br/api/v2/cities/ab1ea4f9-21a9-4d0f-b630-dc1dbc94dc6f/people"
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