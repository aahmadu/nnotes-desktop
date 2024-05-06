export type Note = {
  id: number;
  title: string;
  content: string;
  date: string;
};

export type Link = {
  id: number;
  sourceID: number;
  targetID: number;
  linkTag: string;
};
