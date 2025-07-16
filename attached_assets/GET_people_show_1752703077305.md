# Pessoas

    GET /api/v2/people/:id


## Descrição
Retorna uma pessoa especifica através do `id` de cadastro.

***

## Autenticação
**[JWT](v1/authentication/POST_tokens.md)**

***

## Parâmetros
  - **id** - código identificador do cadastro

***

## Exemplo
  **Requisição (Auth: JWT)**

      GET https://web.monde.com.br/api/v2/people/3916dd2c-cf12-4791-8b33-f6032f47d739

  **Resposta**

  #### Status de retorno

    200 - Ok

  ``` json
  {
    "data": {
      "id": "3916dd2c-cf12-4791-8b33-f6032f47d739",
      "type": "people",
      "links": {
        "self": "http://web.monde.com.br/api/v2/people/3916dd2c-cf12-4791-8b33-f6032f47d739"
      },
      "attributes": {
        "name": "Raia S.A.",
        "company-name": "da Cunha e Associados",
        "address": "1st Street",
        "number": "899",
        "complement": "Casa",
        "district": "St. John",
        "zip": "89999000",
        "birth-date": "2001-03-31",
        "cpf": null,
        "rg": null,
        "passport-number": null,
        "passport-expiration": null,
        "gender": null,
        "cnpj": "01165424760300",
        "city-inscription": "1234567890",
        "state-inscription": "1234567890",
        "observations": "nothing to note",
        "registered-at": "2021-10-28T16:37:16.521-03:00",
        "business-phone": "49368990000",
        "mobile-phone": "4991782812",
        "phone": "49123456789",
        "email": "elke@ritchie-sanford.co",
        "website": "https://www.site.com.br",
        "code": 118042,
        "kind": "company"
      },
      "relationships": {
        "city": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/people/3916dd2c-cf12-4791-8b33-f6032f47d739/relationships/city",
            "related": "http://web.monde.com.br/api/v2/people/3916dd2c-cf12-4791-8b33-f6032f47d739/city"
          }
        },
        "creator": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/people/3916dd2c-cf12-4791-8b33-f6032f47d739/relationships/creator",
            "related": "http://web.monde.com.br/api/v2/people/3916dd2c-cf12-4791-8b33-f6032f47d739/creator"
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
  - **404** - Registro não encontrado.
  - **422** - Erro de validação (ex.: Cadastro possui vínculo com algum outro cadastro, não permitindo excluir)

