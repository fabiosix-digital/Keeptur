# Formatos

## Pessoas
- **id** - Código identificador da pessoa, **guid**
- **name** - Nome completo da pessoa, **string**
- **city** - Cidade em que reside., **relationship**
- **company-name** - Razão social, **string**
- **address** - Endereço, **string**
- **number** - Número do endereço, **string**
- **complement** - Complemento do endereço, **string**
- **district** - Bairro, **string**
- **zip** - CEP, **string**
- **birth-date** - Data de nascimento, **date**
- **cpf** - CPF, **string**
- **rg** - RG, **string**
- **passport-number** - Número do passaporte, **string**
- **passport-expiration** - Data vencimento do passaporte, **date**
- **gender** - sexo, **string**
- **cnpj** - CNPJ, **string**
- **city-inscription** - Inscrição municipal, **string**
- **state-inscription** - Inscrição estadual, **string**
- **observations** - Observações, **string**
- **registered_at** - Data de registro, **timestamp**
- **business-phone** - Telefone comercial, **string**
- **mobile-phone** - Telefone celular, **string**
- **phone** - Telefone de contato da pessoa, **string**
- **email** - E-mail de contato, **string**
- **website** - Web site, **string**
- **code** - Código, **string**
- **kind** - Tipo de cadastro, **string**

## Tarefas
- **id** - Código identificador da tarefa, **guid**
- **title** - Título da tarefa, **string**
- **number** - Numeração sequêncial da tarefa, **integer**
- **due** - Data de vencimento, **timestamp**
- **visualized** - Tarefa foi visualizada pelo responsável, **boolean**
- **completed-at** - Data de conclusão, **timestamp**
- **registered-at** - Data de cadastro, **timestamp**
- **category** - Categoria
  - **links**
    - **self** - Link para o próprio relacionamento, **link**
    - **related** - Link para o recurso relacionado, **link**
- **assignee** - Responsável da tarefa
  - **links**
    - **self** - Link para o próprio relacionamento, **link**
    - **related** - Link para o recurso relacionado, **link**
- **person** - Pessoa relacionada a tarefa
  - **links**
    - **self** - Link para o próprio relacionamento, **link**
    - **related** - Link para o recurso relacionado, **link**
- **author** - Pessoa que criou a tarefa
  - **links**
    - **self** - Link para o próprio relacionamento, **link**
    - **related** - Link para o recurso relacionado, **link**
- **task-historics** - Histórico da tarefa
  - **links**
    - **self** - Link para o próprio relacionamento, **link**
    - **related** - Link para o recurso relacionado, **link**

## Categorias de Tarefa
- **description** - Descrição da categoria, **string**
- **tasks** - Tarefas relacionada a categoria
  - **links**
    - **self** - Link para o próprio relacionamento, **link**
    - **related** - Link para o recurso relacionado, **link**

## Histórico de tarefa
- **id** - Código identificador do histórico da tarefa, **guid**
- **task_id** - Código identificador da tarefa, **guid**
- **date-time** - Momento do histórico, **timestamp**
- **text** - Mensagem de histórico, **string**
- **historic** - Registro do contéudo alterado na tarefa, **string**
- **task** - Tarefa relacionada ao histórico da tarefa
  - **links**
    - **self** - Link para o próprio relacionamento, **link**
    - **related** - Link para o recurso relacionado, **link**
- **person** - Pessoa relacionada a histórico da tarefa
  - **links**
    - **self** - Link para o próprio relacionamento, **link**
    - **related** - Link para o recurso relacionado, **link**

## Cidades
- **id** - Código da venda, **uuid**
- **name** - Nome da cidade, **string**
- **people** - Pessoas relacionadas a cidade
  - **links**
    - **self** - Link para o próprio relacionamento, **link**
    - **related** - Link para o recurso relacionado, **link**
