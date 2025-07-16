# Cidades

    GET api/v2/cities

## Descrição
Retorna todos os cadastros, paginados em 50 registros

***

## Autenticação
**[JWT](../authentication/POST_tokens.md)**

***

## Parâmetros

  - **filter[search]** - Filtra cadastros de cidades. Suporta pesquisa pelo nome:

  ```
    GET /api/v2/tasks?filter[search]=Amer
  ```

  - **sort** - Ordena os resultados por qualquer atributo. Para ordenar em ordem descendente, adicione um hífen (-) antes do campo:

  ```
    GET /api/v2/cities?sort=name        # Ordena por nome (A-Z)
    GET /api/v2/cities?sort=-name       # Ordena por nome (Z-A)
  ```

***

## Formato de retorno

  Veja [formato completo](../full_format.md#cidades)

***

## Exemplo
  **Requisição (Auth: JWT)**

    GET https://web.monde.com.br/api/v2/cities?filter[search]=Amer

  **Resposta**

  #### Status de retorno
    200 - Ok

  ``` json
  {
    "data": [
      {
        "id": "0884d127-80bf-466f-a0a9-3f0a9f351576",
        "type": "cities",
        "links": {
          "self": "http://web.monde.com.br/api/v2/cities/0884d127-80bf-466f-a0a9-3f0a9f351576"
        },
        "attributes": {
          "name": "Americana",
          "state-acronym": "SP"
        },
        "relationships": {
          "people": {
            "links": {
              "self": "http://web.monde.com.br/api/v2/cities/0884d127-80bf-466f-a0a9-3f0a9f351576/relationships/people",
              "related": "http://web.monde.com.br/api/v2/cities/0884d127-80bf-466f-a0a9-3f0a9f351576/people"
            }
          }
        }
      }
    ],
    "links": {
      "first": "http://web.monde.com.br/api/v2/cities?filter%5Bsearch%5D=Amer&page%5Bnumber%5D=1&page%5Bsize%5D=50",
      "last": "http://web.monde.com.br/api/v2/cities?filter%5Bsearch%5D=Amer&page%5Bnumber%5D=1&page%5Bsize%5D=50"
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