// Same as one in `@taplo/lsp` but declare namespace cause error in runtime with
// current rollup config

export namespace Methods {
  /**
   * Sent from the client to the server.
   *
   * Convert a TOML text to JSON.
   */
  export namespace TomlToJson {
    export interface Params {
      /**
       * TOML text
       */
      text: string;
    }

    export interface Response {
      /**
       * JSON text
       */
      text?: string;
      errors?: string[];
    }

    export const METHOD = 'taplo/tomlToJson';
  }
  /**
   * Sent from the client to the server.
   *
   * Convert a JSON text to TOML.
   */
  export namespace JsonToToml {
    export interface Params {
      /**
       * JSON text
       */
      text: string;
    }

    export interface Response {
      /**
       * TOML text
       */
      text?: string;
      error?: string;
    }

    export const METHOD = 'taplo/jsonToToml';
  }
  /**
   * Sent from the client to the server.
   *
   * Print the syntax tree for a document for debugging.
   */
  export namespace SyntaxTree {
    export interface Params {
      /**
       * URI of the TOML document,
       * it must have been opened.
       */
      uri: string;
    }

    export interface Response {
      /**
       * The syntax tree.
       */
      text: string;
    }

    export const METHOD = 'taplo/syntaxTree';
  }
  /**
   * Sent from the server to the client.
   *
   * Used for showing a message to the user with
   * a button that navigates to the server's logs.
   */
  export namespace MessageWithOutput {
    export const enum MessageKind {
      Info = 'info',
      Warn = 'warn',
      Error = 'error',
    }

    export interface Params {
      kind: MessageKind;
      message: string;
    }

    export const METHOD = 'taplo/messageWithOutput';
  }
  /**
   * Sent from the client to the server.
   *
   * Set the path the server should use for caching,
   * this is optional.
   */
  export namespace CachePath {
    export interface Params {
      path: string;
    }

    export const METHOD = 'taplo/cachePath';
  }
}
