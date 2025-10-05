declare module 'react-csv' {
  import React from 'react';

  interface CSVLinkProps {
    data: unknown[];
    headers?: { label: string; key: string }[];
    filename?: string;
    separator?: string;
    enclosingCharacter?: string;
    uFEFF?: boolean;
    children?: React.ReactNode;
    className?: string;
  }

  interface CSVDownloadProps extends CSVLinkProps {}

  export const CSVLink: React.ComponentType<CSVLinkProps>;
  export const CSVDownload: React.ComponentType<CSVDownloadProps>;
}
