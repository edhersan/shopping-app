import type { PropsWithChildren } from "react";
import { ScrollViewStyleReset } from "expo-router/html";

const responsiveBackground = `
body {
  background-color: #f8fafc;
}
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es" translate="no">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="google" content="notranslate" />
        <meta name="robots" content="notranslate" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body className="notranslate">{children}</body>
    </html>
  );
}
