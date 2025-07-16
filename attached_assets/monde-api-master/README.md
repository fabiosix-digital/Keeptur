# API do Monde

##### Se precisar de ajuda, entre em contato pelo canal de [suporte](https://www.monde.com.br/suporte/).

## Sobre a API Versão 2
A API segue 100% a especificação JSON:API. Algumas informações rápidas para facilitar:
* Todas as requisições devem ser feitas para `https://web.monde.com.br/api/v2`
* Atualmente a autenticação é realizada por token (JWT), seguindo a RFC 7591.
* Toda requisição deve ser HTTPS e ter `Content-Type: application/vnd.api+json` adicionado ao Header.

***


## Fazendo uma requisição


O processo se dá em dois passos: **Autenticação** e **Requisição**. Sendo que a Autenticação não precisa ser realizada todo momento, e pode ser realizado apenas quando o token expirar(a cada 1 hora).

##### Passo 1 - Autenticação:

Já que o endpoint da autenticação é [**<code>POST</code> api/v2/tokens**](v2/authentication/POST_tokens.md) Em cURL (para você tentar na sua shell), podemos fazer assim:


```
curl "https://web.monde.com.br/api/v2/tokens" -d '{ "data": {"type": "tokens", "attributes": {"login": "admin@suagencia.monde.com.br","password": "u4K2EJwGFL" } } }' -X POST \
	-H "Accept: application/vnd.api+json" \
	-H "Content-Type: application/vnd.api+json"
```

A resposta da requisição vai parecer com o que está abaixo:

```
{
  "data": {
    "id": "832d21f1-6d54-4322-ae25-93cd4ba749ff",
    "type": "tokens",
    "links": {
      "self": "http://web.monde.com.br/api/v2/tokens/832d21f1-6d54-4322-ae25-93cd4ba749ff"
    },
    "attributes": {
      "login": "admin",
      "token": "TOKEN_DE_ACESSO"
    }
  }
}
```
**PS: Tome nota da chave que está em `TOKEN_DE_ACESSO`**

##### Passo 2 - Requisição:

No nosso exemplo vamos listar todas as pessoas da nossa base.
Sabemos que o endpoint da API para fazer isso é o [**<code>GET</code> api/v2/people**](v2/people/GET_people.md) ([ver todos os endpoints](#endpoints-da-api)) e já temos nosso `TOKEN_DE_ACESSO`


```
export TOKEN_DE_ACESSO="SEU_TOKEN_DE_ACESSO"

curl -g "https://web.monde.com.br/api/v2/people" -X GET \
     -H "Authorization: Bearer $TOKEN_DE_ACESSO" \
     -H "Accept: application/vnd.api+json" \
     -H "Content-Type: application/vnd.api+json"
```

A resposta da requisição vai parecer com o que está abaixo:

```
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
    }
  ],
  "links": {
    "first": "http://web.monde.com.br/api/v2/people?page%5Bnumber%5D=1&page%5Bsize%5D=50",
    "last": "http://web.monde.com.br/api/v2/people?page%5Bnumber%5D=1&page%5Bsize%5D=50"
  }
}
```
 ***


## Erros e Códigos de resposta HTTP


Para análise dos erros da API veja o `código de resposta HTTP`, abaixo alguns códigos mais comuns e possíveis soluções:


- **200**: Tudo está correto.
- **201**: Registro criado com sucesso
- **301**: Redirecionamento (veja se o caminho está correto ou analise a documentação para saber se o seu endpoint não foi alterado)
- **401**: Não autorizado (seu usuário ou senha estão errados ou seu token pode ter expirado)
- **403**: Não permitida essa ação
- **404**: Não encontrado (possivelmente você errou o endpoint, ou algum header do endpoit, ou o registro no eciste)
- **422**: Erro na validação dos dados
- **500**: Algum problema pode estar acontecendo nos nossos servidores, nos avise que tentaremos resolver o mais rápido possível.


Formatos
-----------------------------

- **[Pessoas](v2/full_format.md#pessoas)**
- **[Tarefas](v2/full_format.md#tarefas)**
- **[Históricos de tarefa](v2/full_format.md#histórico-de-tarefa)**
- **[Categorias de Tarefa](v2/full_format.md#categorias-de-tarefa)**
- **[Cidades](v2/full_format.md#cidades)**

Endpoints da API
----------------------------------

> Autenticação

- **[<code>POST</code> api/v2/tokents](v2/authentication/POST_tokens.md)**

> Pessoas
- **[<code>GET</code> people](v2/people/GET_people.md)** - Lista as pessoas
- **[<code>GET</code> people/:id](v2/people/GET_people_show.md)** - Visualiza os dados da pessoa com o ID `:id`
- **[<code>POST</code> people](v2/people/POST_people.md)** - Cria um novo cadastro de pessoa
- **[<code>PATCH</code> people/:id](v2/people/PATCH_people_edit.md)** - Altera o cadastro da pessoa com ID `:id`
- **[<code>DELETE</code> people/:id](v2/people/DELETE_people.md)** - Deleta a pessoa de ID `:id`


> Tarefas
- **[<code>GET</code> tasks](v2/tasks/GET_tasks.md)** - Lista as tarefas
- **[<code>GET</code> tasks/:id](v2/tasks/GET_tasks_show.md)** - Visualiza os dados da tarefa com o ID `:id`
- **[<code>POST</code> tasks](v2/tasks/POST_tasks.md)** - Cria um novo cadastro de tarefa
- **[<code>PATCH</code> tasks/:id](v2/tasks/PATCH_tasks_edit.md)** - Altera o cadastro da tarefa com ID `:id`
- **[<code>DELETE</code> tasks/:id](v2/tasks/DELETE_tasks.md)** - Deleta a tarefa de ID `:id`

> Categorias de Tarefa
- **[<code>GET</code> task-categories](v2/task_categories/GET_task_categories.md)** - Lista as categorias de tarefas
- **[<code>GET</code> task-categories/:id](v2/task_categories/GET_task_categories_show.md)** - Visualiza os dados da categoria com o ID `:id`

> Histórico de Tarefas
- **[<code>GET</code> task-historics](v2/task_historics/GET_task_historics.md)** - Lista o histórico da tarefa
- **[<code>GET</code> task-historics/:id](v2/task_historics/GET_task_historics_show.md)** - Visualiza os dados de um histórico da tarefa com o ID `:id`
- **[<code>POST</code> task-historics](v2/task_historics/POST_task_historics.md)** - Cria um novo cadastro de histórico da tarefa
- **[<code>PATCH</code> task-historics/:id](v2/task_historics/PATCH_task_historics_edit.md)** - Altera o cadastro do histórico da tarefa com ID `:id`
- **[<code>DELETE</code> task-historics/:id](v2/task_historics/DELETE_task_historics.md)** - Deleta o histórico da tarefa de ID `:id`

> Cidades
- **[<code>GET</code> cities](v2/cities/GET_cities.md)** - Lista as Cidades
- **[<code>GET</code> cities/:id](v2/cities/GET_cities_show.md)** - Visualiza os dados da cidade com o ID `:id`
