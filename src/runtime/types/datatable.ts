/**
 * Represents a column in the data table
 */
export interface TableColumn {
  /**
   * Unique identifier for the column, used for data binding
   */
  key: string;

  /**
   * Display label for the column header
   */
  label: string;

  /**
   * Whether the column is sortable
   * @default false
   */
  sortable?: boolean;

  /**
   * Whether the column is filterable
   * @default false
   */
  filterable?: boolean;

  /**
   * Data type of the column
   * @default 'text'
   */
  type?: 'text' | 'number' | 'date' | 'boolean' | 'relation' | 'custom';

  /**
   * Possible values for enum/status fields
   * Used for generating filter options
   */
  enumValues?: string[];

  /**
   * Function to format the cell value before display
   * Note: This will only work on the client-side
   */
  format?: any; // (value: any, row: any) => string | any

  /**
   * Configuration for relation columns
   */
  relation?: {
    /**
     * Name of the related table/entity
     */
    table: string;

    /**
     * Field to display from the related entity
     */
    displayField: string;

    /**
     * Foreign key field in the current table
     */
    foreignKey: string;
  };

  /**
   * Width of the column (CSS value)
   * @example '200px', '20%'
   */
  width?: string;

  /**
   * CSS class to apply to the column
   */
  class?: string;

  /**
   * Whether the column is visible
   * @default true
   */
  visible?: boolean;

  /**
   * Custom renderer component name
   */
  renderer?: string;
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  /**
   * Field to filter on
   */
  field: string;

  /**
   * Operator for filtering
   */
  operator?: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'contains' | 'startsWith' | 'endsWith' | 'in';

  /**
   * Value to filter by
   */
  value: any;
}

/**
 * Set of filters
 */
export interface FilterSet {
  [key: string]: FilterConfig | any;
}

/**
 * Configuration for related data
 */
export interface RelationConfig {
  /**
   * Name of the relation
   */
  name: string;

  /**
   * Target table/entity
   */
  target: string;

  /**
   * Local key in the current table
   */
  localKey?: string;

  /**
   * Foreign key in the related table
   */
  foreignKey?: string;

  /**
   * Type of relation
   */
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';

  /**
   * Fields to select from the related entity
   */
  select?: string[];

  /**
   * Whether to load the relation eagerly
   * @default false
   */
  eager?: boolean;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  /**
   * Field to sort by
   */
  field: string;

  /**
   * Sort direction
   */
  direction: 'asc' | 'desc';
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /**
   * Current page number (1-based)
   */
  page: number;

  /**
   * Number of items per page
   */
  perPage: number;

  /**
   * Total number of items
   */
  total?: number;
}

/**
 * Main configuration for the data table
 */
export interface TableConfig {
  /**
   * Columns configuration
   */
  columns: TableColumn[];

  /**
   * Data source - can be an array, URL, or object
   * Note: Function data sources are only supported on the client-side
   */
  dataSource: string | object | any[];

  /**
   * Number of items per page
   * @default 10
   */
  perPage?: number;

  /**
   * Whether search functionality is enabled
   * @default true
   */
  searchable?: boolean;

  /**
   * Pagination type
   * @default 'client'
   */
  pagination?: 'client' | 'server';

  /**
   * Filters configuration
   */
  filters?: FilterSet;

  /**
   * Relations configuration
   */
  relations?: RelationConfig[];

  /**
   * Initial sort configuration
   */
  initialSort?: SortConfig;

  /**
   * Whether row selection is enabled
   * @default false
   */
  selectable?: boolean;

  /**
   * CSS class for the table
   */
  tableClass?: string;

  /**
   * Theme name
   * @default 'default'
   */
  theme?: string;

  /**
   * Custom theme variables
   */
  themeVars?: Record<string, string>;

  /**
   * Whether to show the table header
   * @default true
   */
  showHeader?: boolean;

  /**
   * Whether to show the table footer
   * @default true
   */
  showFooter?: boolean;

  /**
   * Whether to show the pagination controls
   * @default true
   */
  showPagination?: boolean;

  /**
   * Whether to show the search input
   * @default true
   */
  showSearch?: boolean;

  /**
   * Custom loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Custom error message
   */
  error?: string;

  /**
   * Text to display when there are no results
   * @default 'No data available'
   */
  noDataText?: string;
}

/**
 * Table state interface
 */
export interface TableState {
  /**
   * Current data items
   */
  items: any[];

  /**
   * Loading state
   */
  loading: boolean;

  /**
   * Error message
   */
  error: string | null;

  /**
   * Current pagination state
   */
  pagination: PaginationConfig;

  /**
   * Current sort state
   */
  sort: SortConfig | null;

  /**
   * Current filters
   */
  filters: FilterSet;

  /**
   * Current search query
   */
  searchQuery: string;

  /**
   * Selected rows
   */
  selected: any[];

  /**
   * Cached relations data
   */
  relationsCache: Record<string, any>;
}

/**
 * Table engine service options
 */
export interface TableEngineOptions {
  /**
   * Data source type
   */
  driver?: 'array' | 'rest' | 'graphql' | 'sql';

  /**
   * Base URL for REST API
   */
  baseUrl?: string;

  /**
   * Authentication token
   */
  token?: string;

  /**
   * Custom headers
   */
  headers?: Record<string, string>;

  /**
   * Custom fetch options
   */
  fetchOptions?: RequestInit;
}

/**
 * Pre-defined formatters
 */
export interface FormattersConfig {
  /**
   * Currency formatter options
   */
  currency?: {
    /**
     * Currency code (USD, EUR, etc.)
     */
    format: string;

    /**
     * Locale for formatting
     * @default 'en-US'
     */
    locale?: string;

    /**
     * Number of decimal places
     * @default 2
     */
    decimals?: number;
  };

  /**
   * Date formatter options
   */
  date?: {
    /**
     * Date format
     * @default 'MM/DD/YYYY'
     */
    format?: string;

    /**
     * Locale for formatting
     * @default 'en-US'
     */
    locale?: string;
  };

  /**
   * Boolean formatter options
   */
  boolean?: {
    /**
     * Text to display for true values
     * @default 'Yes'
     */
    trueText?: string;

    /**
     * Text to display for false values
     * @default 'No'
     */
    falseText?: string;

    /**
     * CSS class for true values
     */
    trueClass?: string;

    /**
     * CSS class for false values
     */
    falseClass?: string;
  };
}

/**
 * Table events
 * Note: These will only work on the client-side
 */
export interface TableEvents {
  /**
   * Called before a query is executed
   */
  beforeQuery?: any; // (params: any) => any

  /**
   * Called after data is loaded
   */
  afterLoad?: any; // (data: any[]) => any[]

  /**
   * Called when an error occurs
   */
  onError?: any; // (error: any) => void

  /**
   * Called when a row is selected
   */
  onSelect?: any; // (selected: any[]) => void

  /**
   * Called when a row is clicked
   */
  onRowClick?: any; // (row: any, index: number) => void

  /**
   * Called when a cell is clicked
   */
  onCellClick?: any; // (value: any, key: string, row: any) => void
}

/**
 * Export options
 */
export interface ExportOptions {
  /**
   * Export format
   */
  format: 'csv' | 'excel' | 'pdf';

  /**
   * File name
   * @default 'export'
   */
  fileName?: string;

  /**
   * Columns to include in the export
   */
  columns?: string[];

  /**
   * Whether to include headers
   * @default true
   */
  includeHeaders?: boolean;
}
