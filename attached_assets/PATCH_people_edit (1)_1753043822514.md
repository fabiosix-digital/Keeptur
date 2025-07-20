# Pessoas

    PATCH /api/v2/people/:id

## Descrição
Alteração de uma Pessoa.

***

## Autenticação
**[JWT](v1/authentication/POST_tokens.md)**

***

## Parâmetros
- **type** - *Obrigatório* - Tipo do recurso e deve ser sempre <code>people</code>.
- **id** - *Obrigatório* - ID da pessoa a ser alterada.
- **attributes[name]** - Nome completo da pessoa.

***

## Exemplo
  **Requisição (Auth: JWT)**

    PATCH https://web.monde.com.br/api/v2/people/017041aa-417c-4290-80d4-54afd639c8b5

  ``` json
  {
    "data": {
      "type": "people",
      "id": "017041aa-417c-4290-80d4-54afd639c8b5",
      "attributes": {
        "name": "John Dohn"
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
      "id": "017041aa-417c-4290-80d4-54afd639c8b5",
      "type": "people",
      "links": {
        "self": "http://web.monde.com.br/api/v2/people/017041aa-417c-4290-80d4-54afd639c8b5"
      },
      "attributes": {
        "name": "John Dohn",
        "company-name": "Pinto-Roseira",
        "address": "1st Street",
        "number": "899",
        "complement": "Casa",
        "district": "St. John",
        "zip": "89999000",
        "birth-date": "1996-02-04",
        "cpf": "29470836871",
        "rg": "1234456",
        "passport-number": "15689197751540439444",
        "passport-expiration": "2031-10-28",
        "gender": null,
        "cnpj": null,
        "city-inscription": "1234567890",
        "state-inscription": "1234567890",
        "observations": "nothing to note",
        "registered-at": "2021-10-28T16:37:16.068-03:00",
        "business-phone": "",
        "mobile-phone": "",
        "phone": "4991782812",
        "email": "erlene@cole-herzog.net",
        "website": "https://www.site.com.br",
        "code": 118028,
        "kind": "individual"
      },
      "relationships": {
        "city": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/people/017041aa-417c-4290-80d4-54afd639c8b5/relationships/city",
            "related": "http://web.monde.com.br/api/v2/people/017041aa-417c-4290-80d4-54afd639c8b5/city"
          }
        },
        "creator": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/people/017041aa-417c-4290-80d4-54afd639c8b5/relationships/creator",
            "related": "http://web.monde.com.br/api/v2/people/017041aa-417c-4290-80d4-54afd639c8b5/creator"
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

### Formato do erro de validação
Caso algum erro de validação ocorra, será retornado no seguinte formato:

```
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
    }
  ]
}
```
Status code de erro de validação: `422 Unprocessable Entity`
