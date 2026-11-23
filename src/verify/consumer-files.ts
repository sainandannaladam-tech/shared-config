export interface ConsumerFiles {
  readonly fileNames: readonly string[];
  read(fileName: string): string | undefined;
}
