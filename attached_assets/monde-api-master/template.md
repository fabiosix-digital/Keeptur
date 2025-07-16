# Recurso

    GET

## Descrição

***

## Autenticação
**[JWT](v1/authentication/POST_tokens.md)**

***

## Parâmetros
  Nenhum

***

## Exemplo
  **Requisição**

    https://web.monde.com.br/api/v2/recurso

  **Resposta**

  #### Status de retorno
    200 - Ok

  ``` json
  {
    "recurso": {
      "campo_1" : "valor"
    }
  }
  ```
  
***

## Erros
  Status code:
  - **401** - Não autenticado
  - **403** - Não permitido
  - **404** - Não encontrado