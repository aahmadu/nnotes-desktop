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
  const viewContainer = useRef(null);
  const d3Container = useRef(null);
  const width = 227;
  const height = 691;

  useEffect(() => {
    const nodes = allNotes.map((d) => ({ ...d }));
    const links = allLinks.map((link) => ({
      source: link.sourceID,
      target: link.targetID,
      linkTag: link.linkTag,
    }));

    function calculateLinkDistance(link) {
      const minDistance = 100; // Minimum distance
      const characterWidth = 6; // Estimated average width per character in pixels
      const textLength = (link.linkTag.length + 8) * characterWidth;
      console.log(textLength < minDistance ? minDistance : textLength);
      return textLength < minDistance ? minDistance : textLength;
    }

    // Create a simulation with several forces.
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(calculateLinkDistance),
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('x', d3.forceX())
      .force('y', d3.forceY());

    const textDistance = 6;
    function zoomed(event) {
      const { transform } = event;
      const currentZoomScale = transform.k;
      const adjustedTextDistance = textDistance; // / currentZoomScale;

      if (currentZoomScale > 1) {
        // Show text only when zoom scale is less than 1
        svg
          .selectAll('text')
          .style('display', 'block')
          .attr('dy', () => adjustedTextDistance);
      } else {
        // Hide text when zoom scale is 1 or greater
        svg.selectAll('text').style('display', 'none');
      }

      svg.attr(
        'transform',
        `translate(${transform.x - (width / 2) * (1 - transform.k)}, ${
          transform.y - (height / 2) * (1 - transform.k)
        }) scale(${transform.k})`,
      );
      //svg.attr('font-size', () => updateFontSize());
    }
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4]) // Limit the zoom scale
      .on('zoom', zoomed)
      .translateExtent([
        [-Infinity, -Infinity],
        [Infinity, Infinity],
      ]) // Allow unlimited panning
      .extent([
        [-width, -height],
        [width, height],
      ]) // Define the zoom extent
      .filter((event) => {
        // Enable inertia only when the Alt key is not pressed
        return !event?.sourceEvent?.altKey;
      })
      .wheelDelta((event) => {
        // Customize wheel delta to control the inertia speed
        return (
          -event.deltaY *
          (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002)
        );
      });

    // Wrap the SVG in a larger container
    const viewSpace = d3
      .select(viewContainer.current)
      .attr('class', 'svg-container');

    // Create the SVG container.
    const svg = d3
      .select(d3Container.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height])
      .attr(
        'style',
        'max-width: 100vh; height: auto; font-family: sans-serif; overflow: visible;',
      );

    // Attach zoom behavior to the larger container
    viewSpace.call(zoom);

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

    const linkGroup = svg
      .append('g')
      .attr('stroke', '#B0B0B0')
      .attr('stroke-opacity', 0.6);

    // Append lines for links
    const link = linkGroup
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('marker-end', 'url(#arrow)');

    // Append text for links
    const linkText = linkGroup
      .selectAll('.link-text')
      .data(links)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('class', 'link-text')
      .text((d) => d.linkTag); // Adjust to access appropriate label or data property;

    // simulation.force('link').distance((d) => d.textWidth + 30);

    // Create links (edges)
    // const link = svg
    //   .append('g')
    //   .attr('stroke', '#B0B0B0')
    //   .attr('stroke-opacity', 0.6)
    //   .selectAll('line')
    //   .data(links)
    //   .join('line')
    //   .attr('stroke-width', (d) => Math.sqrt(d.value))
    //   .attr("marker-end", "url(#arrow)");

    const node = svg
      .append('g')
      .attr('fill', 'gray')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(drag(simulation));

    node
      .append('circle')
      // .attr('stroke', 'white')
      // .attr('stroke-width', 1.5)
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

      // Position the text along the line
      linkText
        .attr('x', (d) => (d.source.x + d.target.x) / 2)
        .attr('y', (d) => (d.source.y + d.target.y) / 2)
        .attr('dy', -5) // You might need to adjust this based on your graph's scale
        .attr('transform', (d) => {
          let angle = Math.atan2(
            d.target.y - d.source.y,
            d.target.x - d.source.x,
          );
          if (angle > 90 || angle < -90) {
            angle = (angle + 180) % 360;  // Normalize angle to keep text upright
          }
          return `rotate(${(angle * 180) / Math.PI}, ${
            d.source.x + (d.target.x - d.source.x) / 2
          }, ${d.source.y + (d.target.y - d.source.y) / 2})`;
        });
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
    <div
      ref={viewContainer}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <svg ref={d3Container} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default GraphView;
