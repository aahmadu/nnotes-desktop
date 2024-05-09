import { useEffect, useRef, FunctionComponent } from 'react';
import * as d3 from 'd3';

import { Note, Link } from '../../types/general';

interface GraphViewProps {
  allNotes: Note[];
  allLinks: Link[];
}

const GraphView: FunctionComponent<GraphViewProps> = function GraphView({
  allNotes,
  allLinks,
}) {
  const d3Container = useRef(null);
  const width = 227;
  const height = 691;

  useEffect(() => {
    const linksData = allLinks.map((link) => ({
      source: link.sourceID,
      target: link.targetID,
      linkTag: link.linkTag,
    }));

    const nodes = allNotes.map((d) => ({ ...d }));
    const links = linksData.map((d) => ({ ...d }));

    // Create a simulation with several forces.
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3.forceLink(links).id((d) => d.id),
      )
      .force('charge', d3.forceManyBody().strength(-100))
      .force('x', d3.forceX())
      .force('y', d3.forceY());
    const textDistance = 10;
    function zoomed(event) {
      const currentZoomScale = d3.zoomTransform(svg.node()).k;
      const adjustedTextDistance = textDistance / currentZoomScale;
      if (currentZoomScale > 1) {
        // Show text only when zoom scale is less than 1
        svg.selectAll('text')
          .style('display', 'block')
          .attr('dy', () => adjustedTextDistance);
      } else {
        // Hide text when zoom scale is 1 or greater
        svg.selectAll('text')
          .style('display', 'none');
      }
      svg.attr("transform", event.transform);
      svg.attr('font-size', () => updateFontSize());
    }
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4]) // Limit the zoom scale
      .on("zoom", zoomed);


    // Create the SVG container.
    const svg = d3
      .select(d3Container.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height])
      .attr('style', 'max-width: 100vh; height: auto; font-family: sans-serif;')

    const baseFontSize = 10; // Define the base font size

    // Define a function to update the font size based on the current zoom scale
    function updateFontSize() {
      const currentZoomScale = d3.zoomTransform(svg.node()).k;
      const adjustedFontSize = baseFontSize / currentZoomScale;
      return adjustedFontSize;
    }
    svg.attr('font-size', () => updateFontSize());



    // Clear SVG before redraw
    svg.selectAll('*').remove();

    // Per-type markers, as they don't inherit styles.
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', -0.5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', '#B0B0B0')
      .attr('d', 'M0,-5L10,0L0,5');

    svg.call(zoom);

    // Create links (edges)
    const link = svg
      .append('g')
      .attr('stroke', '#B0B0B0')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d) => Math.sqrt(d.value))
      .attr("marker-end", "url(#arrow)");;

    const node = svg
      .append('g')
      .attr('fill', 'currentColor')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(drag(simulation));

    node
      .append('circle')
      .attr('stroke', 'white')
      .attr('stroke-width', 1.5)
      .attr('r', 4);

    node
      .append('text')
      .attr('y', '1em')
      .text((d) => d.title)
      .attr('text-anchor', 'middle')
      .clone(true)
      .lower()
      .attr('fill', 'none')
      .attr('stroke', 'white')
      .attr('stroke-width', 1);

    // const node = svg.append('g').selectAll('g').data(nodes).join('g');

    // node.append('circle')
    //   .attr('r', 5)
    //   // .attr('fill', d => color(d.group))
    //   .attr('fill', d => 'gray')
    //   .call(drag(simulation));

    // node.append('text')
    //   .text(d => d.title)  // Assuming 'id' is what you want to display
    //   .attr('x', 0)
    //   .attr('y', 10)  // Offset y by 10 to position below the node
    //   .attr('text-anchor', 'middle')  // Centers text under the node
    //   .attr('fill', '#555')  // Text color
    //   .attr('font-size', '10px');

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x}, ${d.y})`);
    });

    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3
        .drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    // When this cell is re-run, stop the previous simulation. (This doesn’t
    // really matter since the target alpha is zero and the simulation will
    // stop naturally, but it’s a good practice.)
    // invalidation.then(() => simulation.stop());
  }, [allNotes, allLinks]);

  return (
    <svg
      ref={d3Container}
      width={'100vh'}
      height={'100vh'}
      style={{ display: 'block', overflow: 'hidden' }}
    />
  );
};

export default GraphView;
