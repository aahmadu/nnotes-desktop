export type Note = {
  id?: number;
  title?: string;
  content?: string;
  date?: string;
};

export type Link = {
  id?: number;
  source: number;
  target: number;
  linkTag: string;
};
