export default defineNuxtConfig({
  modules: [
    '../src/module',
  ],
  devtools: { enabled: true },
  compatibilityDate: '2025-04-20',

  arpixDataTable: {
    perPage: 10,
    paginationType: 'client',
    searchable: true,
    theme: 'default',
    debug: false,
    // Example of global theme variables configuration
    themeVars: {
      // Uncomment to apply these theme variables globally
      // 'primary-color': '#8b5cf6',       // Purple instead of default blue
      // 'header-background': '#f5f3ff',   // Light purple background for header
      // 'header-text-color': '#6d28d9',   // Dark purple text for header
      // 'border-color': '#e9d5ff',        // Light purple border
      // 'hover-color': '#faf5ff',         // Very light purple for row hover
    },
    i18n: {
      enabled: true,
      defaultLocale: 'en', // Default locale, will be overridden by cookie if available
      messages: {
        // Custom translations
        pt: {
          // Portuguese translations
          'pagination.itemsPerPage': '{count} por página',
          'pagination.of': 'de',
          'pagination.nextPage': 'Próxima página',
          'pagination.previousPage': 'Página anterior',
          'pagination.firstPage': 'Primeira página',
          'pagination.lastPage': 'Última página',
          'search.placeholder': 'Pesquisar...',
          'search.clear': 'Limpar pesquisa',
          'filters.title': 'Filtros ativos:',
          'filters.clearAll': 'Limpar tudo',
          'filters.apply': 'Aplicar',
          'filters.clear': 'Limpar',
          'filters.contains': 'Contém',
          'filters.equals': 'Igual a',
          'filters.notEquals': 'Diferente de',
          'filters.startsWith': 'Começa com',
          'filters.endsWith': 'Termina com',
          'filters.greaterThan': 'Maior que',
          'filters.greaterThanOrEquals': 'Maior ou igual a',
          'filters.lessThan': 'Menor que',
          'filters.lessThanOrEquals': 'Menor ou igual a',
          'filters.after': 'Depois de',
          'filters.before': 'Antes de',
          'filters.between': 'Entre',
          'filters.in': 'em',
          'filters.select': '-- Selecionar --',
          'filters.filterValue': 'Valor do filtro...',
          'filters.column': 'Filtrar coluna',
          'filters.active': 'Filtro ativo',
          'filters.remove': 'Clique para remover filtro',
          'filters.reload': 'Recarregar opções',
          'empty.noData': 'Nenhum dado disponível',
          'loading': 'Carregando...',
          'boolean.true': 'Sim',
          'boolean.false': 'Não',
          'actions.edit': 'Editar',
          'actions.delete': 'Excluir',
          'actions.view': 'Visualizar',
          'viewModes.table': 'Visualização de tabela',
          'viewModes.card': 'Visualização de cartão',
        },
      },
    },
  },
})
