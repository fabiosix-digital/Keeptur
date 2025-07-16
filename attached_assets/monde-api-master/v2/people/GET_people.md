# Pessoas

    GET api/v2/people

## Descrição
Retorna as pessoas cadastradas.

***

## Autenticação
**[JWT](../authentication/POST_tokens.md)**

***

## Parâmetros

  - **filter[search]** -Filtra cadastros de pessoas. Suporta pesquisa pelo `nome`, `razão social`, `cpf`, `cnpj` e `telefone`:

  ```
    GET /api/v2/people?filter[search]=Maria
  ```

  - **filter[only_users]** -  Quando `true` retorna todos as pessoas que são usuários:

  ```
    GET /api/v2/people?filter[only_users]=true
  ```

  - **page[number]** - Navega entre a paginação:

  ```
    GET api/v2/people?page[number]=1
  ```

  - **page[size]** - Sobrescreve o valor padrão(50) de registros por página:

  ```
    GET api/v2/people?page[number]=1&page[size]=5
  ```

  - **sort** - Ordena os resultados por qualquer atributo. Para ordenar em ordem descendente, adicione um hífen (-) antes do campo:

  ```
    GET /api/v2/people?sort=registered-at  # Ordena por data de registro (mais antiga primeiro)
    GET /api/v2/people?sort=-registered-at # Ordena por data de registro (mais recente primeiro)
  ```

***

## Formato de retorno

  Veja [formato completo](../full_format.md#pessoas)

***

## Exemplo
  **Requisição (Auth: JWT)**

    GET https://web.monde.com.br/api/v2/people

  **Resposta**

  #### Status de retorno
    200 - Ok

  ``` json
  {
    "data": [
      {
        "id": "ac4a4562-b7be-460d-b92e-5edb3aec9408",
        "type": "people",
        "links": {
          "self": "http://web.monde.com.br/api/v2/people/ac4a4562-b7be-460d-b92e-5edb3aec9408"
        },
        "attributes": {
          "name": "Ordonhes e Associados",
          "company-name": "Lima S.A.",
          "address": "1st Street",
          "number": "899",
          "complement": "Casa",
          "district": "St. John",
          "zip": "89999000",
          "birth-date": "1986-11-22",
          "cpf": "40414847318",
          "rg": "1234456",
          "passport-number": "86761376254815494020",
          "passport-expiration": "2031-10-28",
          "gender": null,
          "cnpj": null,
          "city-inscription": "1234567890",
          "state-inscription": "1234567890",
          "observations": "nothing to note",
          "registered-at": "2021-10-28T16:37:16.683-03:00",
          "business-phone": "",
          "mobile-phone": "",
          "phone": "4991782812",
          "email": "pasquale_ward@schaefer.com",
          "website": "https://www.site.com.br",
          "code": 118048,
          "kind": "individual"
        },
        "relationships": {
          "city": {
            "links": {
              "self": "http://web.monde.com.br/api/v2/people/ac4a4562-b7be-460d-b92e-5edb3aec9408/relationships/city",
              "related": "http://web.monde.com.br/api/v2/people/ac4a4562-b7be-460d-b92e-5edb3aec9408/city"
            }
          },
          "creator": {
            "links": {
              "self": "http://web.monde.com.br/api/v2/people/ac4a4562-b7be-460d-b92e-5edb3aec9408/relationships/creator",
              "related": "http://web.monde.com.br/api/v2/people/ac4a4562-b7be-460d-b92e-5edb3aec9408/creator"
            }
          }
        }
      },
      {
        "id": "d79b78fd-fe06-4585-8780-0b8286431ec7",
        "type": "people",
        "links": {
          "self": "http://web.monde.com.br/api/v2/people/d79b78fd-fe06-4585-8780-0b8286431ec7"
        },
        "attributes": {
          "name": "Admin",
          "company-name": "Godinho, Nogueira e Marcondes",
          "address": "1st Street",
          "number": "899",
          "complement": "Casa",
          "district": "St. John",
          "zip": "89999000",
          "birth-date": "1967-08-29",
          "cpf": "97387920702",
          "rg": "1234456",
          "passport-number": "36391921889030166268",
          "passport-expiration": "2031-10-28",
          "gender": null,
          "cnpj": null,
          "city-inscription": "1234567890",
          "state-inscription": "1234567890",
          "observations": "nothing to note",
          "registered-at": "2021-10-28T16:37:16.648-03:00",
          "business-phone": "",
          "mobile-phone": "",
          "phone": "4991782812",
          "email": "hisako@weissnat.name",
          "website": "https://www.site.com.br",
          "code": 118046,
          "kind": "individual"
        },
        "relationships": {
          "city": {
            "links": {
              "self": "http://web.monde.com.br/api/v2/people/d79b78fd-fe06-4585-8780-0b8286431ec7/relationships/city",
              "related": "http://web.monde.com.br/api/v2/people/d79b78fd-fe06-4585-8780-0b8286431ec7/city"
            }
          },
          "creator": {
            "links": {
              "self": "http://web.monde.com.br/api/v2/people/d79b78fd-fe06-4585-8780-0b8286431ec7/relationships/creator",
              "related": "http://web.monde.com.br/api/v2/people/d79b78fd-fe06-4585-8780-0b8286431ec7/creator"
            }
          }
        }
      }
    ],
    "links": {
      "first": "http://web.monde.com.br/api/v2/people?page%5Bnumber%5D=1&page%5Bsize%5D=50",
      "last": "http://web.monde.com.br/api/v2/people?page%5Bnumber%5D=1&page%5Bsize%5D=50"
    }
  }
  ```

#### Status de retorno

    200 - Ok

***

## Erros
  Status code:
  - **401** - Não autenticado
