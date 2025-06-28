declare module '*.mdx' {
  let MDXComponent: (props: any) => JSX.Element;
  export default MDXComponent;
}

declare module '@mdx-js/rollup' {
  interface MDXOptions {
    remarkPlugins?: any[];
    rehypePlugins?: any[];
    providerImportSource?: string;
  }
  
  function mdx(options?: MDXOptions): any;
  export default mdx;
}