# KADEX

**KADEX** é uma Pokédex web moderna, responsiva e interativa, desenvolvida com **HTML, CSS, JavaScript, TailwindCSS** e integração com a **PokéAPI**.

O projeto permite pesquisar Pokémon, golpes, tipos, habilidades e grupos de ovos, além de visualizar informações detalhadas em páginas próprias. Também inclui recursos avançados como análise de fraquezas, vantagens, movimentos, habilidades, egg groups e criação/teste de times Pokémon.

---

## Sobre o projeto

O KADEX foi criado com o objetivo de ser uma Pokédex mais completa e visualmente moderna, oferecendo uma experiência parecida com sites profissionais de consulta Pokémon, mas com uma interface própria, limpa e responsiva.

O usuário pode navegar entre páginas específicas de Pokémon, golpes, tipos, habilidades e grupos de ovos sem perder o contexto da navegação.

---

## Funcionalidades principais

### Pesquisa inteligente

- Pesquisa por nome de Pokémon.
- Pesquisa por número da Pokédex.
- Pesquisa por golpes/moves.
- Suporte a nomes com espaços ou hífens.
  - Exemplo: `ice punch`
  - Exemplo: `ice-punch`
- Autocomplete com sugestões separadas por:
  - Pokémon
  - Movimentos
- Sugestões com imagem, tipo, número e informações rápidas.
- Navegação automática para a página correta:
  - Pokémon: `pokemon.html?name=...`
  - Move: `move.html?name=...`

---

## Página de Pokémon

Cada Pokémon possui uma página própria com informações detalhadas.

### Informações exibidas

- Nome do Pokémon.
- Número na Pokédex.
- Imagem oficial.
- Tipos.
- Altura.
- Peso.
- Status base.
- Habilidades.
- Fraquezas e vantagens.
- Cadeia evolutiva.
- Informações de treinamento.
- Informações de reprodução.
- Lista de movimentos aprendidos.

### Status base

A página mostra os principais status do Pokémon:

- HP
- Attack
- Defense
- Special Attack
- Special Defense
- Speed

Os status são apresentados com barras visuais modernas, facilitando a comparação dos atributos.

---

## Fraquezas e vantagens

A seção de fraquezas e vantagens mostra os multiplicadores de dano recebido por tipo.

Exemplos de multiplicadores:

- `4x`
- `2x`
- `1x`
- `1/2x`
- `1/4x`
- `0x`

Essa área ajuda o usuário a entender rapidamente contra quais tipos o Pokémon é fraco, resistente ou imune.

---

## Habilidades

Cada Pokémon exibe suas habilidades de forma simples e direta.

### Na página do Pokémon

A seção de habilidades mostra:

- Nome da habilidade.
- Indicação se é habilidade oculta.
- Explicação curta da habilidade.

### Página de habilidade

Ao clicar em uma habilidade, o usuário é levado para uma página própria da habilidade.

A página de habilidade exibe:

- Nome da habilidade.
- Efeito resumido.
- Efeito completo.
- Geração em que foi introduzida.
- Pokémon que podem possuir essa habilidade.
- Indicação de habilidade comum ou oculta.

---

## Cadeia evolutiva

A página do Pokémon mostra sua cadeia evolutiva de forma visual.

O usuário pode:

- Ver as evoluções anteriores e futuras.
- Clicar em qualquer Pokémon da cadeia evolutiva.
- Navegar diretamente para a página do Pokémon selecionado.

---

## Reprodução e grupos de ovos

A seção de reprodução mostra informações relacionadas ao breeding do Pokémon.

### Informações de reprodução

- Egg Groups.
- Gender Ratio.
- Egg Cycles.
- Estimativa de passos para chocar.
- Indicadores visuais de gênero.
- Grupos de ovos clicáveis.

### Página de Egg Group

Ao clicar em um grupo de ovos, o usuário acessa uma página específica do grupo.

Essa página mostra:

