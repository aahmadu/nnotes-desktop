import * as d3 from 'd3';

type LinkLite = {
  linkTag: string;
};

export function calculateLinkDistance(link: LinkLite): number {
  const minDistance = 70; // Minimum distance
  const characterWidth = 6; // Estimated average width per character in pixels
  const textLength = (link.linkTag.length) * characterWidth;
  return textLength < minDistance ? minDistance : textLength;
}

export function updateFontSize(
  baseFontSize: number,
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
): number {
  const currentZoomScale = d3.zoomTransform(svg.node() as Element).k;
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
