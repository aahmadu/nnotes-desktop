import * as d3 from 'd3';

type Link = {
  source: number;
  target: number;
  linkTag: string;
};

export function calculateLinkDistance(link: Link) {
  const minDistance = 70; // Minimum distance
  const characterWidth = 6; // Estimated average width per character in pixels
  const textLength = (link.linkTag.length) * characterWidth;
  return textLength < minDistance ? minDistance : textLength;
}

export function updateFontSize(baseFontSize, svg) {
  const currentZoomScale = d3.zoomTransform(svg.node()).k;
  const adjustedFontSize = baseFontSize / currentZoomScale;
  return adjustedFontSize;
}

export const colours = {
  node: '#808080',
  link: '#b5b5b5',
  selectedNode: '#1F2041',
  outLink: '#FA8334',
  inLink: '#00A9A5',
  nodeText: 'black',
  linkText: 'gray',
};