- Nome do grupo.
- Descrição do grupo.
- Quantidade de Pokémon no grupo.
- Lista de Pokémon participantes.
- Outros grupos relacionados.
- Pokémon com número, sprite, tipos e nome.

---

## Treinamento

A página do Pokémon também apresenta dados úteis de treinamento.

### Informações exibidas

- EV Yield.
- Base Experience.
- Growth Rate.
- Base Friendship.
- Catch Rate.
- Dificuldade de captura.
- Informações úteis para progressão e treinamento.

---

## Página de golpes e moves

Cada golpe possui uma página própria com informações completas.

### Informações exibidas

- Nome do golpe.
- Tipo.
- Categoria:
  - Physical
  - Special
  - Status
- Poder.
- Precisão.
- PP.
- Prioridade.
- Alvo.
- Chance de efeito.
- Geração.
- Descrição.
- Dados de TM/HM/TR quando disponíveis.

---

## Pokémon que aprendem o golpe

Na página de cada move, existe uma seção mostrando os Pokémon que podem aprender aquele golpe.

### Métodos de aprendizado

Os Pokémon são separados por método:

- Level Up
- TM/HM
- Egg
- Tutor
- Evolution

### Melhorias de carregamento

O sistema foi pensado para carregar os Pokémon de forma progressiva, evitando travamentos em golpes que possuem muitos usuários.

Recursos dessa seção:

- Carregamento em lotes.
- Loading visual.
- Evita duplicatas.
- Mostra progresso de análise.
- Cache para melhorar a navegação.
- Mensagem limpa quando nenhum Pokémon aprende por determinado método.

---

## Página de tipos

Ao clicar em qualquer tipo Pokémon, o usuário é levado para uma página específica daquele tipo.

### A página de tipo mostra

- Nome do tipo.
- Descrição.
- Total de Pokémon daquele tipo.
- Vantagens ofensivas.
- Desvantagens ofensivas.
- Resistências defensivas.
- Fraquezas defensivas.
- Imunidades.
- Lista de todos os Pokémon que possuem aquele tipo.

### Relações de dano

A página mostra informações como:

- Golpes desse tipo são super efetivos contra quais tipos.
- Golpes desse tipo causam pouco dano em quais tipos.
- Pokémon desse tipo são fracos contra quais tipos.
- Pokémon desse tipo resistem a quais tipos.
- Pokémon desse tipo são imunes a quais tipos.

---

## Criador e testador de times Pokémon

O KADEX também conta com uma funcionalidade para criar e testar times Pokémon.

### Criador de times

O usuário pode:

- Criar um time com até 6 Pokémon.
- Pesquisar Pokémon para adicionar ao time.
- Visualizar sprite, nome, tipos e status dos membros.
- Remover Pokémon do time.
- Salvar o time localmente usando `localStorage`.

### Análise do time

O sistema analisa a composição do time e mostra informações como:

- Fraquezas defensivas.
- Resistências.
- Imunidades.
- Tipos repetidos.
- Cobertura ofensiva.
- Média dos status base.
- Alertas sobre possíveis problemas do time.

### Exemplos de alertas

- O time possui muitos Pokémon fracos contra Rock.
- O time possui pouca resistência contra Electric.
- O time tem baixa velocidade média.
- O time está muito focado em ataque especial.
- O time possui muitos tipos repetidos.

Essa funcionalidade ajuda o usuário a montar times mais equilibrados e entender melhor a sinergia entre os Pokémon escolhidos.

---

## Navegação entre páginas

O projeto utiliza páginas separadas para melhorar a experiência do usuário.

### Estrutura de navegação

```text
index.html              -> Página inicial e pesquisa
pokemon.html?name=...   -> Página de Pokémon
move.html?name=...      -> Página de golpe
type.html?name=...      -> Página de tipo
egg-group.html?name=... -> Página de grupo de ovos
ability.html?name=...   -> Página de habilidade
team.html               -> Criador/testador de times