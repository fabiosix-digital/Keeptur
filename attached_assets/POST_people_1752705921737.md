# Pessoas

    POST /api/v2/people

## Descrição
Cadastrar uma nova Pessoa.
***

## Autenticação
**[JWT](v1/authentication/POST_tokens.md)**

***

## Parâmetros
- **type** - *Obrigatório* - Tipo do recurso e deve ser sempre <code>people</code>.
- **attributes[name]** - *Obrigatório* - Nome completo da pessoa.
- **attributes[company-name]**	Razão social.
- **attributes[address]**	Endereço
- **attributes[number]**	Número do endereço
- **attributes[complement]**	Complemento do endereço
- **attributes[district]**	Bairro
- **attributes[zip]**	CEP
- **attributes[birth-date]**	Data de nascimento
- **attributes[cpf]**	Documento de identificação da pessoa CPF(Fisica).
- **attributes[cnpj]**	Documento de identificação da pessoa CNPJ(Jurídica).
- **attributes[rg]**	Carteira de identidade
- **attributes[passport-number]**	Número do passaporte
- **attributes[passport-expiration]**	Data de validade do passaporte
- **attributes[gender]**	Sexo
- **attributes[business-phone]**	Telefone comercial
- **attributes[mobile-phone]**	Telefone celular
- **attributes[state-inscription]**	Inscrição estadual
- **attributes[city-inscription]**	Inscrição municipal
- **attributes[phone]**	Telefone de contato do pessoa.
- **attributes[email]**	E-mail de contato.
- **attributes[website]**	Web site
- **attributes[observations]**	Observações
- **attributes[kind]** - *Obrigatório* - Tipo da pessoa: J - Pessoa Juridica, F - Pessao Física.
- **relationships[city]**	Cidade em que reside.

## Exemplo
  **Requisição (Auth: JWT)**

    POST https://web.monde.com.br/api/v2/tasks

  ``` json
  {
    "data": {
      "type": "people",
      "attributes": {
        "name": "John Dohn",
        "company-name": "Company One",
        "address": "1st street",
        "number": "number",
        "complement": "Casa",
        "district": "St. John Island",
        "zip": "89123-000",
        "birth-date": "2011-10-28T16:37:16.404-02:00",
        "cpf": "44840254850",
        "cnpj": "",
        "rg": "3.890.345",
        "passport-number": "",
        "passport-expiration": "",
        "gender": "",
        "business-phone": "",
        "mobile-phone": "",
        "state-inscription": "",
        "city-inscription": "",
        "phone": "+55 49 91342211",
        "email": "john.dohn@mail.com",
        "website": "http://www.mysite.com.br",
        "observations": "",
        "kind": "F"
      },
      "relationships": {
        "city": {
          "data": {
            "id": "fe81d6cd-8858-4b7f-95f1-6e3786f15338",
            "type": "cities"
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
      "id": "ad6d0343-352e-429b-80e5-4a6c6cd7dfe8",
      "type": "people",
      "links": {
        "self": "http://web.monde.com.br/api/v2/people/ad6d0343-352e-429b-80e5-4a6c6cd7dfe8"
      },
      "attributes": {
        "name": "John Dohn",
        "company-name": "Company One",
        "address": "1st street",
        "number": "number",
        "complement": "Casa",
        "district": "St. John Island",
        "zip": "89123000",
        "birth-date": "2011-10-28",
        "cpf": "44840254850",
        "rg": "3.890.345",
        "passport-number": "",
        "passport-expiration": null,
        "gender": "",
        "cnpj": null,
        "city-inscription": "",
        "state-inscription": "",
        "observations": "",
        "registered-at": "2021-10-28T16:37:16.423-03:00",
        "business-phone": "",
        "mobile-phone": "",
        "phone": "+554991342211",
        "email": "john.dohn@mail.com",
        "website": "http://www.mysite.com.br",
        "code": 118038,
        "kind": "individual"
      },
      "relationships": {
        "city": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/people/ad6d0343-352e-429b-80e5-4a6c6cd7dfe8/relationships/city",
            "related": "http://web.monde.com.br/api/v2/people/ad6d0343-352e-429b-80e5-4a6c6cd7dfe8/city"
          }
        },
        "creator": {
          "links": {
            "self": "http://web.monde.com.br/api/v2/people/ad6d0343-352e-429b-80e5-4a6c6cd7dfe8/relationships/creator",
            "related": "http://web.monde.com.br/api/v2/people/ad6d0343-352e-429b-80e5-4a6c6cd7dfe8/creator"
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
